"""Number platform for simple_chores - per-assignee point goals."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.entity import DeviceInfo

from .const import DOMAIN, LOGGER, sanitize_entity_id
from .data import PointsStorage

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddEntitiesCallback

    from .config_loader import ConfigLoader
    from .models import SimpleChoresConfig

# We manage our own parallelism; async_set_native_value does its own I/O
# and there's nothing to poll.
PARALLEL_UPDATES = 0

MIN_POINT_GOAL = 0
MAX_POINT_GOAL = 1_000_000


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,  # noqa: ARG001
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the number platform from a config entry."""
    await _async_setup(hass, async_add_entities)


async def async_setup_platform(
    hass: HomeAssistant,
    config: dict,  # noqa: ARG001
    async_add_entities: AddEntitiesCallback,
    discovery_info: dict | None = None,  # noqa: ARG001
) -> None:
    """Set up the number platform from YAML configuration."""
    await _async_setup(hass, async_add_entities)


async def _async_setup(
    hass: HomeAssistant,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """
    Set up the point-goal number entities.

    Shares the config_loader and points_storage that __init__.py already
    created for the sensor platform (see its async_setup_entry docstring)
    rather than creating its own - points_storage in particular must stay a
    single shared instance, since it's one Store-backed file underneath.
    """
    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]
    points_storage: PointsStorage | None = hass.data[DOMAIN].get("points_storage")
    if points_storage is None:
        points_storage = PointsStorage(hass)
        hass.data[DOMAIN]["points_storage"] = points_storage

    manager = PointGoalManager(hass, async_add_entities, points_storage)
    await manager.async_setup(config_loader.config)

    hass.data[DOMAIN]["point_goal_numbers"] = manager.numbers

    config_loader.register_callback(manager.async_config_changed)


class PointGoalManager:
    """Creates and reconciles one point-goal number entity per assignee."""

    def __init__(
        self,
        hass: HomeAssistant,
        async_add_entities: AddEntitiesCallback,
        points_storage: PointsStorage,
    ) -> None:
        """Initialize the manager."""
        self.hass = hass
        self.async_add_entities = async_add_entities
        self.points_storage = points_storage
        self.numbers: dict[str, PointGoalNumber] = {}

    async def async_setup(self, config: SimpleChoresConfig) -> None:
        """Create the initial set of point-goal entities from configuration."""
        # Safe to call even if the sensor platform is concurrently loading
        # this same shared instance - see PointsStorage.async_load's
        # docstring.
        await self.points_storage.async_load()
        await self._sync_numbers(config)

    async def async_config_changed(self, config: SimpleChoresConfig) -> None:
        """Reconcile point-goal entities after a configuration change."""
        await self._sync_numbers(config)

    async def _sync_numbers(self, config: SimpleChoresConfig) -> None:
        """Create entities for new assignees, remove them for departed ones."""
        assignees = set()
        for chore in config.chores:
            assignees.update(chore.assignees)
        sanitized_assignees = {sanitize_entity_id(assignee) for assignee in assignees}

        numbers_to_remove = [
            sanitized
            for sanitized in self.numbers
            if sanitized not in sanitized_assignees
        ]
        for sanitized in numbers_to_remove:
            number = self.numbers.pop(sanitized)
            if number.hass is not None and hasattr(number, "platform"):
                try:
                    await number.async_remove()
                    LOGGER.debug("Removed point goal number for %s", sanitized)
                except Exception as err:  # noqa: BLE001 - best-effort cleanup
                    LOGGER.warning(
                        "Failed to remove point goal number %s: %s", sanitized, err
                    )

        numbers_to_add = []
        for assignee in assignees:
            sanitized = sanitize_entity_id(assignee)
            if sanitized not in self.numbers:
                number = PointGoalNumber(self.hass, assignee, self.points_storage)
                self.numbers[sanitized] = number
                numbers_to_add.append(number)
                LOGGER.debug("Created point goal number for assignee %s", assignee)

        if numbers_to_add:
            self.async_add_entities(numbers_to_add)


class PointGoalNumber(NumberEntity):
    """Settable per-assignee point goal, editable directly in the HA UI."""

    _attr_has_entity_name = False
    _attr_should_poll = False
    _attr_icon = "mdi:trophy-outline"
    _attr_mode = NumberMode.BOX
    _attr_native_min_value = MIN_POINT_GOAL
    _attr_native_max_value = MAX_POINT_GOAL
    _attr_native_step = 1

    def __init__(
        self,
        hass: HomeAssistant,
        assignee: str,
        points_storage: PointsStorage,
    ) -> None:
        """Initialize the point goal number entity."""
        self.hass = hass
        self._assignee = assignee
        self._points_storage = points_storage
        sanitized_assignee = sanitize_entity_id(assignee)
        self._attr_unique_id = f"{DOMAIN}_meta_{sanitized_assignee}_point_goal"
        self._attr_name = "Point goal"
        self.entity_id = f"number.simple_chore_meta_{sanitized_assignee}_point_goal"
        self._attr_native_value = points_storage.get_point_goal(assignee)

        # Group with this assignee's other entities (same device as their
        # chore sensors and summary - see sensor.py).
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, assignee)},
            name=f"{assignee.title()} - Chores",
            manufacturer="Simple Chores",
            model="Chore Tracker",
            entry_type=dr.DeviceEntryType.SERVICE,
            suggested_area="Household",
        )

    @property
    def assignee(self) -> str:
        """Return the assignee username."""
        return self._assignee

    @property
    def extra_state_attributes(self) -> dict[str, str]:
        """Return the state attributes."""
        return {"assignee": self._assignee}

    async def async_set_native_value(self, value: float) -> None:
        """Handle the user setting a new point goal."""
        goal = int(value)
        await self._points_storage.set_point_goal(self._assignee, goal)
        self._attr_native_value = goal
        self.async_write_ha_state()
        LOGGER.info("Point goal for %s set to %d", self._assignee, goal)

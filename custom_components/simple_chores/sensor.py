"""Sensor platform for simple_chores."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, LOGGER
from .models import ChoreConfig, ChoreState, SimpleChoresConfig

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .config_loader import ConfigLoader


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """
    Set up the sensor platform from a config entry.

    Args:
        hass: Home Assistant instance
        entry: Config entry
        async_add_entities: Callback to add entities

    """
    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    # Create entity manager
    manager = ChoreSensorManager(hass, async_add_entities, config_loader)
    await manager.async_setup()

    # Store sensors in hass.data for service access
    hass.data[DOMAIN]["sensors"] = manager.sensors

    # Register callback for config changes
    config_loader.register_callback(manager.async_config_changed)


async def async_setup_platform(
    hass: HomeAssistant,
    config: dict,
    async_add_entities: AddEntitiesCallback,
    discovery_info: dict | None = None,
) -> None:
    """
    Set up the sensor platform from YAML configuration.

    Args:
        hass: Home Assistant instance
        config: Platform configuration (unused)
        async_add_entities: Callback to add entities
        discovery_info: Discovery info (unused)

    """
    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    # Create entity manager
    manager = ChoreSensorManager(hass, async_add_entities, config_loader)
    await manager.async_setup()

    # Store sensors in hass.data for service access
    hass.data[DOMAIN]["sensors"] = manager.sensors

    # Register callback for config changes
    config_loader.register_callback(manager.async_config_changed)


class ChoreSensorManager:
    """Manages chore sensors based on configuration."""

    def __init__(
        self,
        hass: HomeAssistant,
        async_add_entities: AddEntitiesCallback,
        config_loader: ConfigLoader,
    ) -> None:
        """
        Initialize the sensor manager.

        Args:
            hass: Home Assistant instance
            async_add_entities: Callback to add entities
            config_loader: Configuration loader

        """
        self.hass = hass
        self.async_add_entities = async_add_entities
        self.config_loader = config_loader
        self.sensors: dict[str, ChoreSensor] = {}

    async def async_setup(self) -> None:
        """Set up initial sensors from configuration."""
        config = self.config_loader.config
        await self._create_sensors_from_config(config)

    async def async_config_changed(self, config: SimpleChoresConfig) -> None:
        """
        Handle configuration changes.

        Args:
            config: New configuration

        """
        LOGGER.debug("Config changed, updating sensors")
        await self._update_sensors_from_config(config)

    async def _create_sensors_from_config(self, config: SimpleChoresConfig) -> None:
        """
        Create sensors from configuration.

        Args:
            config: Configuration to create sensors from

        """
        sensors_to_add = []

        for chore in config.chores:
            for assignee in chore.assignees:
                entity_id = f"{assignee}_{chore.slug}"

                if entity_id not in self.sensors:
                    sensor = ChoreSensor(self.hass, chore, assignee)
                    self.sensors[entity_id] = sensor
                    sensors_to_add.append(sensor)
                    LOGGER.debug(
                        "Created sensor for chore %s, assignee %s",
                        chore.slug,
                        assignee,
                    )

        if sensors_to_add:
            self.async_add_entities(sensors_to_add)
            LOGGER.info("Added %d chore sensor(s)", len(sensors_to_add))

    async def _update_sensors_from_config(self, config: SimpleChoresConfig) -> None:
        """
        Update sensors based on new configuration.

        Args:
            config: New configuration

        """
        # Build set of expected entity IDs from config
        expected_entities = set()
        for chore in config.chores:
            for assignee in chore.assignees:
                expected_entities.add(f"{assignee}_{chore.slug}")

        # Remove sensors that are no longer in config
        sensors_to_remove = []
        for entity_id, sensor in self.sensors.items():
            if entity_id not in expected_entities:
                sensors_to_remove.append(entity_id)
                # Remove the entity - only if it's properly initialized
                if sensor.hass is not None and hasattr(sensor, "platform"):
                    try:
                        await sensor.async_remove()
                        LOGGER.debug("Removed sensor %s", entity_id)
                    except Exception as err:
                        LOGGER.warning("Failed to remove sensor %s: %s", entity_id, err)
                else:
                    LOGGER.debug(
                        "Sensor %s not yet registered, skipping removal", entity_id
                    )

        for entity_id in sensors_to_remove:
            del self.sensors[entity_id]

        if sensors_to_remove:
            LOGGER.info("Removed %d chore sensor(s)", len(sensors_to_remove))

        # Update existing sensors and create new ones
        sensors_to_add = []
        for chore in config.chores:
            for assignee in chore.assignees:
                entity_id = f"{assignee}_{chore.slug}"

                if entity_id in self.sensors:
                    # Update existing sensor
                    sensor = self.sensors[entity_id]
                    sensor.update_chore_config(chore)
                    LOGGER.debug("Updated sensor %s", entity_id)
                else:
                    # Create new sensor
                    sensor = ChoreSensor(self.hass, chore, assignee)
                    self.sensors[entity_id] = sensor
                    sensors_to_add.append(sensor)
                    LOGGER.debug("Created sensor %s", entity_id)

        if sensors_to_add:
            self.async_add_entities(sensors_to_add)
            LOGGER.info("Added %d chore sensor(s)", len(sensors_to_add))


class ChoreSensor(SensorEntity):
    """Sensor representing a chore for a specific assignee."""

    _attr_has_entity_name = False
    _attr_should_poll = False

    def __init__(
        self,
        hass: HomeAssistant,
        chore: ChoreConfig,
        assignee: str,
    ) -> None:
        """
        Initialize the chore sensor.

        Args:
            hass: Home Assistant instance
            chore: Chore configuration
            assignee: Username of the assignee

        """
        self.hass = hass
        self._chore = chore
        self._assignee = assignee
        self._attr_unique_id = f"{DOMAIN}_{assignee}_{chore.slug}"
        self._attr_name = f"{chore.name} - {assignee}"

        # Set entity ID to match requirements: sensor.simple_chore_{assignee}_{slug}
        self.entity_id = f"sensor.simple_chore_{assignee}_{chore.slug}"

        # Use chore-specific icon
        self._attr_icon = chore.icon

        # Set device info to group all chores for this person
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, assignee)},
            name=f"{assignee.title()} - Chores",
            manufacturer="Simple Chores",
            model="Chore Tracker",
            entry_type=dr.DeviceEntryType.SERVICE,
            suggested_area="Household",
        )

        # Initialize state - use restore state if available
        self._attr_native_value = ChoreState.NOT_REQUESTED.value

        # Store state in hass.data for persistence across reloads
        if DOMAIN not in self.hass.data:
            self.hass.data[DOMAIN] = {}
        if "states" not in self.hass.data[DOMAIN]:
            self.hass.data[DOMAIN]["states"] = {}

        # Restore previous state if it exists
        state_key = f"{assignee}_{chore.slug}"
        if state_key in self.hass.data[DOMAIN]["states"]:
            self._attr_native_value = self.hass.data[DOMAIN]["states"][state_key]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """
        Return the state attributes.

        Returns:
            Dictionary of state attributes

        """
        return {
            "chore_name": self._chore.name,
            "chore_slug": self._chore.slug,
            "description": self._chore.description,
            "frequency": self._chore.frequency.value,
            "assignee": self._assignee,
            "all_assignees": self._chore.assignees,
            "icon": self._chore.icon,
        }

    def update_chore_config(self, chore: ChoreConfig) -> None:
        """
        Update the chore configuration.

        Args:
            chore: New chore configuration

        """
        self._chore = chore
        self._attr_name = f"{chore.name} - {self._assignee}"
        self._attr_icon = chore.icon
        self.async_write_ha_state()

    def set_state(self, state: ChoreState) -> None:
        """
        Set the chore state.

        Args:
            state: New state for the chore

        """
        self._attr_native_value = state.value

        # Persist state
        state_key = f"{self._assignee}_{self._chore.slug}"
        self.hass.data[DOMAIN]["states"][state_key] = state.value

        # Update icon based on state
        if state == ChoreState.COMPLETE:
            self._attr_icon = "mdi:check-circle"
        elif state == ChoreState.PENDING:
            self._attr_icon = "mdi:clipboard-list"
        else:  # NOT_REQUESTED
            self._attr_icon = "mdi:clipboard-list-outline"

        self.async_write_ha_state()

"""Sensor platform for simple_chores."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN, LOGGER, sanitize_entity_id
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
    hass.data[DOMAIN]["summary_sensors"] = manager.summary_sensors

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
        self.summary_sensors: dict[str, ChoreSummarySensor] = {}  # type: ignore[name-defined]

    async def async_setup(self) -> None:
        """Set up initial sensors from configuration."""
        config = self.config_loader.config
        await self._create_sensors_from_config(config)
        await self._create_summary_sensors(config)

    async def async_config_changed(self, config: SimpleChoresConfig) -> None:
        """
        Handle configuration changes.

        Args:
            config: New configuration

        """
        LOGGER.debug("Config changed, updating sensors")
        await self._update_sensors_from_config(config)
        await self._update_summary_sensors(config)

    async def _create_sensors_from_config(self, config: SimpleChoresConfig) -> None:
        """
        Create sensors from configuration.

        Args:
            config: Configuration to create sensors from

        """
        sensors_to_add = []

        for chore in config.chores:
            for assignee in chore.assignees:
                entity_id = (
                    f"{sanitize_entity_id(assignee)}_{sanitize_entity_id(chore.slug)}"
                )

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
                expected_entities.add(
                    f"{sanitize_entity_id(assignee)}_{sanitize_entity_id(chore.slug)}"
                )

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

    async def _create_summary_sensors(self, config: SimpleChoresConfig) -> None:
        """
        Create summary sensors for each assignee.

        Args:
            config: Configuration to create summary sensors from

        """
        # Get unique assignees
        assignees = set()
        for chore in config.chores:
            assignees.update(chore.assignees)

        summary_sensors_to_add = []
        for assignee in assignees:
            if assignee not in self.summary_sensors:
                summary_sensor = ChoreSummarySensor(self.hass, assignee, self)
                self.summary_sensors[assignee] = summary_sensor
                summary_sensors_to_add.append(summary_sensor)
                LOGGER.debug("Created summary sensor for assignee %s", assignee)

        if summary_sensors_to_add:
            self.async_add_entities(summary_sensors_to_add)
            LOGGER.info("Added %d summary sensor(s)", len(summary_sensors_to_add))

    async def _update_summary_sensors(self, config: SimpleChoresConfig) -> None:
        """
        Update summary sensors based on new configuration.

        Args:
            config: New configuration

        """
        # Get unique assignees from new config
        assignees = set()
        for chore in config.chores:
            assignees.update(chore.assignees)

        # Remove summary sensors for assignees no longer in config
        summary_sensors_to_remove = []
        for assignee, sensor in list(self.summary_sensors.items()):
            if assignee not in assignees:
                summary_sensors_to_remove.append(assignee)
                if sensor.hass is not None and hasattr(sensor, "platform"):
                    try:
                        await sensor.async_remove()
                        LOGGER.debug("Removed summary sensor for %s", assignee)
                    except Exception as err:
                        LOGGER.warning(
                            "Failed to remove summary sensor %s: %s", assignee, err
                        )

        for assignee in summary_sensors_to_remove:
            del self.summary_sensors[assignee]

        if summary_sensors_to_remove:
            LOGGER.info("Removed %d summary sensor(s)", len(summary_sensors_to_remove))

        # Create new summary sensors for new assignees
        summary_sensors_to_add = []
        for assignee in assignees:
            if assignee not in self.summary_sensors:
                summary_sensor = ChoreSummarySensor(self.hass, assignee, self)
                self.summary_sensors[assignee] = summary_sensor
                summary_sensors_to_add.append(summary_sensor)
                LOGGER.debug("Created summary sensor for assignee %s", assignee)

        if summary_sensors_to_add:
            self.async_add_entities(summary_sensors_to_add)
            LOGGER.info("Added %d summary sensor(s)", len(summary_sensors_to_add))

        # Update all existing summary sensors - schedule immediate updates
        if self.summary_sensors:
            for summary_sensor in self.summary_sensors.values():
                summary_sensor.async_schedule_update_ha_state(force_refresh=True)


class ChoreSensor(RestoreEntity, SensorEntity):
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
        sanitized_assignee = sanitize_entity_id(assignee)
        sanitized_slug = sanitize_entity_id(chore.slug)
        self._attr_unique_id = f"{DOMAIN}_{sanitized_assignee}_{sanitized_slug}"
        self._attr_name = f"{chore.name} - {assignee}"

        # Set entity ID to match requirements: sensor.simple_chore_{assignee}_{slug}
        self.entity_id = f"sensor.simple_chore_{sanitized_assignee}_{sanitized_slug}"

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

        # Initialize state - will be restored in async_added_to_hass if available
        self._attr_native_value = ChoreState.NOT_REQUESTED.value

    async def async_added_to_hass(self) -> None:
        """Restore previous state when entity is added to hass."""
        await super().async_added_to_hass()

        # Restore state from previous session
        last_state = await self.async_get_last_state()
        if last_state is not None and last_state.state in [
            ChoreState.NOT_REQUESTED.value,
            ChoreState.PENDING.value,
            ChoreState.COMPLETE.value,
        ]:
            self._attr_native_value = last_state.state
            LOGGER.debug(
                "Restored state for %s: %s",
                self.entity_id,
                last_state.state,
            )

    @property
    def chore(self) -> ChoreConfig:
        """
        Return the chore configuration.

        Returns:
            ChoreConfig: The chore configuration

        """
        return self._chore

    @property
    def assignee(self) -> str:
        """
        Return the assignee username.

        Returns:
            str: The assignee username

        """
        return self._assignee

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

    async def set_state(self, state: ChoreState) -> None:
        """
        Set the chore state.

        Args:
            state: New state for the chore

        """
        self._attr_native_value = state.value

        # Use async_update_ha_state to ensure the state is written before returning
        await self.async_update_ha_state(force_refresh=True)

        # Update summary sensor for this assignee
        if DOMAIN in self.hass.data and "summary_sensors" in self.hass.data[DOMAIN]:
            summary_sensors = self.hass.data[DOMAIN]["summary_sensors"]
            if self._assignee in summary_sensors:
                # Await the summary sensor update to ensure it completes
                await summary_sensors[self._assignee].async_update_ha_state(
                    force_refresh=True
                )


class ChoreSummarySensor(SensorEntity):
    """Summary sensor showing pending chore count for an assignee."""

    _attr_has_entity_name = False
    _attr_should_poll = False
    _attr_native_unit_of_measurement = "chores"
    _attr_icon = "mdi:format-list-checks"

    def __init__(
        self,
        hass: HomeAssistant,
        assignee: str,
        manager: ChoreSensorManager,
    ) -> None:
        """
        Initialize the summary sensor.

        Args:
            hass: Home Assistant instance
            assignee: Username of the assignee
            manager: Sensor manager to access chore sensors

        """
        self.hass = hass
        self._assignee = assignee
        self._manager = manager
        sanitized_assignee = sanitize_entity_id(assignee)
        self._attr_unique_id = f"{DOMAIN}_meta_{sanitized_assignee}_summary"
        self._attr_name = "Summary"

        # Set entity ID
        self.entity_id = f"sensor.simple_chore_meta_{sanitized_assignee}_summary"

        # Set device info to group with other chores for this person
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, assignee)},
            name=f"{assignee.title()} - Chores",
            manufacturer="Simple Chores",
            model="Chore Tracker",
            entry_type=dr.DeviceEntryType.SERVICE,
            suggested_area="Household",
        )

    async def async_update(self) -> None:
        """Update the sensor.

        This method doesn't fetch data since we compute everything from properties,
        but implementing it ensures Home Assistant re-evaluates our properties
        when force_refresh=True is used.
        """
        # Properties are computed dynamically from manager.sensors
        # This method just needs to exist to trigger property re-evaluation
        pass

    @property
    def native_value(self) -> int:
        """
        Return the number of pending chores.

        Returns:
            Count of pending chores for this assignee

        """
        pending_count = 0
        for sensor in self._manager.sensors.values():
            if (
                sensor.assignee == self._assignee
                and sensor.native_value == ChoreState.PENDING.value
            ):
                pending_count += 1
        return pending_count

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """
        Return the state attributes.

        Returns:
            Dictionary of state attributes with entity IDs by state

        """
        pending_entities = []
        complete_entities = []
        not_requested_entities = []

        for entity_id, sensor in self._manager.sensors.items():
            if sensor.assignee == self._assignee:
                full_entity_id = f"sensor.simple_chore_{entity_id}"
                current_state = sensor.native_value

                if current_state == ChoreState.PENDING.value:
                    pending_entities.append(full_entity_id)
                elif current_state == ChoreState.COMPLETE.value:
                    complete_entities.append(full_entity_id)
                elif current_state == ChoreState.NOT_REQUESTED.value:
                    not_requested_entities.append(full_entity_id)

        all_entities = pending_entities + complete_entities + not_requested_entities

        return {
            "assignee": self._assignee,
            "pending_chores": pending_entities,
            "complete_chores": complete_entities,
            "not_requested_chores": not_requested_entities,
            "all_chores": all_entities,
            "total_chores": len(all_entities),
        }

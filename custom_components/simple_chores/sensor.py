"""Sensor platform for simple_chores."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.restore_state import RestoreEntity

from .const import DOMAIN, LOGGER, sanitize_entity_id
from .data import PointsStorage
from .models import (
    ChoreConfig,
    ChoreState,
    PrivilegeBehavior,
    PrivilegeConfig,
    PrivilegeState,
    SimpleChoresConfig,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .config_loader import ConfigLoader


# We manage our own parallelism using asyncio.gather() in services.py
# Our async_update() is empty, so there's no I/O to limit
PARALLEL_UPDATES = 0


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

    # Store sensors and points storage in hass.data for service access
    hass.data[DOMAIN]["sensors"] = manager.sensors
    hass.data[DOMAIN]["summary_sensors"] = manager.summary_sensors
    hass.data[DOMAIN]["privilege_sensors"] = manager.privilege_sensors
    hass.data[DOMAIN]["points_storage"] = manager.points_storage
    hass.data[DOMAIN]["sensor_manager"] = manager
    LOGGER.debug(
        "Stored %d chore sensors, %d summary sensors, %d privilege sensors in hass.data (config entry setup)",
        len(manager.sensors),
        len(manager.summary_sensors),
        len(manager.privilege_sensors),
    )

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

    # Store sensors and points storage in hass.data for service access
    hass.data[DOMAIN]["sensors"] = manager.sensors
    hass.data[DOMAIN]["summary_sensors"] = manager.summary_sensors
    hass.data[DOMAIN]["privilege_sensors"] = manager.privilege_sensors
    hass.data[DOMAIN]["points_storage"] = manager.points_storage
    hass.data[DOMAIN]["sensor_manager"] = manager
    LOGGER.debug(
        "Stored %d chore sensors, %d summary sensors, %d privilege sensors in hass.data (YAML setup)",
        len(manager.sensors),
        len(manager.summary_sensors),
        len(manager.privilege_sensors),
    )

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
        self.privilege_sensors: dict[str, PrivilegeSensor] = {}  # type: ignore[name-defined]
        self.points_storage = PointsStorage(hass)

    async def async_setup(self) -> None:
        """Set up initial sensors from configuration."""
        await self.points_storage.async_load()
        config = self.config_loader.config
        await self._create_sensors_from_config(config)
        await self._create_privilege_sensors(config)
        await self._create_summary_sensors(config)

    async def async_config_changed(self, config: SimpleChoresConfig) -> None:
        """
        Handle configuration changes.

        Args:
            config: New configuration

        """
        LOGGER.debug("Config changed, updating sensors")
        await self._update_sensors_from_config(config)
        await self._update_privilege_sensors(config)
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

        # Update all existing summary sensors - batch updates for consistency
        if self.summary_sensors:
            update_tasks = []
            for summary_sensor in self.summary_sensors.values():
                update_tasks.append(
                    summary_sensor.async_update_ha_state(force_refresh=True)
                )
            if update_tasks:
                await asyncio.gather(*update_tasks)

    async def _create_privilege_sensors(self, config: SimpleChoresConfig) -> None:
        """
        Create privilege sensors from configuration.

        Args:
            config: Configuration to create sensors from

        """
        sensors_to_add = []

        for privilege in config.privileges:
            for assignee in privilege.assignees:
                entity_id = f"{sanitize_entity_id(assignee)}_{sanitize_entity_id(privilege.slug)}"

                if entity_id not in self.privilege_sensors:
                    sensor = PrivilegeSensor(self.hass, privilege, assignee, self)
                    self.privilege_sensors[entity_id] = sensor
                    sensors_to_add.append(sensor)
                    LOGGER.debug(
                        "Created privilege sensor for privilege %s, assignee %s",
                        privilege.slug,
                        assignee,
                    )

        if sensors_to_add:
            self.async_add_entities(sensors_to_add)
            LOGGER.info("Added %d privilege sensor(s)", len(sensors_to_add))

    async def _update_privilege_sensors(self, config: SimpleChoresConfig) -> None:
        """
        Update privilege sensors based on new configuration.

        Args:
            config: New configuration

        """
        # Build set of expected entity IDs from config
        expected_entities = set()
        for privilege in config.privileges:
            for assignee in privilege.assignees:
                expected_entities.add(
                    f"{sanitize_entity_id(assignee)}_{sanitize_entity_id(privilege.slug)}"
                )

        # Remove sensors that are no longer in config
        sensors_to_remove = []
        for entity_id, sensor in self.privilege_sensors.items():
            if entity_id not in expected_entities:
                sensors_to_remove.append(entity_id)
                if sensor.hass is not None and hasattr(sensor, "platform"):
                    try:
                        await sensor.async_remove()
                        LOGGER.debug("Removed privilege sensor %s", entity_id)
                    except Exception as err:
                        LOGGER.warning(
                            "Failed to remove privilege sensor %s: %s", entity_id, err
                        )
                else:
                    LOGGER.debug(
                        "Privilege sensor %s not yet registered, skipping removal",
                        entity_id,
                    )

        for entity_id in sensors_to_remove:
            del self.privilege_sensors[entity_id]

        if sensors_to_remove:
            LOGGER.info("Removed %d privilege sensor(s)", len(sensors_to_remove))

        # Update existing sensors and create new ones
        sensors_to_add = []
        for privilege in config.privileges:
            for assignee in privilege.assignees:
                entity_id = f"{sanitize_entity_id(assignee)}_{sanitize_entity_id(privilege.slug)}"

                if entity_id in self.privilege_sensors:
                    # Update existing sensor
                    sensor = self.privilege_sensors[entity_id]
                    sensor.update_privilege_config(privilege)
                    LOGGER.debug("Updated privilege sensor %s", entity_id)
                else:
                    # Create new sensor
                    sensor = PrivilegeSensor(self.hass, privilege, assignee, self)
                    self.privilege_sensors[entity_id] = sensor
                    sensors_to_add.append(sensor)
                    LOGGER.debug("Created privilege sensor %s", entity_id)

        if sensors_to_add:
            self.async_add_entities(sensors_to_add)
            LOGGER.info("Added %d privilege sensor(s)", len(sensors_to_add))


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
            "points": self._chore.points,
        }

    def get_state(self) -> str:
        """
        Get the current state value.

        Returns:
            str: The current state value

        """
        return self._attr_native_value

    def set_state(self, state: str) -> None:
        """
        Set the state value.

        Args:
            state: The new state value

        """
        self._attr_native_value = state

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

        # Initialize cached values with defaults
        # These will be updated by async_update()
        self._pending_count = 0
        self._cached_attributes = {
            "assignee": self._assignee,
            "pending_chores": [],
            "complete_chores": [],
            "not_requested_chores": [],
            "all_chores": [],
            "total_chores": 0,
            "total_points": 0,
            "points_earned": 0,
            "points_missed": 0,
            "points_possible": 0,
            "privileges": [],
        }

    async def async_added_to_hass(self) -> None:
        """Called when entity is added to hass - populate cache with initial data."""
        await super().async_added_to_hass()
        LOGGER.debug(
            "Summary sensor for %s added to Home Assistant, initializing cache",
            self._assignee,
        )
        await self.async_update()

    async def async_update(self) -> None:
        """
        Update the sensor by computing current values from chore sensors.

        This follows the standard Home Assistant pattern:
        - Compute/fetch data here
        - Cache it in instance variables
        - Properties return the cached values
        """
        pending_entities = []
        complete_entities = []
        not_requested_entities = []
        pending_count = 0
        pending_points = 0

        for entity_id, sensor in self._manager.sensors.items():
            if sensor.assignee == self._assignee:
                full_entity_id = f"sensor.simple_chore_{entity_id}"
                # Read from _attr_native_value directly to get the most current state.
                # This ensures we see updates immediately, even before the state machine updates.
                current_state = sensor._attr_native_value  # noqa: SLF001

                if current_state == ChoreState.PENDING.value:
                    pending_entities.append(full_entity_id)
                    pending_count += 1
                    pending_points += sensor.chore.points
                elif current_state == ChoreState.COMPLETE.value:
                    complete_entities.append(full_entity_id)
                elif current_state == ChoreState.NOT_REQUESTED.value:
                    not_requested_entities.append(full_entity_id)

        all_entities = pending_entities + complete_entities + not_requested_entities

        # Get points data
        total_points = self._manager.points_storage.get_points(self._assignee)
        points_earned = self._manager.points_storage.get_points_earned(self._assignee)
        points_missed = self._manager.points_storage.get_points_missed(self._assignee)
        points_possible = points_earned + points_missed + pending_points

        # Build privileges list (entity IDs only, matching chore list pattern)
        privileges_list = []
        for entity_id, priv_sensor in self._manager.privilege_sensors.items():
            if priv_sensor.assignee == self._assignee:
                full_entity_id = f"sensor.simple_chore_privilege_{entity_id}"
                privileges_list.append(full_entity_id)

        # Cache the computed values
        self._pending_count = pending_count
        self._cached_attributes = {
            "assignee": self._assignee,
            "pending_chores": pending_entities,
            "complete_chores": complete_entities,
            "not_requested_chores": not_requested_entities,
            "all_chores": all_entities,
            "total_chores": len(all_entities),
            "total_points": total_points,
            "points_earned": points_earned,
            "points_missed": points_missed,
            "points_possible": points_possible,
            "privileges": privileges_list,
        }

        LOGGER.debug(
            "Summary sensor updated for %s: %d pending, %d complete, %d not_requested, "
            "points(total=%d, earned=%d, missed=%d, possible=%d)",
            self._assignee,
            pending_count,
            len(complete_entities),
            len(not_requested_entities),
            total_points,
            points_earned,
            points_missed,
            points_possible,
        )

    @property
    def native_value(self) -> int:
        """
        Return the number of pending chores.

        Returns:
            Count of pending chores for this assignee (from cached value)

        """
        return self._pending_count

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """
        Return the state attributes.

        Returns:
            Dictionary of state attributes (from cached values)

        """
        return self._cached_attributes


class PrivilegeSensor(RestoreEntity, SensorEntity):
    """Sensor representing a privilege for a specific assignee."""

    _attr_has_entity_name = False
    _attr_should_poll = False

    def __init__(
        self,
        hass: HomeAssistant,
        privilege: PrivilegeConfig,
        assignee: str,
        manager: ChoreSensorManager,
    ) -> None:
        """
        Initialize the privilege sensor.

        Args:
            hass: Home Assistant instance
            privilege: Privilege configuration
            assignee: Username of the assignee
            manager: Sensor manager to access chore sensors and storage

        """
        self.hass = hass
        self._privilege = privilege
        self._assignee = assignee
        self._manager = manager
        sanitized_assignee = sanitize_entity_id(assignee)
        sanitized_slug = sanitize_entity_id(privilege.slug)
        self._attr_unique_id = (
            f"{DOMAIN}_privilege_{sanitized_assignee}_{sanitized_slug}"
        )
        self._attr_name = f"{privilege.name} - {assignee}"

        # Set entity ID: sensor.simple_chore_privilege_{assignee}_{slug}
        self.entity_id = (
            f"sensor.simple_chore_privilege_{sanitized_assignee}_{sanitized_slug}"
        )

        # Use privilege-specific icon
        self._attr_icon = privilege.icon

        # Set device info to group all privileges/chores for this person
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, assignee)},
            name=f"{assignee.title()} - Chores",
            manufacturer="Simple Chores",
            model="Chore Tracker",
            entry_type=dr.DeviceEntryType.SERVICE,
            suggested_area="Household",
        )

        # Initialize state - will be restored/computed in async_added_to_hass
        self._attr_native_value = PrivilegeState.DISABLED.value
        self._disable_until: datetime | None = None

    async def async_added_to_hass(self) -> None:
        """Restore previous state when entity is added to hass."""
        await super().async_added_to_hass()

        # Restore state from storage
        stored_state = self._manager.points_storage.get_privilege_state(
            self._assignee, self._privilege.slug
        )
        if stored_state in [
            PrivilegeState.ENABLED.value,
            PrivilegeState.DISABLED.value,
            PrivilegeState.TEMPORARILY_DISABLED.value,
        ]:
            self._attr_native_value = stored_state
            LOGGER.debug(
                "Restored privilege state for %s: %s",
                self.entity_id,
                stored_state,
            )

        # Restore temporary disable end time
        self._disable_until = self._manager.points_storage.get_privilege_disable_until(
            self._assignee, self._privilege.slug
        )

        # Check if temporary disable has expired
        if self._attr_native_value == PrivilegeState.TEMPORARILY_DISABLED.value:
            if self._disable_until and datetime.now(UTC) >= self._disable_until:
                # Expired, transition back based on behavior
                await self._check_and_update_state()

    @property
    def privilege(self) -> PrivilegeConfig:
        """Return the privilege configuration."""
        return self._privilege

    @property
    def assignee(self) -> str:
        """Return the assignee username."""
        return self._assignee

    @property
    def disable_until(self) -> datetime | None:
        """Return the temporary disable end time."""
        return self._disable_until

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the state attributes."""
        attrs = {
            "privilege_name": self._privilege.name,
            "privilege_slug": self._privilege.slug,
            "assignee": self._assignee,
            "behavior": self._privilege.behavior.value,
            "linked_chores": self._privilege.linked_chores,
            "icon": self._privilege.icon,
        }
        if self._disable_until:
            attrs["disable_until"] = self._disable_until.isoformat()
        return attrs

    def get_state(self) -> str:
        """Get the current state value."""
        return self._attr_native_value

    def set_state(self, state: str) -> None:
        """Set the state value."""
        self._attr_native_value = state

    def update_privilege_config(self, privilege: PrivilegeConfig) -> None:
        """Update the privilege configuration."""
        self._privilege = privilege
        self._attr_name = f"{privilege.name} - {self._assignee}"
        self._attr_icon = privilege.icon
        self.async_write_ha_state()

    def _are_linked_chores_complete(self) -> bool:
        """Check if all linked chores are complete for this assignee.

        If linked_chores is empty, checks that ALL requested chores (pending or
        complete) for this assignee are complete. This allows privileges to be
        granted when "all chores are done" without listing each one explicitly.
        """
        if not self._privilege.linked_chores:
            # No specific chores linked - check ALL requested chores for this assignee
            has_requested_chores = False
            for sensor_id, sensor in self._manager.sensors.items():
                if sensor.assignee != self._assignee:
                    continue
                state = sensor.get_state()
                # Only consider chores that have been requested (pending or complete)
                if state == ChoreState.PENDING.value:
                    # Has a pending chore - not all done
                    return False
                if state == ChoreState.COMPLETE.value:
                    has_requested_chores = True
            # Return True only if there's at least one completed chore
            # (prevents enabling when no chores have been requested at all)
            return has_requested_chores

        for chore_slug in self._privilege.linked_chores:
            sensor_id = (
                f"{sanitize_entity_id(self._assignee)}_{sanitize_entity_id(chore_slug)}"
            )
            sensor = self._manager.sensors.get(sensor_id)
            if not sensor:
                # If sensor doesn't exist, chore is not complete
                LOGGER.debug(
                    "Linked chore sensor not found: %s for privilege %s",
                    sensor_id,
                    self._privilege.slug,
                )
                return False
            if sensor.get_state() != ChoreState.COMPLETE.value:
                return False
        return True

    async def _check_and_update_state(self) -> None:
        """Check linked chores and update state for automatic behavior."""
        if self._privilege.behavior != PrivilegeBehavior.AUTOMATIC:
            return

        # Check if temporarily disabled and not expired
        if self._attr_native_value == PrivilegeState.TEMPORARILY_DISABLED.value:
            if self._disable_until and datetime.now(UTC) < self._disable_until:
                # Still temporarily disabled
                return
            # Expired, clear the disable time
            self._disable_until = None
            await self._manager.points_storage.set_privilege_disable_until(
                self._assignee, self._privilege.slug, None
            )

        # Determine new state based on linked chores
        if self._are_linked_chores_complete():
            new_state = PrivilegeState.ENABLED.value
        else:
            new_state = PrivilegeState.DISABLED.value

        if self._attr_native_value != new_state:
            self._attr_native_value = new_state
            await self._manager.points_storage.set_privilege_state(
                self._assignee, self._privilege.slug, new_state
            )
            LOGGER.info(
                "Privilege '%s' for %s automatically changed to %s",
                self._privilege.name,
                self._assignee,
                new_state,
            )

    async def async_enable(self) -> None:
        """Enable the privilege (manual action)."""
        # Clear any temporary disable
        self._disable_until = None
        await self._manager.points_storage.set_privilege_disable_until(
            self._assignee, self._privilege.slug, None
        )

        self._attr_native_value = PrivilegeState.ENABLED.value
        await self._manager.points_storage.set_privilege_state(
            self._assignee, self._privilege.slug, PrivilegeState.ENABLED.value
        )
        LOGGER.info(
            "Privilege '%s' manually enabled for %s",
            self._privilege.name,
            self._assignee,
        )

    async def async_disable(self) -> None:
        """Disable the privilege (manual action)."""
        # Clear any temporary disable
        self._disable_until = None
        await self._manager.points_storage.set_privilege_disable_until(
            self._assignee, self._privilege.slug, None
        )

        self._attr_native_value = PrivilegeState.DISABLED.value
        await self._manager.points_storage.set_privilege_state(
            self._assignee, self._privilege.slug, PrivilegeState.DISABLED.value
        )
        LOGGER.info(
            "Privilege '%s' manually disabled for %s",
            self._privilege.name,
            self._assignee,
        )

    async def async_temporarily_disable(self, duration_minutes: int) -> None:
        """Temporarily disable the privilege for a duration."""
        self._disable_until = datetime.now(UTC) + __import__("datetime").timedelta(
            minutes=duration_minutes
        )
        await self._manager.points_storage.set_privilege_disable_until(
            self._assignee, self._privilege.slug, self._disable_until
        )

        self._attr_native_value = PrivilegeState.TEMPORARILY_DISABLED.value
        await self._manager.points_storage.set_privilege_state(
            self._assignee,
            self._privilege.slug,
            PrivilegeState.TEMPORARILY_DISABLED.value,
        )
        LOGGER.info(
            "Privilege '%s' temporarily disabled for %s until %s",
            self._privilege.name,
            self._assignee,
            self._disable_until.isoformat(),
        )

    async def async_adjust_temporary_disable(self, adjustment_minutes: int) -> None:
        """Adjust the temporary disable duration."""
        if self._attr_native_value != PrivilegeState.TEMPORARILY_DISABLED.value:
            LOGGER.warning(
                "Cannot adjust temporary disable for privilege '%s' - not temporarily disabled",
                self._privilege.slug,
            )
            return

        if self._disable_until is None:
            LOGGER.warning(
                "Cannot adjust temporary disable for privilege '%s' - no end time set",
                self._privilege.slug,
            )
            return

        from datetime import timedelta

        self._disable_until = self._disable_until + timedelta(
            minutes=adjustment_minutes
        )

        # If adjustment moves end time to past, re-evaluate state
        if self._disable_until <= datetime.now(UTC):
            await self._check_and_update_state()
        else:
            await self._manager.points_storage.set_privilege_disable_until(
                self._assignee, self._privilege.slug, self._disable_until
            )
            LOGGER.info(
                "Privilege '%s' temporary disable adjusted by %d minutes for %s, new end: %s",
                self._privilege.name,
                adjustment_minutes,
                self._assignee,
                self._disable_until.isoformat(),
            )

    async def async_update_from_chores(self) -> None:
        """Update privilege state based on linked chore states (for automatic behavior)."""
        await self._check_and_update_state()

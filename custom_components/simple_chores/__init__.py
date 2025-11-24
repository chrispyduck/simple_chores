"""
Custom integration to integrate simple_chores with Home Assistant.

For more details about this integration, please refer to
https://github.com/chrispyduck/simple_chores
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

import voluptuous as vol

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, ServiceCall
import homeassistant.helpers.config_validation as cv

from .config_loader import ConfigLoader, ConfigLoadError
from .const import (
    ATTR_CHORE_SLUG,
    ATTR_USER,
    CONFIG_FILE_NAME,
    DOMAIN,
    LOGGER,
    SERVICE_MARK_COMPLETE,
    SERVICE_MARK_NOT_REQUESTED,
    SERVICE_MARK_PENDING,
)
from .data import SimpleChoresData as SimpleChoresData
from .models import ChoreState

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

PLATFORMS: list[Platform] = [
    Platform.SENSOR,
]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up the Simple Chores component from yaml configuration.

    Args:
        hass: Home Assistant instance
        config: Configuration dict (unused - we use file-based config)

    Returns:
        True if setup was successful

    """
    # Get config file path
    config_dir = Path(hass.config.path())
    config_path = config_dir / CONFIG_FILE_NAME

    # Initialize config loader
    config_loader = ConfigLoader(hass, config_path)

    try:
        await config_loader.async_load()
    except ConfigLoadError as err:
        LOGGER.error("Failed to load configuration: %s", err)
        return False

    # Store in hass.data
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config_loader"] = config_loader

    # Start watching for config file changes
    await config_loader.async_start_watching()

    # Load sensor platform
    await hass.helpers.discovery.async_load_platform("sensor", DOMAIN, {}, config)

    # Register services
    await async_setup_services(hass)

    LOGGER.info("Simple Chores integration loaded successfully")
    return True


SERVICE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_USER): cv.string,
        vol.Required(ATTR_CHORE_SLUG): cv.string,
    }
)


async def async_setup_services(hass: HomeAssistant) -> None:
    """Set up services for the Simple Chores integration.

    Args:
        hass: Home Assistant instance

    """

    async def handle_mark_complete(call: ServiceCall) -> None:
        """Handle the mark_complete service call.

        Args:
            call: Service call data

        """
        user = call.data[ATTR_USER]
        chore_slug = call.data[ATTR_CHORE_SLUG]

        if DOMAIN not in hass.data:
            LOGGER.error("Simple Chores integration not loaded")
            return

        # Find the sensor and update its state
        sensor_id = f"{user}_{chore_slug}"
        sensors = hass.data[DOMAIN].get("sensors", {})

        if sensor_id not in sensors:
            LOGGER.error(
                "No sensor found for user '%s' and chore '%s'", user, chore_slug
            return

        sensor = sensors[sensor_id]
        sensor = sensors[sensor_id]
        sensor.set_state(ChoreState.COMPLETE)
        LOGGER.debug("Marked chore '%s' as complete for user '%s'", chore_slug, user)

    async def handle_mark_pending(call: ServiceCall) -> None:
        """Handle the mark_pending service call.

        Args:
            call: Service call data

        """
        user = call.data[ATTR_USER]
        chore_slug = call.data[ATTR_CHORE_SLUG]

        if DOMAIN not in hass.data:
            LOGGER.error("Simple Chores integration not loaded")
            return

        sensor_id = f"{user}_{chore_slug}"
        sensors = hass.data[DOMAIN].get("sensors", {})

        if sensor_id not in sensors:
            LOGGER.error(
                "No sensor found for user '%s' and chore '%s'", user, chore_slug
            )
            return
            return

        sensor = sensors[sensor_id]
        sensor.set_state(ChoreState.PENDING)

    async def handle_mark_not_requested(call: ServiceCall) -> None:
        """Handle the mark_not_requested service call.

        Args:
            call: Service call data

        """
        user = call.data[ATTR_USER]
        chore_slug = call.data[ATTR_CHORE_SLUG]

        if DOMAIN not in hass.data:
            LOGGER.error("Simple Chores integration not loaded")
            return

        sensor_id = f"{user}_{chore_slug}"
        sensors = hass.data[DOMAIN].get("sensors", {})

        if sensor_id not in sensors:
            LOGGER.error(
                "No sensor found for user '%s' and chore '%s'", user, chore_slug
            )
            return

        from .models import ChoreState
            return

        sensor = sensors[sensor_id]
        sensor.set_state(ChoreState.NOT_REQUESTED)

    # Register all three services
    hass.services.async_register(
        DOMAIN, SERVICE_MARK_COMPLETE, handle_mark_complete, schema=SERVICE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_MARK_PENDING, handle_mark_pending, schema=SERVICE_SCHEMA
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_MARK_NOT_REQUESTED,
        handle_mark_not_requested,
        schema=SERVICE_SCHEMA,
    )

    LOGGER.debug("Registered Simple Chores services")


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Set up this integration using UI (not supported).

    Args:
        hass: Home Assistant instance
        entry: Config entry

    Returns:
        False - UI setup not supported

    """
    LOGGER.error("UI-based setup is not supported. Please use YAML configuration.")
    return False


async def async_unload_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Handle removal of an entry.

    Args:
        hass: Home Assistant instance
        entry: Config entry

    Returns:
        True if unload was successful

    """
    # Stop watching config file
    if DOMAIN in hass.data:
        config_loader = hass.data[DOMAIN].get("config_loader")
        if config_loader:
            await config_loader.async_stop_watching()

    return True


async def async_reload_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> None:
    """Reload config entry.

    Args:
        hass: Home Assistant instance
        entry: Config entry

    """
    await hass.config_entries.async_reload(entry.entry_id)

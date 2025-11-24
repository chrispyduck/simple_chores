"""
Custom integration to integrate simple_chores with Home Assistant.

For more details about this integration, please refer to
https://github.com/chrispyduck/simple_chores
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from homeassistant.const import Platform

from .config_loader import ConfigLoader, ConfigLoadError
from .const import CONFIG_FILE_NAME, DOMAIN, LOGGER
from .data import SimpleChoresData as SimpleChoresData
from .services import async_setup_services

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant


PLATFORMS: list[Platform] = [
    Platform.SENSOR,
]

# Configuration schema - accepts empty config since we use file-based configuration
CONFIG_SCHEMA = vol.Schema(
    {DOMAIN: cv.empty_config_schema(DOMAIN)},
    extra=vol.ALLOW_EXTRA,
)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """
    Set up the Simple Chores component from yaml configuration.

    Args:
        hass: Home Assistant instance
        config: Configuration dict (unused - we use file-based config)

    Returns:
        True if setup was successful

    """
    # If there's a config entry, skip YAML setup to avoid duplicate sensors
    entries = hass.config_entries.async_entries(DOMAIN)
    if entries:
        LOGGER.info(
            "Config entry exists (count: %d), skipping YAML setup to avoid duplicates",
            len(entries),
        )
        return True

    LOGGER.debug("No config entry found, proceeding with YAML setup")

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

    # Load sensor platform directly by importing and calling it
    # This avoids the deprecated hass.helpers.discovery pattern
    from .sensor import async_setup_platform

    def add_entities(new_entities, update_before_add: bool = False) -> None:  # noqa: FBT001, FBT002
        """Add entities callback (no-op for YAML setup)."""
        ...

    await async_setup_platform(hass, {}, add_entities, None)

    # Register services
    await async_setup_services(hass)

    LOGGER.info("Simple Chores integration loaded successfully")
    return True


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """
    Set up this integration using UI.

    Args:
        hass: Home Assistant instance
        entry: Config entry

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

    # Setup platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Register services
    await async_setup_services(hass)

    LOGGER.info("Simple Chores integration loaded successfully")
    return True


async def async_unload_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """
    Handle removal of an entry.

    Args:
        hass: Home Assistant instance
        entry: Config entry

    Returns:
        True if unload was successful

    """
    # Unload platforms
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    # Stop watching config file
    if unload_ok and DOMAIN in hass.data:
        config_loader = hass.data[DOMAIN].get("config_loader")
        if config_loader:
            await config_loader.async_stop_watching()

    return unload_ok


async def async_reload_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> None:
    """
    Reload config entry.

    Args:
        hass: Home Assistant instance
        entry: Config entry

    """
    await hass.config_entries.async_reload(entry.entry_id)

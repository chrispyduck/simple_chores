"""Service handlers for Simple Chores integration."""

from __future__ import annotations

from functools import partial
from typing import TYPE_CHECKING

import homeassistant.helpers.config_validation as cv
import voluptuous as vol

from .const import (
    ATTR_ASSIGNEES,
    ATTR_CHORE_SLUG,
    ATTR_DESCRIPTION,
    ATTR_FREQUENCY,
    ATTR_ICON,
    ATTR_NAME,
    ATTR_SLUG,
    ATTR_USER,
    DOMAIN,
    LOGGER,
    SERVICE_CREATE_CHORE,
    SERVICE_DELETE_CHORE,
    SERVICE_MARK_COMPLETE,
    SERVICE_MARK_NOT_REQUESTED,
    SERVICE_MARK_PENDING,
    SERVICE_RESET_COMPLETED,
    SERVICE_UPDATE_CHORE,
    sanitize_entity_id,
)
from .models import ChoreConfig, ChoreFrequency, ChoreState

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant, ServiceCall

    from .config_loader import ConfigLoader


SERVICE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_USER): cv.string,
        vol.Required(ATTR_CHORE_SLUG): cv.string,
    }
)

CREATE_CHORE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_NAME): cv.string,
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_DESCRIPTION, default=""): cv.string,
        vol.Required(ATTR_FREQUENCY): vol.In(["daily", "weekly", "manual"]),
        vol.Required(ATTR_ASSIGNEES): cv.string,
        vol.Optional(ATTR_ICON, default="mdi:clipboard-list-outline"): cv.string,
    }
)

UPDATE_CHORE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_NAME): cv.string,
        vol.Optional(ATTR_DESCRIPTION): cv.string,
        vol.Optional(ATTR_FREQUENCY): vol.In(["daily", "weekly", "manual"]),
        vol.Optional(ATTR_ASSIGNEES): cv.string,
        vol.Optional(ATTR_ICON): cv.string,
    }
)

DELETE_CHORE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
    }
)

RESET_COMPLETED_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_USER): cv.string,
    }
)


async def handle_mark_complete(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_complete service call."""
    user = call.data[ATTR_USER]
    chore_slug = call.data[ATTR_CHORE_SLUG]

    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    sensor_id = f"{sanitize_entity_id(user)}_{sanitize_entity_id(chore_slug)}"
    sensors = hass.data[DOMAIN].get("sensors", {})

    if sensor_id not in sensors:
        LOGGER.error("No sensor found for user '%s' and chore '%s'", user, chore_slug)
        return

    sensor = sensors[sensor_id]
    sensor.set_state(ChoreState.COMPLETE)
    LOGGER.debug("Marked chore '%s' as complete for user '%s'", chore_slug, user)


async def handle_mark_pending(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_pending service call."""
    user = call.data[ATTR_USER]
    chore_slug = call.data[ATTR_CHORE_SLUG]

    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    sensor_id = f"{sanitize_entity_id(user)}_{sanitize_entity_id(chore_slug)}"
    sensors = hass.data[DOMAIN].get("sensors", {})

    if sensor_id not in sensors:
        LOGGER.error("No sensor found for user '%s' and chore '%s'", user, chore_slug)
        return

    sensor = sensors[sensor_id]
    sensor.set_state(ChoreState.PENDING)


async def handle_mark_not_requested(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_not_requested service call."""
    user = call.data[ATTR_USER]
    chore_slug = call.data[ATTR_CHORE_SLUG]

    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    sensor_id = f"{sanitize_entity_id(user)}_{sanitize_entity_id(chore_slug)}"
    sensors = hass.data[DOMAIN].get("sensors", {})

    if sensor_id not in sensors:
        LOGGER.error("No sensor found for user '%s' and chore '%s'", user, chore_slug)
        return

    sensor = sensors[sensor_id]
    sensor.set_state(ChoreState.NOT_REQUESTED)


async def handle_reset_completed(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the reset_completed service call."""
    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    sensors = hass.data[DOMAIN].get("sensors", {})
    user = call.data.get(ATTR_USER)

    # Sanitize user if provided for matching
    sanitized_user = sanitize_entity_id(user) if user else None

    reset_count = 0
    for sensor_id, sensor in sensors.items():
        # If user specified, only reset their chores
        if sanitized_user and not sensor_id.startswith(f"{sanitized_user}_"):
            continue

        # Only reset sensors that are currently COMPLETE
        if sensor.native_value == ChoreState.COMPLETE.value:
            sensor.set_state(ChoreState.NOT_REQUESTED)
            reset_count += 1

    if user:
        LOGGER.info("Reset %d completed chore(s) for user '%s'", reset_count, user)
    else:
        LOGGER.info("Reset %d completed chore(s) for all users", reset_count)


async def handle_create_chore(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the create_chore service call."""
    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    # Parse assignees from comma-separated string
    assignees_str = call.data[ATTR_ASSIGNEES]
    assignees = [a.strip() for a in assignees_str.split(",") if a.strip()]

    try:
        chore = ChoreConfig(
            name=call.data[ATTR_NAME],
            slug=call.data[ATTR_SLUG],
            description=call.data.get(ATTR_DESCRIPTION, ""),
            frequency=ChoreFrequency(call.data[ATTR_FREQUENCY]),
            assignees=assignees,
            icon=call.data.get(ATTR_ICON, "mdi:clipboard-list-outline"),
        )
        await config_loader.async_create_chore(chore)
        LOGGER.info("Created chore '%s'", chore.slug)
    except Exception as err:
        LOGGER.error("Failed to create chore: %s", err)
        raise


async def handle_update_chore(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the update_chore service call."""
    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    slug = call.data[ATTR_SLUG]
    name = call.data.get(ATTR_NAME)
    description = call.data.get(ATTR_DESCRIPTION)
    frequency = call.data.get(ATTR_FREQUENCY)
    assignees_str = call.data.get(ATTR_ASSIGNEES)
    icon = call.data.get(ATTR_ICON)

    # Parse assignees if provided
    assignees = None
    if assignees_str:
        assignees = [a.strip() for a in assignees_str.split(",") if a.strip()]

    try:
        await config_loader.async_update_chore(
            slug=slug,
            name=name,
            description=description,
            frequency=frequency,
            assignees=assignees,
            icon=icon,
        )
        LOGGER.info("Updated chore '%s'", slug)
    except Exception as err:
        LOGGER.error("Failed to update chore: %s", err)
        raise


async def handle_delete_chore(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the delete_chore service call."""
    if DOMAIN not in hass.data:
        LOGGER.error("Simple Chores integration not loaded")
        return

    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]
    slug = call.data[ATTR_SLUG]

    try:
        await config_loader.async_delete_chore(slug)
        LOGGER.info("Deleted chore '%s'", slug)
    except Exception as err:
        LOGGER.error("Failed to delete chore: %s", err)
        raise


async def async_setup_services(hass: HomeAssistant) -> None:
    """Set up services for the Simple Chores integration."""
    hass.services.async_register(
        DOMAIN,
        SERVICE_MARK_COMPLETE,
        partial(handle_mark_complete, hass),
        schema=SERVICE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_MARK_PENDING,
        partial(handle_mark_pending, hass),
        schema=SERVICE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_MARK_NOT_REQUESTED,
        partial(handle_mark_not_requested, hass),
        schema=SERVICE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_RESET_COMPLETED,
        partial(handle_reset_completed, hass),
        schema=RESET_COMPLETED_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_CREATE_CHORE,
        partial(handle_create_chore, hass),
        schema=CREATE_CHORE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_CHORE,
        partial(handle_update_chore, hass),
        schema=UPDATE_CHORE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_DELETE_CHORE,
        partial(handle_delete_chore, hass),
        schema=DELETE_CHORE_SCHEMA,
    )

    LOGGER.debug("Registered Simple Chores services")

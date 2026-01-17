"""Service handlers for Simple Chores integration."""

from __future__ import annotations

import asyncio
from functools import partial
from typing import TYPE_CHECKING

import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from .const import (
    ATTR_ADJUSTMENT,
    ATTR_ASSIGNEES,
    ATTR_CHORE_SLUG,
    ATTR_DESCRIPTION,
    ATTR_FREQUENCY,
    ATTR_ICON,
    ATTR_NAME,
    ATTR_POINTS,
    ATTR_RESET_TOTAL,
    ATTR_SLUG,
    ATTR_USER,
    DOMAIN,
    LOGGER,
    SERVICE_ADJUST_POINTS,
    SERVICE_CREATE_CHORE,
    SERVICE_DELETE_CHORE,
    SERVICE_MARK_COMPLETE,
    SERVICE_MARK_NOT_REQUESTED,
    SERVICE_MARK_PENDING,
    SERVICE_REFRESH_SUMMARY,
    SERVICE_RESET_COMPLETED,
    SERVICE_RESET_POINTS,
    SERVICE_START_NEW_DAY,
    SERVICE_UPDATE_CHORE,
    sanitize_entity_id,
)
from .models import ChoreConfig, ChoreFrequency, ChoreState

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant, ServiceCall

    from .config_loader import ConfigLoader


SERVICE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_USER): cv.string,
        vol.Required(ATTR_CHORE_SLUG): cv.string,
    }
)


def _validate_integration_loaded(hass: HomeAssistant) -> None:
    """
    Validate that the Simple Chores integration is loaded.

    Args:
        hass: Home Assistant instance

    Raises:
        HomeAssistantError: If integration is not loaded

    """
    if DOMAIN not in hass.data:
        msg = "Simple Chores integration not loaded"
        LOGGER.error(msg)
        raise HomeAssistantError(msg)


def _find_matching_sensors(
    sensors: dict, chore_slug: str, user: str | None = None
) -> list:
    """
    Find sensors matching chore slug and optionally user.

    Args:
        sensors: Dictionary of sensors
        chore_slug: Chore slug to match
        user: Optional user to filter by

    Returns:
        List of matching sensors

    """
    sanitized_chore = sanitize_entity_id(chore_slug)
    matching_sensors = []

    if user:
        # Specific user
        sensor_id = f"{sanitize_entity_id(user)}_{sanitized_chore}"
        if sensor_id in sensors:
            matching_sensors.append(sensors[sensor_id])
    else:
        # All assignees for this chore
        for sensor_id, sensor in sensors.items():
            if (
                sensor_id.endswith(f"_{sanitized_chore}")
                and sensor.chore.slug == chore_slug
            ):
                matching_sensors.append(sensor)

    return matching_sensors


async def _update_summary_sensors(hass: HomeAssistant, user: str | None = None) -> None:
    """
    Update summary sensors for a user or all users.

    Args:
        hass: Home Assistant instance
        user: Optional user to update, or None for all users

    """
    summary_sensors = hass.data[DOMAIN].get("summary_sensors", {})
    if not summary_sensors:
        return

    update_tasks = []
    if user:
        sanitized_user = sanitize_entity_id(user)
        if sanitized_user in summary_sensors:
            update_tasks.append(
                summary_sensors[sanitized_user].async_update_ha_state(
                    force_refresh=True
                )
            )
    else:
        # Batch all summary sensor updates
        for summary_sensor in summary_sensors.values():
            update_tasks.append(
                summary_sensor.async_update_ha_state(force_refresh=True)
            )

    # Await all summary sensor updates to complete
    if update_tasks:
        await asyncio.gather(*update_tasks)


CREATE_CHORE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_NAME): cv.string,
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_DESCRIPTION, default=""): cv.string,
        vol.Required(ATTR_FREQUENCY): vol.In(["daily", "manual"]),
        vol.Required(ATTR_ASSIGNEES): cv.string,
        vol.Optional(ATTR_ICON, default="mdi:clipboard-list-outline"): cv.string,
        vol.Optional(ATTR_POINTS, default=1): vol.All(
            vol.Coerce(int), vol.Range(min=0)
        ),
    }
)

UPDATE_CHORE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_NAME): cv.string,
        vol.Optional(ATTR_DESCRIPTION): cv.string,
        vol.Optional(ATTR_FREQUENCY): vol.In(["daily", "manual"]),
        vol.Optional(ATTR_ASSIGNEES): cv.string,
        vol.Optional(ATTR_ICON): cv.string,
        vol.Optional(ATTR_POINTS): vol.All(vol.Coerce(int), vol.Range(min=0)),
    }
)

DELETE_CHORE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
    }
)

ADJUST_POINTS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_USER): cv.string,
        vol.Required(ATTR_ADJUSTMENT): vol.All(
            vol.Coerce(int), vol.Range(min=-1000000000, max=1000000000)
        ),
    }
)

RESET_COMPLETED_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_USER): cv.string,
    }
)

RESET_POINTS_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_USER): cv.string,
        vol.Optional(ATTR_RESET_TOTAL, default=False): cv.boolean,
    }
)


async def handle_mark_complete(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_complete service call."""
    user = call.data.get(ATTR_USER)
    chore_slug = call.data[ATTR_CHORE_SLUG]

    LOGGER.info(
        "Service 'mark_complete' called with user='%s', chore_slug='%s'",
        user if user else "all assignees",
        chore_slug,
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    points_storage = hass.data[DOMAIN].get("points_storage")
    matching_sensors = _find_matching_sensors(sensors, chore_slug, user)

    if not matching_sensors:
        if user:
            msg = (
                f"No sensor found for user '{user}' and chore '{chore_slug}'. "
                f"Available sensors: {list(sensors.keys())}"
            )
        else:
            msg = f"No sensors found for chore '{chore_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    # Mark all matching sensors as complete and award points immediately
    affected_users = set()
    state_update_tasks = []

    for sensor in matching_sensors:
        # Only award points if transitioning from non-complete state
        # Read from _attr_native_value directly to get the most current state
        was_complete = sensor._attr_native_value == ChoreState.COMPLETE.value  # noqa: SLF001

        # Update state directly and batch the HA state update
        sensor._attr_native_value = ChoreState.COMPLETE.value  # noqa: SLF001
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        affected_users.add(sensor.assignee)

        # Audit log: chore marked complete
        LOGGER.info(
            "%s marked '%s' complete",
            sensor.assignee,
            sensor.chore.name,
        )

        # Award points for newly completed chore
        if not was_complete and points_storage:
            chore_points = sensor.chore.points
            await points_storage.add_points(sensor.assignee, chore_points)
            await points_storage.add_points_earned(sensor.assignee, chore_points)
            LOGGER.debug(
                "Awarded %d points to '%s' for completing chore '%s'",
                chore_points,
                sensor.assignee,
                chore_slug,
            )

    # Await all chore sensor updates to complete
    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info("Marked chore '%s' as complete for user '%s'", chore_slug, user)
    else:
        LOGGER.info(
            "Marked chore '%s' as complete for %d assignee(s)",
            chore_slug,
            len(matching_sensors),
        )

    # Update summary sensors for all affected users (after all chore sensors updated)
    if affected_users:
        for affected_user in affected_users:
            await _update_summary_sensors(hass, affected_user)


async def handle_mark_pending(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_pending service call."""
    user = call.data.get(ATTR_USER)
    chore_slug = call.data[ATTR_CHORE_SLUG]

    LOGGER.info(
        "Service 'mark_pending' called with user='%s', chore_slug='%s'",
        user if user else "all assignees",
        chore_slug,
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    points_storage = hass.data[DOMAIN].get("points_storage")
    matching_sensors = _find_matching_sensors(sensors, chore_slug, user)

    if not matching_sensors:
        if user:
            msg = (
                f"No sensor found for user '{user}' and chore '{chore_slug}'. "
                f"Available sensors: {list(sensors.keys())}"
            )
        else:
            msg = f"No sensors found for chore '{chore_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    # Mark all matching sensors as pending and deduct points if previously complete
    affected_users = set()
    state_update_tasks = []

    for sensor in matching_sensors:
        # Deduct points if transitioning from complete to pending
        # Read from _attr_native_value directly to get the most current state
        was_complete = sensor._attr_native_value == ChoreState.COMPLETE.value  # noqa: SLF001

        # Update state directly and batch the HA state update
        sensor._attr_native_value = ChoreState.PENDING.value  # noqa: SLF001
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        affected_users.add(sensor.assignee)

        # Audit log: chore marked pending
        LOGGER.info(
            "%s marked '%s' pending",
            sensor.assignee,
            sensor.chore.name,
        )

        # Deduct points for un-completing a chore
        if was_complete and points_storage:
            chore_points = sensor.chore.points
            await points_storage.add_points(sensor.assignee, -chore_points)
            await points_storage.add_points_earned(sensor.assignee, -chore_points)
            LOGGER.debug(
                "Deducted %d points from '%s' for un-completing chore '%s'",
                chore_points,
                sensor.assignee,
                chore_slug,
            )

    # Await all chore sensor updates to complete
    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info("Marked chore '%s' as pending for user '%s'", chore_slug, user)
    else:
        LOGGER.info(
            "Marked chore '%s' as pending for %d assignee(s)",
            chore_slug,
            len(matching_sensors),
        )

    # Update summary sensors for all affected users (after all chore sensors updated)
    if affected_users:
        for affected_user in affected_users:
            await _update_summary_sensors(hass, affected_user)


async def handle_mark_not_requested(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_not_requested service call."""
    user = call.data.get(ATTR_USER)
    chore_slug = call.data[ATTR_CHORE_SLUG]

    LOGGER.info(
        "Service 'mark_not_requested' called with user='%s', chore_slug='%s'",
        user if user else "all assignees",
        chore_slug,
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    matching_sensors = _find_matching_sensors(sensors, chore_slug, user)

    if not matching_sensors:
        if user:
            msg = (
                f"No sensor found for user '{user}' and chore '{chore_slug}'. "
                f"Available sensors: {list(sensors.keys())}"
            )
        else:
            msg = f"No sensors found for chore '{chore_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    # Mark all matching sensors as not requested
    affected_users = set()
    state_update_tasks = []

    for sensor in matching_sensors:
        # Update state directly and batch the HA state update
        sensor._attr_native_value = ChoreState.NOT_REQUESTED.value  # noqa: SLF001
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        affected_users.add(sensor.assignee)

        # Audit log: chore marked not requested
        LOGGER.info(
            "%s unmarked '%s'",
            sensor.assignee,
            sensor.chore.name,
        )

    # Await all chore sensor updates to complete
    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info(
            "Marked chore '%s' as not requested for user '%s'", chore_slug, user
        )
    else:
        LOGGER.info(
            "Marked chore '%s' as not requested for %d assignee(s)",
            chore_slug,
            len(matching_sensors),
        )

    # Update summary sensors for all affected users (after all chore sensors updated)
    if affected_users:
        for affected_user in affected_users:
            await _update_summary_sensors(hass, affected_user)


async def handle_reset_completed(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the reset_completed service call."""
    user = call.data.get(ATTR_USER)

    LOGGER.info(
        "Service 'reset_completed' called with user='%s'",
        user if user else "all users",
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})

    # Sanitize user if provided for matching
    sanitized_user = sanitize_entity_id(user) if user else None

    reset_count = 0
    affected_users = set()
    state_update_tasks = []

    for sensor_id, sensor in sensors.items():
        # If user specified, only reset their chores
        if sanitized_user and not sensor_id.startswith(f"{sanitized_user}_"):
            continue

        # Only reset sensors that are currently COMPLETE
        # Read from _attr_native_value directly to get the most current state
        if sensor._attr_native_value == ChoreState.COMPLETE.value:  # noqa: SLF001
            # Update state directly and batch the HA state update
            sensor._attr_native_value = ChoreState.NOT_REQUESTED.value  # noqa: SLF001
            state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
            affected_users.add(sensor.assignee)
            reset_count += 1

            # Audit log: chore reset
            LOGGER.info(
                "%s's completed chore '%s' was reset",
                sensor.assignee,
                sensor.chore.name,
            )

    # Await all chore sensor updates to complete
    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info("Reset %d completed chore(s) for user '%s'", reset_count, user)
    else:
        LOGGER.info("Reset %d completed chore(s) for all users", reset_count)

    # Update summary sensors for all affected users (after all chore sensors updated)
    if affected_users:
        for affected_user in affected_users:
            await _update_summary_sensors(hass, affected_user)


async def handle_start_new_day(hass: HomeAssistant, call: ServiceCall) -> None:
    """
    Handle the start_new_day service call.

    Resets completed chores based on their frequency:
    - manual: Reset to NOT_REQUESTED
    - daily: Reset to PENDING
    """
    user = call.data.get(ATTR_USER)

    LOGGER.info(
        "Service 'start_new_day' called with user='%s'",
        user if user else "all users",
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    points_storage = hass.data[DOMAIN].get("points_storage")

    # Sanitize user if provided for matching
    sanitized_user = sanitize_entity_id(user) if user else None

    # Calculate points missed per assignee BEFORE resetting (points already awarded on complete)
    assignee_stats: dict[str, dict[str, int]] = {}
    for sensor_id, sensor in sensors.items():
        # If user specified, only calculate for their chores
        if sanitized_user and not sensor_id.startswith(f"{sanitized_user}_"):
            continue

        assignee = sensor.assignee
        if assignee not in assignee_stats:
            assignee_stats[assignee] = {"missed": 0}

        # Read from _attr_native_value directly to get the most current state
        current_state = sensor._attr_native_value  # noqa: SLF001
        chore_points = sensor.chore.points

        # Count pending chores as missed (will be added to cumulative total)
        if current_state == ChoreState.PENDING.value:
            assignee_stats[assignee]["missed"] += chore_points

    # Update cumulative points_missed
    if points_storage:
        for assignee, stats in assignee_stats.items():
            # Update cumulative points_missed
            if stats["missed"] > 0:
                current_missed = points_storage.get_points_missed(assignee)
                new_missed = current_missed + stats["missed"]
                await points_storage.add_points_missed(assignee, stats["missed"])
                LOGGER.debug(
                    "Updated cumulative points_missed for %s: added %d (was %d, now %d)",
                    assignee,
                    stats["missed"],
                    current_missed,
                    new_missed,
                )

    reset_count = 0
    manual_count = 0
    daily_count = 0

    # Collect all state changes first, then apply them
    # Track affected users to update only their summary sensors
    affected_users = set()
    state_changes = []
    for sensor_id, sensor in sensors.items():
        # If user specified, only reset their chores
        if sanitized_user and not sensor_id.startswith(f"{sanitized_user}_"):
            continue

        # Only reset sensors that are currently COMPLETE
        # Read from _attr_native_value directly to get the most current state
        if sensor._attr_native_value == ChoreState.COMPLETE.value:  # noqa: SLF001
            chore_frequency = sensor.chore.frequency
            affected_users.add(sensor.assignee)

            if chore_frequency == ChoreFrequency.MANUAL:
                state_changes.append((sensor, ChoreState.NOT_REQUESTED))
                reset_count += 1
                manual_count += 1
            elif chore_frequency == ChoreFrequency.DAILY:
                state_changes.append((sensor, ChoreState.PENDING))
                reset_count += 1
                daily_count += 1

    # Apply all state changes without triggering individual summary updates
    update_tasks = []
    for sensor, new_state in state_changes:
        sensor._attr_native_value = new_state.value
        update_tasks.append(sensor.async_update_ha_state(force_refresh=True))

        # Audit log: chore reset for new day
        action = "reset to pending" if new_state == ChoreState.PENDING else "unmarked"
        LOGGER.info(
            "New day: %s's chore '%s' %s",
            sensor.assignee,
            sensor.chore.name,
            action,
        )

    # Await all sensor updates to complete before updating summary
    if update_tasks:
        await asyncio.gather(*update_tasks)

    if user:
        LOGGER.info(
            "Reset %d completed chore(s) for user '%s' (%d manual to not_requested, %d daily to pending)",
            reset_count,
            user,
            manual_count,
            daily_count,
        )
    else:
        LOGGER.info(
            "Reset %d completed chore(s) for all users (%d manual to not_requested, %d daily to pending)",
            reset_count,
            manual_count,
            daily_count,
        )

    # Update summary sensors to reflect new state (after all chore states are updated)
    # Only update affected users' summary sensors
    if affected_users:
        for affected_user in affected_users:
            await _update_summary_sensors(hass, affected_user)


async def handle_create_chore(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the create_chore service call."""
    LOGGER.info(
        "Service 'create_chore' called with slug='%s', name='%s', assignees='%s'",
        call.data.get(ATTR_SLUG),
        call.data.get(ATTR_NAME),
        call.data.get(ATTR_ASSIGNEES),
    )

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    # Parse assignees from comma-separated string
    assignees_str = call.data[ATTR_ASSIGNEES]
    assignees = [a.strip() for a in assignees_str.split(",") if a.strip()]

    if not assignees:
        msg = "At least one assignee is required"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    try:
        chore = ChoreConfig(
            name=call.data[ATTR_NAME],
            slug=call.data[ATTR_SLUG],
            description=call.data.get(ATTR_DESCRIPTION, ""),
            frequency=ChoreFrequency(call.data[ATTR_FREQUENCY]),
            assignees=assignees,
            icon=call.data.get(ATTR_ICON, "mdi:clipboard-list-outline"),
            points=call.data.get(ATTR_POINTS, 1),
        )
        await config_loader.async_create_chore(chore)
        LOGGER.info("Created chore '%s'", chore.slug)
    except Exception as err:
        msg = f"Failed to create chore: {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


async def handle_update_chore(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the update_chore service call."""
    LOGGER.info(
        "Service 'update_chore' called with slug='%s', updates=%s",
        call.data.get(ATTR_SLUG),
        {k: v for k, v in call.data.items() if k != ATTR_SLUG},
    )

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    slug = call.data[ATTR_SLUG]
    name = call.data.get(ATTR_NAME)
    description = call.data.get(ATTR_DESCRIPTION)
    frequency = call.data.get(ATTR_FREQUENCY)
    assignees_str = call.data.get(ATTR_ASSIGNEES)
    icon = call.data.get(ATTR_ICON)
    points = call.data.get(ATTR_POINTS)

    # Parse assignees if provided
    assignees = None
    if assignees_str:
        assignees = [a.strip() for a in assignees_str.split(",") if a.strip()]
        if not assignees:
            msg = "At least one assignee is required when updating assignees"
            LOGGER.error(msg)
            raise ServiceValidationError(msg)

    try:
        await config_loader.async_update_chore(
            slug=slug,
            name=name,
            description=description,
            frequency=frequency,
            assignees=assignees,
            icon=icon,
            points=points,
        )
        LOGGER.info("Updated chore '%s'", slug)
    except Exception as err:
        msg = f"Failed to update chore '{slug}': {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


async def handle_delete_chore(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the delete_chore service call."""
    slug = call.data[ATTR_SLUG]

    LOGGER.info("Service 'delete_chore' called with slug='%s'", slug)

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    try:
        await config_loader.async_delete_chore(slug)
        LOGGER.info("Deleted chore '%s'", slug)
    except Exception as err:
        msg = f"Failed to delete chore '{slug}': {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


async def handle_refresh_summary(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the refresh_summary service call."""
    user = call.data.get(ATTR_USER)

    LOGGER.info(
        "Service 'refresh_summary' called with user='%s'",
        user if user else "all users",
    )

    _validate_integration_loaded(hass)
    summary_sensors = hass.data[DOMAIN].get("summary_sensors", {})
    if not summary_sensors:
        LOGGER.warning("No summary sensors found")
        return

    # Validate user exists if specified
    if user:
        sanitized_user = sanitize_entity_id(user)
        if sanitized_user not in summary_sensors:
            msg = f"No summary sensor found for user '{user}'"
            LOGGER.error(msg)
            raise ServiceValidationError(msg)

    # Force update all chore sensors first to ensure current state
    sensors = hass.data[DOMAIN].get("sensors", {})
    if sensors:
        update_tasks = []
        sanitized_user = sanitize_entity_id(user) if user else None

        for sensor_id, sensor in sensors.items():
            # If user specified, only update their chore sensors
            if sanitized_user and not sensor_id.startswith(f"{sanitized_user}_"):
                continue
            update_tasks.append(sensor.async_update_ha_state(force_refresh=True))

        if update_tasks:
            await asyncio.gather(*update_tasks)

    # Now update summary sensors with fresh chore sensor data
    await _update_summary_sensors(hass, user)

    if user:
        LOGGER.info("Refreshed summary sensor for user '%s'", user)
    else:
        LOGGER.info("Refreshed all summary sensors")


async def handle_adjust_points(hass: HomeAssistant, call: ServiceCall) -> None:
    """
    Handle the adjust_points service call.

    Args:
        hass: Home Assistant instance
        call: Service call with 'user' and 'adjustment' data

    """
    user = call.data[ATTR_USER]
    adjustment = call.data[ATTR_ADJUSTMENT]

    LOGGER.info(
        "Service 'adjust_points' called with user='%s', adjustment=%d",
        user,
        adjustment,
    )

    _validate_integration_loaded(hass)
    points_storage = hass.data[DOMAIN].get("points_storage")

    if not points_storage:
        msg = "Points storage not initialized"
        LOGGER.error(msg)
        raise HomeAssistantError(msg)

    # Add the adjustment (can be positive or negative)
    new_total = await points_storage.add_points(user, adjustment)

    LOGGER.info(
        "Adjusted points for user '%s' by %d. New total: %d",
        user,
        adjustment,
        new_total,
    )

    # Update the summary sensor to reflect the new points
    await _update_summary_sensors(hass, user)


async def handle_reset_points(hass: HomeAssistant, call: ServiceCall) -> None:
    """
    Handle the reset_points service call.

    Args:
        hass: Home Assistant instance
        call: Service call with 'user' and 'reset_total' data

    """
    user = call.data.get(ATTR_USER)
    reset_total = call.data.get(ATTR_RESET_TOTAL, False)

    LOGGER.info(
        "Service 'reset_points' called with user='%s', reset_total=%s",
        user if user else "all users",
        reset_total,
    )

    _validate_integration_loaded(hass)
    points_storage = hass.data[DOMAIN].get("points_storage")

    if not points_storage:
        msg = "Points storage not initialized"
        LOGGER.error(msg)
        raise HomeAssistantError(msg)

    # Get list of users to reset
    if user:
        users_to_reset = [user]
    else:
        # Reset for all users who have any points data
        users_to_reset = set()
        all_points = points_storage.get_all_points()
        users_to_reset.update(all_points.keys())
        # Also include users who have daily stats
        sensors = hass.data[DOMAIN].get("sensors", {})
        for sensor in sensors.values():
            users_to_reset.add(sensor.assignee)

    # Reset points for each user
    for assignee in users_to_reset:
        # Always reset points_earned and points_missed (points_possible is calculated dynamically)
        await points_storage.set_points_earned(assignee, 0)
        await points_storage.set_points_missed(assignee, 0)

        # Optionally reset total points
        if reset_total:
            await points_storage.set_points(assignee, 0)

        LOGGER.debug(
            "Reset points for '%s': points_earned=0, points_missed=0, total_points=%s",
            assignee,
            0 if reset_total else points_storage.get_points(assignee),
        )

    # Update summary sensors to reflect changes
    await _update_summary_sensors(hass, user)

    if user:
        LOGGER.info(
            "Reset points for user '%s' (total_points=%s)",
            user,
            "reset" if reset_total else "unchanged",
        )
    else:
        LOGGER.info(
            "Reset points for %d user(s) (total_points=%s)",
            len(users_to_reset),
            "reset" if reset_total else "unchanged",
        )


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
        SERVICE_START_NEW_DAY,
        partial(handle_start_new_day, hass),
        schema=RESET_COMPLETED_SCHEMA,  # Same schema as reset_completed (optional user)
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
    hass.services.async_register(
        DOMAIN,
        SERVICE_REFRESH_SUMMARY,
        partial(handle_refresh_summary, hass),
        schema=RESET_COMPLETED_SCHEMA,  # Same schema as reset_completed (optional user)
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADJUST_POINTS,
        partial(handle_adjust_points, hass),
        schema=ADJUST_POINTS_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_RESET_POINTS,
        partial(handle_reset_points, hass),
        schema=RESET_POINTS_SCHEMA,
    )
    LOGGER.debug("Registered Simple Chores services")

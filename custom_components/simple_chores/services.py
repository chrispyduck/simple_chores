"""Service handlers for Simple Chores integration."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta
from functools import partial
from typing import TYPE_CHECKING

import homeassistant.helpers.config_validation as cv
import voluptuous as vol
from homeassistant.core import HassJob
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers.event import async_call_later

from .const import (
    ATTR_ADJUSTMENT,
    ATTR_ASSIGNEES,
    ATTR_AUTO_FINALIZE_DELAY_MINUTES,
    ATTR_AUTO_FINALIZE_ENABLED,
    ATTR_BEHAVIOR,
    ATTR_CATEGORY,
    ATTR_CATEGORY_SLUG,
    ATTR_CHORE_SLUG,
    ATTR_DESCRIPTION,
    ATTR_DURATION,
    ATTR_FREQUENCY,
    ATTR_ICON,
    ATTR_LINKED_CHORES,
    ATTR_NAME,
    ATTR_NEW_SLUG,
    ATTR_POINTS,
    ATTR_POINTS_BY_ASSIGNEE,
    ATTR_PRIVILEGE_SLUG,
    ATTR_RESET_TOTAL,
    ATTR_SLUG,
    ATTR_USER,
    DOMAIN,
    LOGGER,
    SERVICE_ADJUST_POINTS,
    SERVICE_ADJUST_TEMPORARY_DISABLE,
    SERVICE_CLEAR_TEMPORARY_DISABLE,
    SERVICE_CREATE_CATEGORY,
    SERVICE_CREATE_CHORE,
    SERVICE_CREATE_PRIVILEGE,
    SERVICE_DELETE_CATEGORY,
    SERVICE_DELETE_CHORE,
    SERVICE_DELETE_PRIVILEGE,
    SERVICE_DISABLE_PRIVILEGE,
    SERVICE_ENABLE_PRIVILEGE,
    SERVICE_FINALIZE_BY_CATEGORY,
    SERVICE_FINALIZE_ONE,
    SERVICE_MARK_COMPLETE,
    SERVICE_MARK_COMPLETE_BY_CATEGORY,
    SERVICE_MARK_NOT_REQUESTED,
    SERVICE_MARK_NOT_REQUESTED_BY_CATEGORY,
    SERVICE_MARK_PENDING,
    SERVICE_MARK_PENDING_BY_CATEGORY,
    SERVICE_REFRESH_SUMMARY,
    SERVICE_RESET_COMPLETED,
    SERVICE_RESET_POINTS,
    SERVICE_START_NEW_DAY,
    SERVICE_TEMPORARILY_DISABLE_PRIVILEGE,
    SERVICE_UPDATE_CATEGORY,
    SERVICE_UPDATE_CHORE,
    SERVICE_UPDATE_PRIVILEGE,
    SERVICE_UPDATE_SETTINGS,
    sanitize_entity_id,
)
from .models import (
    CategoryConfig,
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    PrivilegeBehavior,
    PrivilegeConfig,
    SettingsConfig,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant, ServiceCall

    from .config_loader import ConfigLoader
    from .sensor import ChoreSensor


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

    This calls async_update_ha_state() which triggers async_update() to recompute
    values, then writes the state to Home Assistant.

    Args:
        hass: Home Assistant instance
        user: Optional user to update, or None for all users

    """
    summary_sensors = hass.data[DOMAIN].get("summary_sensors", {})
    if not summary_sensors:
        LOGGER.debug("No summary sensors found to update")
        return

    if user:
        sanitized_user = sanitize_entity_id(user)
        if sanitized_user in summary_sensors:
            LOGGER.debug("Updating summary sensor for user '%s'", user)
            await summary_sensors[sanitized_user].async_update_ha_state(
                force_refresh=True
            )
        else:
            LOGGER.warning(
                "Summary sensor not found for user '%s' (sanitized: '%s')",
                user,
                sanitized_user,
            )
    else:
        # Update all summary sensors
        LOGGER.debug("Updating all %d summary sensors", len(summary_sensors))
        update_tasks = [
            summary_sensor.async_update_ha_state(force_refresh=True)
            for summary_sensor in summary_sensors.values()
        ]
        if update_tasks:
            await asyncio.gather(*update_tasks)


def _auto_finalize_unsubs(hass: HomeAssistant) -> dict:
    """Return the {entity_id: cancel_callback} map of pending auto-finalize timers."""
    return hass.data[DOMAIN].setdefault("auto_finalize_unsubs", {})


def _cancel_auto_finalize_timer(hass: HomeAssistant, sensor: ChoreSensor) -> None:
    """Cancel `sensor`'s pending in-memory auto-finalize timer, if one is scheduled."""
    unsub = _auto_finalize_unsubs(hass).pop(sensor.entity_id, None)
    if unsub:
        unsub()


def _cancel_all_auto_finalize_timers(hass: HomeAssistant) -> None:
    """Cancel every pending in-memory auto-finalize timer."""
    unsubs = _auto_finalize_unsubs(hass)
    for unsub in unsubs.values():
        unsub()
    unsubs.clear()


async def _clear_completion_tracking(hass: HomeAssistant, sensor: ChoreSensor) -> None:
    """
    Cancel any pending timer and forget `sensor`'s tracked completion time.

    Called whenever a chore leaves the Complete state some other way (a
    manual reset, start_new_day, category actions, deletion, ...) so a
    stale timer or a stale completed-at timestamp can't finalize a chore
    that's already moved on.
    """
    _cancel_auto_finalize_timer(hass, sensor)
    points_storage = hass.data[DOMAIN].get("points_storage")
    if points_storage:
        await points_storage.set_chore_completed_at(sensor.entity_id, None)


async def _finalize_sensor(hass: HomeAssistant, sensor: ChoreSensor) -> None:
    """
    Reset a Complete chore sensor to Not Requested, forgetting its tracked completion.

    This is the actual "finalize" action, shared by the scheduled
    auto-finalize timer, the startup/settings-change catch-up pass, and the
    finalize_one service. Points are never touched here - they were already
    awarded when the chore was completed.
    """
    await _clear_completion_tracking(hass, sensor)
    sensor.set_state(ChoreState.NOT_REQUESTED.value)
    await sensor.async_update_ha_state(force_refresh=True)
    LOGGER.info(
        "Finalized %s's completed chore '%s'",
        sensor.assignee,
        sensor.chore.name,
    )
    await _update_summary_sensors(hass, sensor.assignee)
    await _update_privilege_sensors_from_chores(hass, sensor.assignee)


def _get_settings(hass: HomeAssistant) -> SettingsConfig:
    """Read current integration-wide settings, defaulting if unavailable."""
    config_loader: ConfigLoader | None = hass.data[DOMAIN].get("config_loader")
    return config_loader.get_settings() if config_loader else SettingsConfig()


def _schedule_auto_finalize_at(
    hass: HomeAssistant, sensor: ChoreSensor, completed_at: datetime
) -> None:
    """
    (Re)schedule `sensor`'s auto-finalize timer to fire relative to `completed_at`.

    Takes the completion time explicitly (rather than always "now") so the
    same scheduling logic can both start a fresh timer on completion and
    catch a timer up to where it should already be after a restart or a
    missed timer - see async_catch_up_auto_finalize. No-ops if auto-finalize
    is disabled in settings.
    """
    settings = _get_settings(hass)
    _cancel_auto_finalize_timer(hass, sensor)
    if not settings.auto_finalize_enabled:
        return

    fire_at = completed_at + timedelta(minutes=settings.auto_finalize_delay_minutes)
    delay_seconds = max((fire_at - datetime.now(UTC)).total_seconds(), 0)

    async def _finalize(_now: datetime) -> None:
        _auto_finalize_unsubs(hass).pop(sensor.entity_id, None)
        if sensor.get_state() != ChoreState.COMPLETE.value:
            # Already changed by something else - nothing left to finalize.
            return
        await _finalize_sensor(hass, sensor)

    # cancel_on_shutdown so Home Assistant (and the test harness) can drop
    # this job on shutdown instead of treating it as a leaked timer. Losing
    # the in-memory timer on restart is fine - the completed-at timestamp
    # this was scheduled from is persisted, so async_catch_up_auto_finalize
    # reschedules (or immediately finalizes) it once HA comes back up.
    job = HassJob(_finalize, "simple_chores auto-finalize", cancel_on_shutdown=True)
    _auto_finalize_unsubs(hass)[sensor.entity_id] = async_call_later(
        hass, delay_seconds, job
    )


async def _record_completion_and_schedule(
    hass: HomeAssistant, sensor: ChoreSensor
) -> None:
    """
    Record that `sensor` just became Complete, and schedule its auto-finalize.

    The completion timestamp is persisted (see PointsStorage.set_chore_completed_at)
    before scheduling, so it survives a restart even if the in-memory timer
    doesn't - see async_catch_up_auto_finalize.
    """
    now = datetime.now(UTC)
    points_storage = hass.data[DOMAIN].get("points_storage")
    if points_storage:
        await points_storage.set_chore_completed_at(sensor.entity_id, now)
    _schedule_auto_finalize_at(hass, sensor, now)


async def async_catch_up_auto_finalize(hass: HomeAssistant) -> None:
    """
    Reconcile every currently-Complete chore against its tracked completion time.

    Called once at integration startup, and again whenever auto-finalize is
    turned back on via update_settings. A chore whose delay has already
    elapsed - because HA was restarted or simply down while its timer
    should have fired - is finalized immediately. One that still has time
    left gets a fresh timer for the remaining duration. A Complete chore
    with no tracked completion time (e.g. it was already Complete before
    this feature existed) is left alone - there's no way to know when it
    was completed, so nothing is scheduled for it until it's re-completed.
    """
    settings = _get_settings(hass)
    if not settings.auto_finalize_enabled:
        return

    sensors = hass.data[DOMAIN].get("sensors", {})
    points_storage = hass.data[DOMAIN].get("points_storage")
    if not points_storage:
        return

    finalized_now = 0
    rescheduled = 0
    for sensor in sensors.values():
        if sensor.get_state() != ChoreState.COMPLETE.value:
            continue
        completed_at = points_storage.get_chore_completed_at(sensor.entity_id)
        if completed_at is None:
            continue

        fire_at = completed_at + timedelta(minutes=settings.auto_finalize_delay_minutes)
        if fire_at <= datetime.now(UTC):
            await _finalize_sensor(hass, sensor)
            finalized_now += 1
        else:
            _schedule_auto_finalize_at(hass, sensor, completed_at)
            rescheduled += 1

    if finalized_now or rescheduled:
        LOGGER.info(
            "Auto-finalize catch-up: finalized %d overdue chore(s), "
            "rescheduled %d for later",
            finalized_now,
            rescheduled,
        )


CREATE_CHORE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_NAME): cv.string,
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_DESCRIPTION, default=""): cv.string,
        vol.Required(ATTR_FREQUENCY): vol.In(["daily", "manual", "once"]),
        vol.Required(ATTR_ASSIGNEES): cv.string,
        vol.Optional(ATTR_ICON, default="mdi:clipboard-list-outline"): cv.string,
        vol.Optional(ATTR_POINTS, default=1): vol.All(
            vol.Coerce(int), vol.Range(min=0)
        ),
        vol.Optional(ATTR_POINTS_BY_ASSIGNEE, default=""): cv.string,
        vol.Optional(ATTR_CATEGORY, default=""): cv.string,
    }
)

UPDATE_CHORE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_NAME): cv.string,
        vol.Optional(ATTR_DESCRIPTION): cv.string,
        vol.Optional(ATTR_FREQUENCY): vol.In(["daily", "manual", "once"]),
        vol.Optional(ATTR_ASSIGNEES): cv.string,
        vol.Optional(ATTR_ICON): cv.string,
        vol.Optional(ATTR_POINTS): vol.All(vol.Coerce(int), vol.Range(min=0)),
        vol.Optional(ATTR_POINTS_BY_ASSIGNEE): cv.string,
        vol.Optional(ATTR_CATEGORY): cv.string,
        vol.Optional(ATTR_NEW_SLUG): cv.string,
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

# Privilege service schemas
PRIVILEGE_SERVICE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_USER): cv.string,
        vol.Required(ATTR_PRIVILEGE_SLUG): cv.string,
    }
)

TEMPORARILY_DISABLE_PRIVILEGE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_USER): cv.string,
        vol.Required(ATTR_PRIVILEGE_SLUG): cv.string,
        vol.Required(ATTR_DURATION): vol.All(vol.Coerce(int), vol.Range(min=1)),
    }
)

ADJUST_TEMPORARY_DISABLE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_USER): cv.string,
        vol.Required(ATTR_PRIVILEGE_SLUG): cv.string,
        vol.Required(ATTR_ADJUSTMENT): vol.All(
            vol.Coerce(int), vol.Range(min=-1000000, max=1000000)
        ),
    }
)

CREATE_PRIVILEGE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_NAME): cv.string,
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_ICON, default="mdi:star"): cv.string,
        vol.Optional(ATTR_BEHAVIOR, default="automatic"): vol.In(
            ["automatic", "manual"]
        ),
        vol.Optional(ATTR_LINKED_CHORES, default=""): cv.string,
        vol.Required(ATTR_ASSIGNEES): cv.string,
    }
)

UPDATE_PRIVILEGE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_NAME): cv.string,
        vol.Optional(ATTR_ICON): cv.string,
        vol.Optional(ATTR_BEHAVIOR): vol.In(["automatic", "manual"]),
        vol.Optional(ATTR_LINKED_CHORES): cv.string,
        vol.Optional(ATTR_ASSIGNEES): cv.string,
        vol.Optional(ATTR_NEW_SLUG): cv.string,
    }
)

DELETE_PRIVILEGE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
    }
)

# Category service schemas
CREATE_CATEGORY_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_NAME): cv.string,
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_ICON, default="mdi:tag-outline"): cv.string,
    }
)

UPDATE_CATEGORY_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
        vol.Optional(ATTR_NAME): cv.string,
        vol.Optional(ATTR_ICON): cv.string,
        vol.Optional(ATTR_NEW_SLUG): cv.string,
    }
)

DELETE_CATEGORY_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_SLUG): cv.string,
    }
)

UPDATE_SETTINGS_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_AUTO_FINALIZE_ENABLED): cv.boolean,
        vol.Optional(ATTR_AUTO_FINALIZE_DELAY_MINUTES): vol.All(
            vol.Coerce(int), vol.Range(min=1)
        ),
    }
)

CATEGORY_ACTION_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_USER): cv.string,
        vol.Required(ATTR_CATEGORY_SLUG): cv.string,
    }
)


async def handle_mark_complete(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_complete service call."""
    user = call.data.get(ATTR_USER)
    chore_slug = call.data[ATTR_CHORE_SLUG]

    LOGGER.info(
        "Service 'mark_complete' called with user='%s', chore_slug='%s'",
        user or "all assignees",
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
        # Read current state using public accessor
        was_complete = sensor.get_state() == ChoreState.COMPLETE.value

        # Update state directly and batch the HA state update
        sensor.set_state(ChoreState.COMPLETE.value)
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        affected_users.add(sensor.assignee)

        # Audit log: chore marked complete
        LOGGER.info(
            "%s marked '%s' complete",
            sensor.assignee,
            sensor.chore.name,
        )

        # Newly completed (not just re-marking an already-complete chore) -
        # track it and schedule its auto-finalize so it doesn't linger on
        # the display.
        if not was_complete:
            await _record_completion_and_schedule(hass, sensor)

        # Award points for newly completed chore
        if not was_complete and points_storage:
            chore_points = sensor.chore.points_for(sensor.assignee)
            old_total = points_storage.get_points(sensor.assignee)
            old_earned = points_storage.get_points_earned(sensor.assignee)
            await points_storage.add_points(sensor.assignee, chore_points)
            await points_storage.add_points_earned(sensor.assignee, chore_points)
            LOGGER.debug(
                "Awarded %d points to '%s' for completing chore '%s' "
                "(total: %d→%d, earned: %d→%d)",
                chore_points,
                sensor.assignee,
                chore_slug,
                old_total,
                old_total + chore_points,
                old_earned,
                old_earned + chore_points,
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
            # Update privilege sensors based on chore completion
            await _update_privilege_sensors_from_chores(hass, affected_user)


async def handle_mark_pending(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_pending service call."""
    user = call.data.get(ATTR_USER)
    chore_slug = call.data[ATTR_CHORE_SLUG]

    LOGGER.info(
        "Service 'mark_pending' called with user='%s', chore_slug='%s'",
        user or "all assignees",
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
        # Read current state using public accessor
        was_complete = sensor.get_state() == ChoreState.COMPLETE.value

        # Update state directly and batch the HA state update
        sensor.set_state(ChoreState.PENDING.value)
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        affected_users.add(sensor.assignee)

        # Audit log: chore marked pending
        LOGGER.info(
            "%s marked '%s' pending",
            sensor.assignee,
            sensor.chore.name,
        )

        # No longer complete - cancel any pending auto-finalize for it.
        if was_complete:
            await _clear_completion_tracking(hass, sensor)

        # Deduct points for un-completing a chore
        if was_complete and points_storage:
            chore_points = sensor.chore.points_for(sensor.assignee)
            old_total = points_storage.get_points(sensor.assignee)
            old_earned = points_storage.get_points_earned(sensor.assignee)
            await points_storage.add_points(sensor.assignee, -chore_points)
            await points_storage.add_points_earned(sensor.assignee, -chore_points)
            LOGGER.debug(
                "Deducted %d points from '%s' for un-completing chore '%s' "
                "(total: %d→%d, earned: %d→%d)",
                chore_points,
                sensor.assignee,
                chore_slug,
                old_total,
                old_total - chore_points,
                old_earned,
                old_earned - chore_points,
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
            # Update privilege sensors based on chore state change
            await _update_privilege_sensors_from_chores(hass, affected_user)


async def handle_mark_not_requested(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the mark_not_requested service call."""
    user = call.data.get(ATTR_USER)
    chore_slug = call.data[ATTR_CHORE_SLUG]

    LOGGER.info(
        "Service 'mark_not_requested' called with user='%s', chore_slug='%s'",
        user or "all assignees",
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
        sensor.set_state(ChoreState.NOT_REQUESTED.value)
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        affected_users.add(sensor.assignee)
        await _clear_completion_tracking(hass, sensor)

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


async def handle_finalize_one(hass: HomeAssistant, call: ServiceCall) -> None:
    """
    Handle the finalize_one service call.

    Immediately finalizes one chore (optionally scoped to one assignee) that
    is currently Complete - the same reset the auto-finalize timer performs,
    triggered on demand instead of waiting out the delay. Lets the admin
    panel offer a "Finalize" action per completed chore. Sensors that
    aren't currently Complete are silently left alone, same as
    reset_completed tolerates chores with nothing to reset.
    """
    user = call.data.get(ATTR_USER)
    chore_slug = call.data[ATTR_CHORE_SLUG]

    LOGGER.info(
        "Service 'finalize_one' called with user='%s', chore_slug='%s'",
        user or "all assignees",
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

    completed_sensors = [
        sensor
        for sensor in matching_sensors
        if sensor.get_state() == ChoreState.COMPLETE.value
    ]
    if not completed_sensors:
        LOGGER.info(
            "finalize_one: chore '%s' (user=%s) has nothing Complete to finalize",
            chore_slug,
            user or "all assignees",
        )
        return

    for sensor in completed_sensors:
        await _finalize_sensor(hass, sensor)

    LOGGER.info(
        "Finalized %d completed sensor(s) for chore '%s' (user=%s)",
        len(completed_sensors),
        chore_slug,
        user or "all assignees",
    )


async def handle_reset_completed(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the reset_completed service call."""
    user = call.data.get(ATTR_USER)

    LOGGER.info(
        "Service 'reset_completed' called with user='%s'",
        user or "all users",
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
        # Read current state using public accessor
        if sensor.get_state() == ChoreState.COMPLETE.value:
            # Update state directly and batch the HA state update
            sensor.set_state(ChoreState.NOT_REQUESTED.value)
            state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
            affected_users.add(sensor.assignee)
            reset_count += 1
            await _clear_completion_tracking(hass, sensor)

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


async def _apply_start_new_day_points_missed(
    hass: HomeAssistant, sensors: dict, sanitized_user: str | None
) -> None:
    """
    Add each assignee's pending chore points to their cumulative points_missed.

    Must run before start_new_day resets any sensor's state, since it counts
    chores that are still PENDING (points are already awarded on complete,
    so completed chores need no adjustment here).
    """
    points_storage = hass.data[DOMAIN].get("points_storage")
    if not points_storage:
        return

    assignee_stats: dict[str, dict[str, int]] = {}
    for sensor_id, sensor in sensors.items():
        if sanitized_user and not sensor_id.startswith(f"{sanitized_user}_"):
            continue

        assignee = sensor.assignee
        if assignee not in assignee_stats:
            assignee_stats[assignee] = {"missed": 0}

        if sensor.get_state() == ChoreState.PENDING.value:
            assignee_stats[assignee]["missed"] += sensor.chore.points_for(assignee)

    for assignee, stats in assignee_stats.items():
        if stats["missed"] > 0:
            current_missed = points_storage.get_points_missed(assignee)
            await points_storage.add_points_missed(assignee, stats["missed"])
            LOGGER.debug(
                "Updated cumulative points_missed for %s: added %d (was %d, now %d)",
                assignee,
                stats["missed"],
                current_missed,
                current_missed + stats["missed"],
            )


async def handle_start_new_day(hass: HomeAssistant, call: ServiceCall) -> None:
    """
    Handle the start_new_day service call.

    Resets completed chores based on their frequency:
    - manual: Reset to NOT_REQUESTED
    - daily: Reset to PENDING
    - once: Delete the chore entirely
    """
    user = call.data.get(ATTR_USER)

    LOGGER.info(
        "Service 'start_new_day' called with user='%s'",
        user or "all users",
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    config_loader: ConfigLoader | None = hass.data[DOMAIN].get("config_loader")

    # Sanitize user if provided for matching
    sanitized_user = sanitize_entity_id(user) if user else None

    # Calculate points missed per assignee BEFORE resetting any sensor state.
    await _apply_start_new_day_points_missed(hass, sensors, sanitized_user)

    reset_count = 0
    manual_count = 0
    daily_count = 0
    once_count = 0

    # Collect all state changes first, then apply them
    # Track affected users to update only their summary sensors
    affected_users = set()
    state_changes = []
    once_chores_to_delete = []  # Track once chores to delete

    for sensor_id, sensor in sensors.items():
        # If user specified, only reset their chores
        if sanitized_user and not sensor_id.startswith(f"{sanitized_user}_"):
            continue

        # Only reset sensors that are currently COMPLETE
        # Read current state using public accessor
        if sensor.get_state() == ChoreState.COMPLETE.value:
            chore_frequency = sensor.chore.frequency
            affected_users.add(sensor.assignee)
            await _clear_completion_tracking(hass, sensor)

            if chore_frequency == ChoreFrequency.ONCE:
                # Mark once chore for deletion
                once_chores_to_delete.append(sensor.chore.slug)
                reset_count += 1
                once_count += 1
            elif chore_frequency == ChoreFrequency.MANUAL:
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
        sensor.set_state(new_state.value)
        update_tasks.append(sensor.async_update_ha_state(force_refresh=True))

        # Audit log: chore reset for new day
        action = "reset to pending" if new_state == ChoreState.PENDING else "unmarked"
        LOGGER.info(
            "New day: %s's chore '%s' %s",
            sensor.assignee,
            sensor.chore.name,
            action,
        )

    # Await all sensor updates to complete before deleting one-time chores
    if update_tasks:
        await asyncio.gather(*update_tasks)

    # Delete one-time chores that were completed
    for slug in once_chores_to_delete:
        if not config_loader:
            LOGGER.warning(
                "Cannot delete one-time chore '%s': config_loader not available", slug
            )
            continue
        try:
            await config_loader.async_delete_chore(slug)
            LOGGER.info("New day: deleted one-time chore '%s'", slug)
        except Exception as err:  # noqa: BLE001 - one bad delete shouldn't stop the rest
            LOGGER.error("Failed to delete one-time chore '%s': %s", slug, err)

    if user:
        LOGGER.info(
            "Reset %d completed chore(s) for user '%s' "
            "(%d manual to not_requested, %d daily to pending, %d once deleted)",
            reset_count,
            user,
            manual_count,
            daily_count,
            once_count,
        )
    else:
        LOGGER.info(
            "Reset %d completed chore(s) for all users "
            "(%d manual to not_requested, %d daily to pending, %d once deleted)",
            reset_count,
            manual_count,
            daily_count,
            once_count,
        )

    # Update summary sensors to reflect new state (after all chore states are updated)
    # Update summary sensors for the specified user or all users
    # (points_missed gets updated even if no chores were completed)
    await _update_summary_sensors(hass, user)
    # Update privilege sensors based on chore state changes
    await _update_privilege_sensors_from_chores(hass, user)


def _parse_points_by_assignee(value: str) -> dict[str, int]:
    """
    Parse a "user:points,user2:points2" string into a points override map.

    An empty string parses to an empty dict (no overrides), same as
    omitting every entry.

    Raises:
        ServiceValidationError: If an entry is malformed or its points
            value isn't a non-negative integer.

    """
    overrides: dict[str, int] = {}
    for raw_entry in value.split(","):
        entry = raw_entry.strip()
        if not entry:
            continue
        if ":" not in entry:
            msg = f"Invalid points_by_assignee entry '{entry}' - expected 'user:points'"
            raise ServiceValidationError(msg)
        user, _, points_str = entry.partition(":")
        user = user.strip()
        try:
            points = int(points_str.strip())
        except ValueError as err:
            msg = f"Invalid points value '{points_str}' for '{user}'"
            raise ServiceValidationError(msg) from err
        if not user or points < 0:
            msg = f"Invalid points_by_assignee entry '{entry}'"
            raise ServiceValidationError(msg)
        overrides[user] = points
    return overrides


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
            points_by_assignee=_parse_points_by_assignee(
                call.data.get(ATTR_POINTS_BY_ASSIGNEE, "")
            ),
            category=call.data.get(ATTR_CATEGORY, ""),
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
    points_by_assignee_str = call.data.get(ATTR_POINTS_BY_ASSIGNEE)
    category = call.data.get(ATTR_CATEGORY)
    new_slug = call.data.get(ATTR_NEW_SLUG)

    points_by_assignee = (
        _parse_points_by_assignee(points_by_assignee_str)
        if points_by_assignee_str is not None
        else None
    )

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
            points_by_assignee=points_by_assignee,
            category=category,
            new_slug=new_slug,
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


def _find_matching_sensors_by_category(
    sensors: dict,
    category_slug: str,
    user: str | None = None,
    *,
    frequency: ChoreFrequency | None = None,
) -> list:
    """
    Find chore sensors whose chore is assigned to the given category.

    Args:
        sensors: Dictionary of sensors
        category_slug: Category slug to match
        user: Optional user to filter by
        frequency: Optional chore frequency to filter by (e.g. only `manual`
            chores)

    Returns:
        List of matching sensors

    """
    sanitized_category = sanitize_entity_id(category_slug)
    sanitized_user = sanitize_entity_id(user) if user else None
    matching_sensors = []

    for sensor_id, sensor in sensors.items():
        if sanitized_user and not sensor_id.startswith(f"{sanitized_user}_"):
            continue
        if sensor.chore.category != sanitized_category:
            continue
        if frequency is not None and sensor.chore.frequency != frequency:
            continue
        matching_sensors.append(sensor)

    return matching_sensors


def _no_category_sensors_message(category_slug: str, user: str | None) -> str:
    """Build the error message for a by-category action that matched nothing."""
    if user:
        return f"No chore sensor found for user '{user}' and category '{category_slug}'"
    return f"No chore sensors found for category '{category_slug}'"


async def _set_chore_sensors_state_by_category(
    hass: HomeAssistant,
    matching_sensors: list,
    new_state: ChoreState,
) -> set[str]:
    """
    Set `new_state` on every sensor in `matching_sensors`.

    Points are awarded/deducted with the same rules as the single-chore
    mark_complete/mark_pending services: completing a chore that wasn't
    already complete awards its points, and requesting (pending) a chore
    that was complete deducts them. Clearing a chore (not_requested) never
    touches points, matching mark_not_requested.

    Args:
        hass: Home Assistant instance
        matching_sensors: Sensors to update
        new_state: State to set on every sensor

    Returns:
        The set of assignees whose sensors changed, for refreshing their
        summary/privilege sensors.

    """
    points_storage = hass.data[DOMAIN].get("points_storage")
    affected_users: set[str] = set()
    state_update_tasks = []

    for sensor in matching_sensors:
        was_complete = sensor.get_state() == ChoreState.COMPLETE.value
        sensor.set_state(new_state.value)
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        affected_users.add(sensor.assignee)

        LOGGER.info(
            "%s's chore '%s' set to '%s' (by category)",
            sensor.assignee,
            sensor.chore.name,
            new_state.value,
        )

        if new_state == ChoreState.COMPLETE and not was_complete:
            await _record_completion_and_schedule(hass, sensor)
        elif was_complete and new_state != ChoreState.COMPLETE:
            await _clear_completion_tracking(hass, sensor)

        chore_points = sensor.chore.points_for(sensor.assignee)
        if points_storage and new_state == ChoreState.COMPLETE and not was_complete:
            await points_storage.add_points(sensor.assignee, chore_points)
            await points_storage.add_points_earned(sensor.assignee, chore_points)
        elif points_storage and new_state == ChoreState.PENDING and was_complete:
            await points_storage.add_points(sensor.assignee, -chore_points)
            await points_storage.add_points_earned(sensor.assignee, -chore_points)

    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    return affected_users


async def handle_mark_complete_by_category(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    """Handle the mark_complete_by_category service call."""
    user = call.data.get(ATTR_USER)
    category_slug = call.data[ATTR_CATEGORY_SLUG]

    LOGGER.info(
        "Service 'mark_complete_by_category' called with user='%s', category_slug='%s'",
        user or "all assignees",
        category_slug,
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    matching_sensors = _find_matching_sensors_by_category(sensors, category_slug, user)

    if not matching_sensors:
        msg = _no_category_sensors_message(category_slug, user)
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    affected_users = await _set_chore_sensors_state_by_category(
        hass, matching_sensors, ChoreState.COMPLETE
    )

    LOGGER.info(
        "Marked %d chore(s) in category '%s' complete for %d assignee(s)",
        len(matching_sensors),
        category_slug,
        len(affected_users),
    )

    for affected_user in affected_users:
        await _update_summary_sensors(hass, affected_user)
        await _update_privilege_sensors_from_chores(hass, affected_user)


async def handle_mark_pending_by_category(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    """Handle the mark_pending_by_category service call."""
    user = call.data.get(ATTR_USER)
    category_slug = call.data[ATTR_CATEGORY_SLUG]

    LOGGER.info(
        "Service 'mark_pending_by_category' called with user='%s', category_slug='%s'",
        user or "all assignees",
        category_slug,
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    matching_sensors = _find_matching_sensors_by_category(sensors, category_slug, user)

    if not matching_sensors:
        msg = _no_category_sensors_message(category_slug, user)
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    affected_users = await _set_chore_sensors_state_by_category(
        hass, matching_sensors, ChoreState.PENDING
    )

    LOGGER.info(
        "Marked %d chore(s) in category '%s' pending for %d assignee(s)",
        len(matching_sensors),
        category_slug,
        len(affected_users),
    )

    for affected_user in affected_users:
        await _update_summary_sensors(hass, affected_user)
        await _update_privilege_sensors_from_chores(hass, affected_user)


async def handle_mark_not_requested_by_category(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    """Handle the mark_not_requested_by_category service call."""
    user = call.data.get(ATTR_USER)
    category_slug = call.data[ATTR_CATEGORY_SLUG]

    LOGGER.info(
        "Service 'mark_not_requested_by_category' called with user='%s', "
        "category_slug='%s'",
        user or "all assignees",
        category_slug,
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    matching_sensors = _find_matching_sensors_by_category(sensors, category_slug, user)

    if not matching_sensors:
        msg = _no_category_sensors_message(category_slug, user)
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    affected_users = await _set_chore_sensors_state_by_category(
        hass, matching_sensors, ChoreState.NOT_REQUESTED
    )

    LOGGER.info(
        "Marked %d chore(s) in category '%s' not requested for %d assignee(s)",
        len(matching_sensors),
        category_slug,
        len(affected_users),
    )

    for affected_user in affected_users:
        await _update_summary_sensors(hass, affected_user)


async def handle_finalize_by_category(hass: HomeAssistant, call: ServiceCall) -> None:
    """
    Handle the finalize_by_category service call.

    Like start_new_day, but scoped to a single category and restricted to
    chores with a `manual` frequency:
    - manual chores that are complete are reset to NOT_REQUESTED
    - manual chores that are still pending count towards cumulative
      points_missed, same as start_new_day does before it resets

    Daily and once chores in the category are left untouched - use
    start_new_day (or the other by-category actions) for those.
    """
    user = call.data.get(ATTR_USER)
    category_slug = call.data[ATTR_CATEGORY_SLUG]

    LOGGER.info(
        "Service 'finalize_by_category' called with user='%s', category_slug='%s'",
        user or "all assignees",
        category_slug,
    )

    _validate_integration_loaded(hass)
    sensors = hass.data[DOMAIN].get("sensors", {})
    points_storage = hass.data[DOMAIN].get("points_storage")
    matching_sensors = _find_matching_sensors_by_category(
        sensors, category_slug, user, frequency=ChoreFrequency.MANUAL
    )

    if not matching_sensors:
        if user:
            msg = (
                f"No manual chore sensor found for user '{user}' and "
                f"category '{category_slug}'"
            )
        else:
            msg = f"No manual chore sensors found for category '{category_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    affected_users: set[str] = set()
    sensors_to_reset = []

    for sensor in matching_sensors:
        current_state = sensor.get_state()

        if current_state == ChoreState.PENDING.value:
            affected_users.add(sensor.assignee)
            chore_points = sensor.chore.points_for(sensor.assignee)
            if points_storage and chore_points:
                await points_storage.add_points_missed(sensor.assignee, chore_points)
        elif current_state == ChoreState.COMPLETE.value:
            affected_users.add(sensor.assignee)
            sensors_to_reset.append(sensor)

    update_tasks = []
    for sensor in sensors_to_reset:
        sensor.set_state(ChoreState.NOT_REQUESTED.value)
        update_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        await _clear_completion_tracking(hass, sensor)

        # Audit log: chore reset by finalize_by_category
        LOGGER.info(
            "Finalize by category: %s's chore '%s' unmarked",
            sensor.assignee,
            sensor.chore.name,
        )

    if update_tasks:
        await asyncio.gather(*update_tasks)

    LOGGER.info(
        "Finalized category '%s': %d manual chore(s) reset for %d assignee(s)",
        category_slug,
        len(sensors_to_reset),
        len(affected_users),
    )

    # Update summary/privilege sensors for everyone touched, whether their
    # chore was reset or only counted towards points_missed.
    for affected_user in affected_users:
        await _update_summary_sensors(hass, affected_user)
        await _update_privilege_sensors_from_chores(hass, affected_user)


async def handle_create_category(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the create_category service call."""
    LOGGER.info(
        "Service 'create_category' called with slug='%s', name='%s'",
        call.data.get(ATTR_SLUG),
        call.data.get(ATTR_NAME),
    )

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    try:
        category = CategoryConfig(
            name=call.data[ATTR_NAME],
            slug=call.data[ATTR_SLUG],
            icon=call.data.get(ATTR_ICON, "mdi:tag-outline"),
        )
        await config_loader.async_create_category(category)
        LOGGER.info("Created category '%s'", category.slug)
    except Exception as err:
        msg = f"Failed to create category: {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


async def handle_update_category(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the update_category service call."""
    LOGGER.info(
        "Service 'update_category' called with slug='%s', updates=%s",
        call.data.get(ATTR_SLUG),
        {k: v for k, v in call.data.items() if k != ATTR_SLUG},
    )

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    slug = call.data[ATTR_SLUG]
    name = call.data.get(ATTR_NAME)
    icon = call.data.get(ATTR_ICON)
    new_slug = call.data.get(ATTR_NEW_SLUG)

    try:
        await config_loader.async_update_category(
            slug=slug, name=name, icon=icon, new_slug=new_slug
        )
        LOGGER.info("Updated category '%s'", slug)
    except Exception as err:
        msg = f"Failed to update category '{slug}': {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


async def handle_delete_category(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the delete_category service call."""
    slug = call.data[ATTR_SLUG]

    LOGGER.info("Service 'delete_category' called with slug='%s'", slug)

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    try:
        await config_loader.async_delete_category(slug)
        LOGGER.info("Deleted category '%s'", slug)
    except Exception as err:
        msg = f"Failed to delete category '{slug}': {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


async def handle_update_settings(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the update_settings service call."""
    LOGGER.info("Service 'update_settings' called with updates=%s", dict(call.data))

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    auto_finalize_enabled = call.data.get(ATTR_AUTO_FINALIZE_ENABLED)
    auto_finalize_delay_minutes = call.data.get(ATTR_AUTO_FINALIZE_DELAY_MINUTES)

    try:
        await config_loader.async_update_settings(
            auto_finalize_enabled=auto_finalize_enabled,
            auto_finalize_delay_minutes=auto_finalize_delay_minutes,
        )
    except Exception as err:
        msg = f"Failed to update settings: {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err

    # Reconcile every pending/tracked completion against the new settings:
    # disabling cancels timers outright (their tracked completed_at is left
    # alone in case it's re-enabled later); anything else re-derives each
    # timer from the (possibly changed) delay, same as a fresh startup catch-up.
    if config_loader.get_settings().auto_finalize_enabled:
        await async_catch_up_auto_finalize(hass)
    else:
        _cancel_all_auto_finalize_timers(hass)

    LOGGER.info("Updated settings")


async def handle_refresh_summary(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the refresh_summary service call."""
    user = call.data.get(ATTR_USER)

    LOGGER.info(
        "Service 'refresh_summary' called with user='%s'",
        user or "all users",
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
        user or "all users",
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
        # Always reset points_earned and points_missed
        # (points_possible is calculated dynamically)
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


def _find_matching_privilege_sensors(
    privilege_sensors: dict, privilege_slug: str, user: str | None = None
) -> list:
    """
    Find privilege sensors matching slug and optionally user.

    Args:
        privilege_sensors: Dictionary of privilege sensors
        privilege_slug: Privilege slug to match
        user: Optional user to filter by

    Returns:
        List of matching privilege sensors

    """
    sanitized_slug = sanitize_entity_id(privilege_slug)
    matching_sensors = []

    if user:
        # Specific user
        sensor_id = f"{sanitize_entity_id(user)}_{sanitized_slug}"
        if sensor_id in privilege_sensors:
            matching_sensors.append(privilege_sensors[sensor_id])
    else:
        # All assignees for this privilege
        for sensor_id, sensor in privilege_sensors.items():
            if sensor_id.endswith(f"_{sanitized_slug}"):
                matching_sensors.append(sensor)

    return matching_sensors


async def _update_privilege_sensors_from_chores(
    hass: HomeAssistant, user: str | None = None
) -> None:
    """
    Update privilege sensors based on chore state changes.

    Args:
        hass: Home Assistant instance
        user: Optional user to update, or None for all users

    """
    privilege_sensors = hass.data[DOMAIN].get("privilege_sensors", {})
    if not privilege_sensors:
        return

    update_tasks = []
    for sensor_id, sensor in privilege_sensors.items():
        if user:
            sanitized_user = sanitize_entity_id(user)
            if not sensor_id.startswith(f"{sanitized_user}_"):
                continue
        # Update the privilege sensor state based on linked chores
        update_tasks.append(sensor.async_update_from_chores())

    if update_tasks:
        await asyncio.gather(*update_tasks)
        # Write updated states
        state_tasks = []
        for sensor_id, sensor in privilege_sensors.items():
            if user:
                sanitized_user = sanitize_entity_id(user)
                if not sensor_id.startswith(f"{sanitized_user}_"):
                    continue
            state_tasks.append(sensor.async_update_ha_state(force_refresh=True))
        if state_tasks:
            await asyncio.gather(*state_tasks)


async def handle_enable_privilege(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the enable_privilege service call."""
    user = call.data.get(ATTR_USER)
    privilege_slug = call.data[ATTR_PRIVILEGE_SLUG]

    LOGGER.info(
        "Service 'enable_privilege' called with user='%s', privilege_slug='%s'",
        user or "all assignees",
        privilege_slug,
    )

    _validate_integration_loaded(hass)
    privilege_sensors = hass.data[DOMAIN].get("privilege_sensors", {})
    matching_sensors = _find_matching_privilege_sensors(
        privilege_sensors, privilege_slug, user
    )

    if not matching_sensors:
        if user:
            msg = (
                f"No privilege sensor found for user '{user}' "
                f"and privilege '{privilege_slug}'"
            )
        else:
            msg = f"No privilege sensors found for privilege '{privilege_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    # Enable all matching privilege sensors
    state_update_tasks = []
    for sensor in matching_sensors:
        await sensor.async_enable()
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))

    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info("Enabled privilege '%s' for user '%s'", privilege_slug, user)
    else:
        LOGGER.info(
            "Enabled privilege '%s' for %d assignee(s)",
            privilege_slug,
            len(matching_sensors),
        )


async def handle_disable_privilege(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the disable_privilege service call."""
    user = call.data.get(ATTR_USER)
    privilege_slug = call.data[ATTR_PRIVILEGE_SLUG]

    LOGGER.info(
        "Service 'disable_privilege' called with user='%s', privilege_slug='%s'",
        user or "all assignees",
        privilege_slug,
    )

    _validate_integration_loaded(hass)
    privilege_sensors = hass.data[DOMAIN].get("privilege_sensors", {})
    matching_sensors = _find_matching_privilege_sensors(
        privilege_sensors, privilege_slug, user
    )

    if not matching_sensors:
        if user:
            msg = (
                f"No privilege sensor found for user '{user}' "
                f"and privilege '{privilege_slug}'"
            )
        else:
            msg = f"No privilege sensors found for privilege '{privilege_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    # Disable all matching privilege sensors
    state_update_tasks = []
    for sensor in matching_sensors:
        await sensor.async_disable()
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))

    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info("Disabled privilege '%s' for user '%s'", privilege_slug, user)
    else:
        LOGGER.info(
            "Disabled privilege '%s' for %d assignee(s)",
            privilege_slug,
            len(matching_sensors),
        )


async def handle_temporarily_disable_privilege(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    """Handle the temporarily_disable_privilege service call."""
    user = call.data.get(ATTR_USER)
    privilege_slug = call.data[ATTR_PRIVILEGE_SLUG]
    duration = call.data[ATTR_DURATION]

    LOGGER.info(
        "Service 'temporarily_disable_privilege' called with "
        "user='%s', privilege_slug='%s', duration=%d",
        user or "all assignees",
        privilege_slug,
        duration,
    )

    _validate_integration_loaded(hass)
    privilege_sensors = hass.data[DOMAIN].get("privilege_sensors", {})
    matching_sensors = _find_matching_privilege_sensors(
        privilege_sensors, privilege_slug, user
    )

    if not matching_sensors:
        if user:
            msg = (
                f"No privilege sensor found for user '{user}' "
                f"and privilege '{privilege_slug}'"
            )
        else:
            msg = f"No privilege sensors found for privilege '{privilege_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    # Temporarily disable all matching privilege sensors
    state_update_tasks = []
    for sensor in matching_sensors:
        await sensor.async_temporarily_disable(duration)
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))

    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info(
            "Temporarily disabled privilege '%s' for user '%s' for %d minutes",
            privilege_slug,
            user,
            duration,
        )
    else:
        LOGGER.info(
            "Temporarily disabled privilege '%s' for %d assignee(s) for %d minutes",
            privilege_slug,
            len(matching_sensors),
            duration,
        )


async def handle_adjust_temporary_disable(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    """Handle the adjust_temporary_disable service call."""
    user = call.data.get(ATTR_USER)
    privilege_slug = call.data[ATTR_PRIVILEGE_SLUG]
    adjustment = call.data[ATTR_ADJUSTMENT]

    LOGGER.info(
        "Service 'adjust_temporary_disable' called with "
        "user='%s', privilege_slug='%s', adjustment=%d",
        user or "all assignees",
        privilege_slug,
        adjustment,
    )

    _validate_integration_loaded(hass)
    privilege_sensors = hass.data[DOMAIN].get("privilege_sensors", {})
    matching_sensors = _find_matching_privilege_sensors(
        privilege_sensors, privilege_slug, user
    )

    if not matching_sensors:
        if user:
            msg = (
                f"No privilege sensor found for user '{user}' "
                f"and privilege '{privilege_slug}'"
            )
        else:
            msg = f"No privilege sensors found for privilege '{privilege_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    # Adjust temporary disable for all matching privilege sensors
    state_update_tasks = []
    for sensor in matching_sensors:
        await sensor.async_adjust_temporary_disable(adjustment)
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))

    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info(
            "Adjusted temporary disable for privilege '%s' by %d minutes for user '%s'",
            privilege_slug,
            adjustment,
            user,
        )
    else:
        LOGGER.info(
            "Adjusted temporary disable for privilege '%s' by %d minutes "
            "for %d assignee(s)",
            privilege_slug,
            adjustment,
            len(matching_sensors),
        )


async def handle_clear_temporary_disable(
    hass: HomeAssistant, call: ServiceCall
) -> None:
    """Handle the clear_temporary_disable service call."""
    user = call.data.get(ATTR_USER)
    privilege_slug = call.data[ATTR_PRIVILEGE_SLUG]

    LOGGER.info(
        "Service 'clear_temporary_disable' called with user='%s', privilege_slug='%s'",
        user or "all assignees",
        privilege_slug,
    )

    _validate_integration_loaded(hass)
    privilege_sensors = hass.data[DOMAIN].get("privilege_sensors", {})
    matching_sensors = _find_matching_privilege_sensors(
        privilege_sensors, privilege_slug, user
    )

    if not matching_sensors:
        if user:
            msg = (
                f"No privilege sensor found for user '{user}' "
                f"and privilege '{privilege_slug}'"
            )
        else:
            msg = f"No privilege sensors found for privilege '{privilege_slug}'"
        LOGGER.error(msg)
        raise ServiceValidationError(msg)

    # Clear the temporary disable for all matching privilege sensors
    state_update_tasks = []
    for sensor in matching_sensors:
        await sensor.async_clear_temporary_disable()
        state_update_tasks.append(sensor.async_update_ha_state(force_refresh=True))

    if state_update_tasks:
        await asyncio.gather(*state_update_tasks)

    if user:
        LOGGER.info(
            "Cleared temporary disable for privilege '%s' for user '%s'",
            privilege_slug,
            user,
        )
    else:
        LOGGER.info(
            "Cleared temporary disable for privilege '%s' for %d assignee(s)",
            privilege_slug,
            len(matching_sensors),
        )


async def handle_create_privilege(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the create_privilege service call."""
    LOGGER.info(
        "Service 'create_privilege' called with slug='%s', name='%s', assignees='%s'",
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

    # Parse linked chores from comma-separated string
    linked_chores_str = call.data.get(ATTR_LINKED_CHORES, "")
    linked_chores = [c.strip() for c in linked_chores_str.split(",") if c.strip()]

    try:
        privilege = PrivilegeConfig(
            name=call.data[ATTR_NAME],
            slug=call.data[ATTR_SLUG],
            icon=call.data.get(ATTR_ICON, "mdi:star"),
            behavior=PrivilegeBehavior(call.data.get(ATTR_BEHAVIOR, "automatic")),
            linked_chores=linked_chores,
            assignees=assignees,
        )
        await config_loader.async_create_privilege(privilege)
        LOGGER.info("Created privilege '%s'", privilege.slug)
    except Exception as err:
        msg = f"Failed to create privilege: {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


async def handle_update_privilege(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the update_privilege service call."""
    LOGGER.info(
        "Service 'update_privilege' called with slug='%s', updates=%s",
        call.data.get(ATTR_SLUG),
        {k: v for k, v in call.data.items() if k != ATTR_SLUG},
    )

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    slug = call.data[ATTR_SLUG]
    name = call.data.get(ATTR_NAME)
    icon = call.data.get(ATTR_ICON)
    behavior = call.data.get(ATTR_BEHAVIOR)
    linked_chores_str = call.data.get(ATTR_LINKED_CHORES)
    assignees_str = call.data.get(ATTR_ASSIGNEES)
    new_slug = call.data.get(ATTR_NEW_SLUG)

    # Parse linked chores if provided
    linked_chores = None
    if linked_chores_str is not None:
        linked_chores = [c.strip() for c in linked_chores_str.split(",") if c.strip()]

    # Parse assignees if provided
    assignees = None
    if assignees_str:
        assignees = [a.strip() for a in assignees_str.split(",") if a.strip()]
        if not assignees:
            msg = "At least one assignee is required when updating assignees"
            LOGGER.error(msg)
            raise ServiceValidationError(msg)

    try:
        await config_loader.async_update_privilege(
            slug=slug,
            name=name,
            icon=icon,
            behavior=behavior,
            linked_chores=linked_chores,
            assignees=assignees,
            new_slug=new_slug,
        )
        LOGGER.info("Updated privilege '%s'", slug)
    except Exception as err:
        msg = f"Failed to update privilege '{slug}': {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


async def handle_delete_privilege(hass: HomeAssistant, call: ServiceCall) -> None:
    """Handle the delete_privilege service call."""
    slug = call.data[ATTR_SLUG]

    LOGGER.info("Service 'delete_privilege' called with slug='%s'", slug)

    _validate_integration_loaded(hass)
    config_loader: ConfigLoader = hass.data[DOMAIN]["config_loader"]

    try:
        await config_loader.async_delete_privilege(slug)
        LOGGER.info("Deleted privilege '%s'", slug)
    except Exception as err:
        msg = f"Failed to delete privilege '{slug}': {err}"
        LOGGER.error(msg)
        raise ServiceValidationError(msg) from err


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
        SERVICE_FINALIZE_ONE,
        partial(handle_finalize_one, hass),
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
    # Category-scoped chore services
    hass.services.async_register(
        DOMAIN,
        SERVICE_MARK_COMPLETE_BY_CATEGORY,
        partial(handle_mark_complete_by_category, hass),
        schema=CATEGORY_ACTION_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_MARK_PENDING_BY_CATEGORY,
        partial(handle_mark_pending_by_category, hass),
        schema=CATEGORY_ACTION_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_MARK_NOT_REQUESTED_BY_CATEGORY,
        partial(handle_mark_not_requested_by_category, hass),
        schema=CATEGORY_ACTION_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_FINALIZE_BY_CATEGORY,
        partial(handle_finalize_by_category, hass),
        schema=CATEGORY_ACTION_SCHEMA,
    )
    # Category management services
    hass.services.async_register(
        DOMAIN,
        SERVICE_CREATE_CATEGORY,
        partial(handle_create_category, hass),
        schema=CREATE_CATEGORY_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_CATEGORY,
        partial(handle_update_category, hass),
        schema=UPDATE_CATEGORY_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_DELETE_CATEGORY,
        partial(handle_delete_category, hass),
        schema=DELETE_CATEGORY_SCHEMA,
    )
    # Settings service
    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_SETTINGS,
        partial(handle_update_settings, hass),
        schema=UPDATE_SETTINGS_SCHEMA,
    )
    # Privilege services
    hass.services.async_register(
        DOMAIN,
        SERVICE_ENABLE_PRIVILEGE,
        partial(handle_enable_privilege, hass),
        schema=PRIVILEGE_SERVICE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_DISABLE_PRIVILEGE,
        partial(handle_disable_privilege, hass),
        schema=PRIVILEGE_SERVICE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_TEMPORARILY_DISABLE_PRIVILEGE,
        partial(handle_temporarily_disable_privilege, hass),
        schema=TEMPORARILY_DISABLE_PRIVILEGE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADJUST_TEMPORARY_DISABLE,
        partial(handle_adjust_temporary_disable, hass),
        schema=ADJUST_TEMPORARY_DISABLE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_CLEAR_TEMPORARY_DISABLE,
        partial(handle_clear_temporary_disable, hass),
        schema=PRIVILEGE_SERVICE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_CREATE_PRIVILEGE,
        partial(handle_create_privilege, hass),
        schema=CREATE_PRIVILEGE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_PRIVILEGE,
        partial(handle_update_privilege, hass),
        schema=UPDATE_PRIVILEGE_SCHEMA,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_DELETE_PRIVILEGE,
        partial(handle_delete_privilege, hass),
        schema=DELETE_PRIVILEGE_SCHEMA,
    )
    LOGGER.debug("Registered Simple Chores services")

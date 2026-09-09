"""Constants for simple_chores."""

import re
from logging import Logger, getLogger

LOGGER: Logger = getLogger(__package__)

DOMAIN = "simple_chores"
ATTRIBUTION = "Simple Chores"

# Configuration
CONFIG_FILE_NAME = "simple_chores.yaml"

# States
STATE_PENDING = "Pending"
STATE_COMPLETE = "Complete"
STATE_NOT_REQUESTED = "Not Requested"

# Privilege states
STATE_ENABLED = "Availabile"
STATE_DISABLED = "Not Available"
STATE_TEMPORARILY_DISABLED = "Blocked"

# Chore Services
SERVICE_MARK_COMPLETE = "mark_complete"
SERVICE_MARK_PENDING = "mark_pending"
SERVICE_MARK_NOT_REQUESTED = "mark_not_requested"
SERVICE_RESET_COMPLETED = "reset_completed"
SERVICE_START_NEW_DAY = "start_new_day"
SERVICE_CREATE_CHORE = "create_chore"
SERVICE_UPDATE_CHORE = "update_chore"
SERVICE_DELETE_CHORE = "delete_chore"
SERVICE_REFRESH_SUMMARY = "refresh_summary"
SERVICE_ADJUST_POINTS = "adjust_points"
SERVICE_RESET_POINTS = "reset_points"

# Category-scoped chore services
SERVICE_MARK_COMPLETE_BY_CATEGORY = "mark_complete_by_category"
SERVICE_MARK_PENDING_BY_CATEGORY = "mark_pending_by_category"
SERVICE_MARK_NOT_REQUESTED_BY_CATEGORY = "mark_not_requested_by_category"
SERVICE_FINALIZE_BY_CATEGORY = "finalize_by_category"

# Category management services
SERVICE_CREATE_CATEGORY = "create_category"
SERVICE_UPDATE_CATEGORY = "update_category"
SERVICE_DELETE_CATEGORY = "delete_category"

# Settings service
SERVICE_UPDATE_SETTINGS = "update_settings"

# Privilege Services
SERVICE_ENABLE_PRIVILEGE = "enable_privilege"
SERVICE_DISABLE_PRIVILEGE = "disable_privilege"
SERVICE_TEMPORARILY_DISABLE_PRIVILEGE = "temporarily_disable_privilege"
SERVICE_ADJUST_TEMPORARY_DISABLE = "adjust_temporary_disable"
SERVICE_CLEAR_TEMPORARY_DISABLE = "clear_temporary_disable"
SERVICE_CREATE_PRIVILEGE = "create_privilege"
SERVICE_UPDATE_PRIVILEGE = "update_privilege"
SERVICE_DELETE_PRIVILEGE = "delete_privilege"

# Service parameters
ATTR_USER = "user"
ATTR_CHORE_SLUG = "chore_slug"
ATTR_NAME = "name"
ATTR_SLUG = "slug"
ATTR_DESCRIPTION = "description"
ATTR_FREQUENCY = "frequency"
ATTR_ASSIGNEES = "assignees"
ATTR_ICON = "icon"
ATTR_POINTS = "points"
ATTR_ADJUSTMENT = "adjustment"
ATTR_RESET_TOTAL = "reset_total"
ATTR_CATEGORY = "category"
ATTR_CATEGORY_SLUG = "category_slug"
ATTR_NEW_SLUG = "new_slug"

# Settings service parameters
ATTR_AUTO_FINALIZE_ENABLED = "auto_finalize_enabled"
ATTR_AUTO_FINALIZE_DELAY_MINUTES = "auto_finalize_delay_minutes"

# Privilege service parameters
ATTR_PRIVILEGE_SLUG = "privilege_slug"
ATTR_DURATION = "duration"
ATTR_BEHAVIOR = "behavior"
ATTR_LINKED_CHORES = "linked_chores"

# --- Admin panel -------------------------------------------------------
# Path (relative to this package) of the built frontend bundle. The bundle
# itself is produced by `npm run build` in frontend/ and is committed to the
# repo, the same way HACS-distributed integrations ship their compiled JS.
PANEL_FILENAME = "frontend/dist/simple-chores-panel.js"
PANEL_URL = f"/api/panel_custom/{DOMAIN}"
PANEL_NAME = "simple-chores-panel"
PANEL_TITLE = "Chores"
PANEL_ICON = "mdi:clipboard-check-outline"

# Singleton entity publishing integration-wide settings (see SettingsConfig
# in models.py) for the admin panel to read - lives under the same
# `..._meta_` prefix as the per-assignee summary sensors so it's already
# excluded by the frontend's chore-sensor scan.
SETTINGS_ENTITY_ID = "sensor.simple_chore_meta_settings"


def sanitize_entity_id(value: str) -> str:
    """
    Sanitize a string for use in entity IDs.

    Converts hyphens to underscores, removes any characters that are not
    alphanumeric or underscores, and collapses runs of consecutive
    underscores (e.g. from a name with several separators in a row) into a
    single one.

    Args:
        value: String to sanitize

    Returns:
        Sanitized string safe for entity IDs

    """
    # Convert to lowercase
    value = value.lower()
    # Replace hyphens with underscores
    value = value.replace("-", "_")
    # Keep only alphanumeric and underscores
    value = "".join(c for c in value if c.isalnum() or c == "_")
    # Collapse double (or longer) underscores into one
    return re.sub(r"_+", "_", value)

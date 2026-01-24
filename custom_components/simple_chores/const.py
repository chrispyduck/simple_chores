"""Constants for simple_chores."""

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
STATE_ENABLED = "Enabled"
STATE_DISABLED = "Disabled"
STATE_TEMPORARILY_DISABLED = "Temporarily Disabled"

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

# Privilege Services
SERVICE_ENABLE_PRIVILEGE = "enable_privilege"
SERVICE_DISABLE_PRIVILEGE = "disable_privilege"
SERVICE_TEMPORARILY_DISABLE_PRIVILEGE = "temporarily_disable_privilege"
SERVICE_ADJUST_TEMPORARY_DISABLE = "adjust_temporary_disable"
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

# Privilege service parameters
ATTR_PRIVILEGE_SLUG = "privilege_slug"
ATTR_DURATION = "duration"
ATTR_BEHAVIOR = "behavior"
ATTR_LINKED_CHORES = "linked_chores"


def sanitize_entity_id(value: str) -> str:
    """
    Sanitize a string for use in entity IDs.

    Converts hyphens to underscores and removes any characters
    that are not alphanumeric or underscores.

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
    return value

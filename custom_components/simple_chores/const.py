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

# Services
SERVICE_MARK_COMPLETE = "mark_complete"
SERVICE_MARK_PENDING = "mark_pending"
SERVICE_MARK_NOT_REQUESTED = "mark_not_requested"

# Service parameters
ATTR_USER = "user"
ATTR_CHORE_SLUG = "chore_slug"

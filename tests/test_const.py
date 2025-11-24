"""Tests for simple_chores constants."""

from custom_components.simple_chores.const import (
    ATTR_CHORE_SLUG,
    ATTR_USER,
    ATTRIBUTION,
    CONFIG_FILE_NAME,
    DOMAIN,
    LOGGER,
    SERVICE_MARK_COMPLETE,
    SERVICE_MARK_NOT_REQUESTED,
    SERVICE_MARK_PENDING,
    STATE_COMPLETE,
    STATE_NOT_REQUESTED,
    STATE_PENDING,
)


class TestConstants:
    """Tests for constants module."""

    def test_domain_constant(self):
        """Test DOMAIN constant."""
        assert DOMAIN == "simple_chores"
        assert isinstance(DOMAIN, str)

    def test_attribution_constant(self):
        """Test ATTRIBUTION constant."""
        assert ATTRIBUTION == "Simple Chores"
        assert isinstance(ATTRIBUTION, str)

    def test_config_file_name(self):
        """Test CONFIG_FILE_NAME constant."""
        assert CONFIG_FILE_NAME == "simple_chores.yaml"
        assert isinstance(CONFIG_FILE_NAME, str)

    def test_state_constants(self):
        """Test state constants."""
        assert STATE_PENDING == "Pending"
        assert STATE_COMPLETE == "Complete"
        assert STATE_NOT_REQUESTED == "Not Requested"

        # Ensure they are all strings
        assert isinstance(STATE_PENDING, str)
        assert isinstance(STATE_COMPLETE, str)
        assert isinstance(STATE_NOT_REQUESTED, str)

    def test_service_constants(self):
        """Test service name constants."""
        assert SERVICE_MARK_COMPLETE == "mark_complete"
        assert SERVICE_MARK_PENDING == "mark_pending"
        assert SERVICE_MARK_NOT_REQUESTED == "mark_not_requested"

        # Ensure they are all strings
        assert isinstance(SERVICE_MARK_COMPLETE, str)
        assert isinstance(SERVICE_MARK_PENDING, str)
        assert isinstance(SERVICE_MARK_NOT_REQUESTED, str)

    def test_service_attribute_constants(self):
        """Test service parameter constants."""
        assert ATTR_USER == "user"
        assert ATTR_CHORE_SLUG == "chore_slug"

        # Ensure they are strings
        assert isinstance(ATTR_USER, str)
        assert isinstance(ATTR_CHORE_SLUG, str)

    def test_logger_exists(self):
        """Test that LOGGER is properly configured."""
        from logging import Logger

        assert isinstance(LOGGER, Logger)
        assert LOGGER.name == "custom_components.simple_chores"

    def test_states_are_unique(self):
        """Test that state constants are unique."""
        states = {STATE_PENDING, STATE_COMPLETE, STATE_NOT_REQUESTED}
        assert len(states) == 3

    def test_services_are_unique(self):
        """Test that service constants are unique."""
        services = {
            SERVICE_MARK_COMPLETE,
            SERVICE_MARK_PENDING,
            SERVICE_MARK_NOT_REQUESTED,
        }
        assert len(services) == 3

    def test_attributes_are_unique(self):
        """Test that attribute constants are unique."""
        attrs = {ATTR_USER, ATTR_CHORE_SLUG}
        assert len(attrs) == 2

"""Tests for simple_chores services."""

from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.simple_chores.const import (
    ATTR_ADJUSTMENT,
    ATTR_CATEGORY_SLUG,
    ATTR_CHORE_SLUG,
    ATTR_PRIVILEGE_SLUG,
    ATTR_RESET_TOTAL,
    ATTR_USER,
    DOMAIN,
    SERVICE_ADJUST_POINTS,
    SERVICE_CLEAR_TEMPORARY_DISABLE,
    SERVICE_CREATE_CHORE,
    SERVICE_DELETE_CHORE,
    SERVICE_FINALIZE_BY_CATEGORY,
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
    SERVICE_UPDATE_CHORE,
)
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    PrivilegeBehavior,
    PrivilegeConfig,
    PrivilegeState,
    SimpleChoresConfig,
)
from custom_components.simple_chores.sensor import (
    ChoreSensor,
    ChoreSummarySensor,
    PrivilegeSensor,
)
from custom_components.simple_chores.services import async_setup_services


def make_summary_update_mock(summary_sensor):
    """Create a mock async_update_ha_state that calls async_update."""

    async def update_side_effect(*args, **kwargs):
        await summary_sensor.async_update()

    return AsyncMock(side_effect=update_side_effect)


@pytest.fixture(autouse=True)
async def setup_hass_data(hass):
    """Set up hass.data for all tests in this file."""
    # Ensure DOMAIN data exists
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    return hass


@pytest.fixture
def mock_sensor(hass) -> ChoreSensor:
    """Create a mock chore sensor."""
    chore = ChoreConfig(
        name="Dishes",
        slug="dishes",
        frequency=ChoreFrequency.DAILY,
        assignees=["alice"],
    )
    with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
        sensor = ChoreSensor(hass, chore, "alice")
        sensor.async_update_ha_state = AsyncMock()
    return sensor


class TestServiceSetup:
    """Tests for service setup."""

    @pytest.mark.asyncio
    async def test_setup_services_registers_all_services(self, hass) -> None:
        """Test that all services are registered."""
        await async_setup_services(hass)

        # Check that each service was registered using has_service
        assert hass.services.has_service(DOMAIN, SERVICE_MARK_COMPLETE)
        assert hass.services.has_service(DOMAIN, SERVICE_MARK_PENDING)
        assert hass.services.has_service(DOMAIN, SERVICE_MARK_NOT_REQUESTED)
        assert hass.services.has_service(DOMAIN, SERVICE_RESET_COMPLETED)
        assert hass.services.has_service(DOMAIN, SERVICE_START_NEW_DAY)
        assert hass.services.has_service(DOMAIN, SERVICE_CREATE_CHORE)
        assert hass.services.has_service(DOMAIN, SERVICE_UPDATE_CHORE)
        assert hass.services.has_service(DOMAIN, SERVICE_DELETE_CHORE)
        assert hass.services.has_service(DOMAIN, SERVICE_REFRESH_SUMMARY)
        assert hass.services.has_service(DOMAIN, SERVICE_ADJUST_POINTS)
        assert hass.services.has_service(DOMAIN, SERVICE_RESET_POINTS)

    @pytest.mark.asyncio
    async def test_setup_services_uses_correct_domain(self, hass) -> None:
        """Test that services are registered with correct domain."""
        await async_setup_services(hass)

        # Verify all services are in the correct domain
        services = hass.services.async_services_for_domain(DOMAIN)
        # 11 chore services + 7 category services + 8 privilege services
        assert len(services) == 26


class TestMarkCompleteService:
    """Tests for mark_complete service."""

    @pytest.mark.asyncio
    async def test_mark_complete_updates_sensor_state(
        self, hass, mock_sensor: ChoreSensor
    ) -> None:
        """Test that mark_complete service updates sensor state."""
        # Setup
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(hass)

        # Reset mock to ignore initialization calls
        mock_sensor.async_update_ha_state.reset_mock()

        # Execute service
        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE,
            {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"},
            blocking=True,
        )

        # Verify state was set and sensor was updated
        assert mock_sensor.get_state() == ChoreState.COMPLETE.value
        mock_sensor.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_mark_complete_logs_info(
        self,
        hass,
        mock_sensor: ChoreSensor,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """Test that mark_complete logs at INFO level."""
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(hass)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        with caplog.at_level("INFO"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_COMPLETE,
                service_data,
                blocking=True,
            )

        # Check that INFO logs contain service call details
        assert "Service 'mark_complete' called" in caplog.text
        assert "user='alice'" in caplog.text
        assert "chore_slug='dishes'" in caplog.text
        assert "Marked chore 'dishes' as complete for user 'alice'" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_complete_sensor_not_found(
        self, hass, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_complete when sensor doesn't exist."""
        from homeassistant.exceptions import ServiceValidationError

        hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(hass)

        service_data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        with pytest.raises(ServiceValidationError, match="No sensor found"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_COMPLETE,
                service_data,
                blocking=True,
            )

        # Should also log error
        assert "No sensor found" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_complete_integration_not_loaded(
        self, hass, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_complete when integration not loaded."""
        from homeassistant.exceptions import HomeAssistantError

        # Remove DOMAIN from hass.data to simulate integration not loaded
        if DOMAIN in hass.data:
            del hass.data[DOMAIN]

        await async_setup_services(hass)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        with pytest.raises(HomeAssistantError, match="integration not loaded"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_COMPLETE,
                service_data,
                blocking=True,
            )

        assert "integration not loaded" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_complete_actually_changes_state(self, hass) -> None:
        """Test that mark_complete actually changes the sensor state value."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_write_ha_state = Mock()

        # Initially NOT_REQUESTED
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value

        hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}, "states": {}}
        await async_setup_services(hass)

        # Call mark_complete
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE,
            service_data,
            blocking=True,
        )

        # Verify state changed to COMPLETE
        assert sensor.native_value == ChoreState.COMPLETE.value, (
            f"Expected state to be '{ChoreState.COMPLETE.value}' "
            f"but got '{sensor.native_value}'"
        )


class TestMarkPendingService:
    """Tests for mark_pending service."""

    @pytest.mark.asyncio
    async def test_mark_pending_updates_sensor_state(
        self, hass, mock_sensor: ChoreSensor
    ) -> None:
        """Test that mark_pending service updates sensor state."""
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(hass)

        # Get the handler for mark_pending (second service)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mock to ignore initialization calls
        mock_sensor.async_update_ha_state.reset_mock()

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_PENDING,
            service_data,
            blocking=True,
        )

        # Verify state was set and sensor was updated
        assert mock_sensor.get_state() == ChoreState.PENDING.value
        mock_sensor.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_mark_pending_logs_info(
        self,
        hass,
        mock_sensor: ChoreSensor,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """Test that mark_pending logs at INFO level."""
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(hass)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        with caplog.at_level("INFO"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_PENDING,
                service_data,
                blocking=True,
            )

        # Check that INFO logs contain service call details
        assert "Service 'mark_pending' called" in caplog.text
        assert "user='alice'" in caplog.text
        assert "chore_slug='dishes'" in caplog.text
        assert "Marked chore 'dishes' as pending for user 'alice'" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_pending_sensor_not_found(
        self, hass, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_pending when sensor doesn't exist."""
        from homeassistant.exceptions import ServiceValidationError

        hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(hass)

        service_data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        with pytest.raises(ServiceValidationError, match="No sensor found"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_PENDING,
                service_data,
                blocking=True,
            )

        assert "No sensor found" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_pending_actually_changes_state(self, hass) -> None:
        """Test that mark_pending actually changes the sensor state value."""
        # Create a real sensor (not mocked)
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        # Mock async_write_ha_state to avoid threading issues in tests
        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            # Also mock it on the instance for calls during set_state
            sensor.async_write_ha_state = Mock()

        # Initially the sensor should be in NOT_REQUESTED state
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value

        # Setup the service
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}, "states": {}}
        await async_setup_services(hass)

        # Call mark_pending service
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_PENDING,
            service_data,
            blocking=True,
        )

        # Verify the state actually changed to PENDING
        assert sensor.native_value == ChoreState.PENDING.value, (
            f"Expected state to be '{ChoreState.PENDING.value}' "
            f"but got '{sensor.native_value}'"
        )


class TestMarkNotRequestedService:
    """Tests for mark_not_requested service."""

    @pytest.mark.asyncio
    async def test_mark_not_requested_updates_sensor_state(
        self, hass, mock_sensor: ChoreSensor
    ) -> None:
        """Test that mark_not_requested service updates sensor state."""
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(hass)

        # Get the handler for mark_not_requested (third service)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mock to ignore initialization calls
        mock_sensor.async_update_ha_state.reset_mock()

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_NOT_REQUESTED,
            service_data,
            blocking=True,
        )

        # Verify state was set and sensor was updated
        assert mock_sensor.get_state() == ChoreState.NOT_REQUESTED.value
        mock_sensor.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_mark_not_requested_logs_info(
        self,
        hass,
        mock_sensor: ChoreSensor,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """Test that mark_not_requested logs at INFO level."""
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(hass)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        with caplog.at_level("INFO"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_NOT_REQUESTED,
                service_data,
                blocking=True,
            )

        # Check that INFO logs contain service call details
        assert "Service 'mark_not_requested' called" in caplog.text
        assert "user='alice'" in caplog.text
        assert "chore_slug='dishes'" in caplog.text
        assert "Marked chore 'dishes' as not requested for user 'alice'" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_not_requested_sensor_not_found(
        self, hass, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_not_requested when sensor doesn't exist."""
        from homeassistant.exceptions import ServiceValidationError

        hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(hass)

        service_data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        with pytest.raises(ServiceValidationError, match="No sensor found"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_NOT_REQUESTED,
                service_data,
                blocking=True,
            )

        assert "No sensor found" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_not_requested_actually_changes_state(self, hass) -> None:
        """Test that mark_not_requested actually changes the sensor state value."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_write_ha_state = Mock()
            # Set initial state to COMPLETE
            sensor.set_state(ChoreState.COMPLETE.value)

        assert sensor.native_value == ChoreState.COMPLETE.value

        hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}, "states": {}}
        await async_setup_services(hass)

        # Call mark_not_requested
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_NOT_REQUESTED,
            service_data,
            blocking=True,
        )

        # Verify state changed to NOT_REQUESTED
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value, (
            f"Expected state to be '{ChoreState.NOT_REQUESTED.value}' "
            f"but got '{sensor.native_value}'"
        )


class TestServiceStateTransitions:
    """Test state transitions through service calls."""

    @pytest.mark.asyncio
    async def test_complete_state_transition_sequence(self, hass) -> None:
        """Test a complete sequence of state transitions."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_write_ha_state = Mock()

        hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}, "states": {}}
        await async_setup_services(hass)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Initial state: NOT_REQUESTED
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value

        # NOT_REQUESTED -> PENDING
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_PENDING, service_data, blocking=True
        )
        assert sensor.native_value == ChoreState.PENDING.value, (
            "Failed to transition from NOT_REQUESTED to PENDING"
        )

        # PENDING -> COMPLETE
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )
        assert sensor.native_value == ChoreState.COMPLETE.value, (
            "Failed to transition from PENDING to COMPLETE"
        )

        # COMPLETE -> NOT_REQUESTED
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_NOT_REQUESTED, service_data, blocking=True
        )
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value, (
            "Failed to transition from COMPLETE to NOT_REQUESTED"
        )

        # NOT_REQUESTED -> COMPLETE (direct transition)
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )
        assert sensor.native_value == ChoreState.COMPLETE.value, (
            "Failed to transition directly from NOT_REQUESTED to COMPLETE"
        )

        # COMPLETE -> PENDING (backwards transition)
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_PENDING, service_data, blocking=True
        )
        assert sensor.native_value == ChoreState.PENDING.value, (
            "Failed to transition from COMPLETE back to PENDING"
        )


class TestServiceIntegration:
    """Integration tests for services."""

    @pytest.mark.asyncio
    async def test_services_work_after_sensor_platform_setup(self, hass) -> None:
        """Test that services work after sensor platform is set up."""
        # Create sensors manually (simulating what sensor platform does)
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()

        # Simulate sensor platform setup storing sensors
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}}

        # Setup services
        await async_setup_services(hass)

        # Verify we can call the service
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mock to ignore initialization calls
        sensor.async_update_ha_state.reset_mock()

        # Call the mark_complete service
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        # Verify sensor state was updated
        assert sensor.get_state() == ChoreState.COMPLETE.value
        sensor.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_multiple_sensors_different_users(self, hass) -> None:
        """Test services with multiple sensors for different users."""
        # Create multiple sensors
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore, "alice")
            sensor_bob = ChoreSensor(hass, chore, "bob")
            sensor_alice.async_update_ha_state = AsyncMock()
            sensor_bob.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor_alice, "bob_dishes": sensor_bob}
        }

        await async_setup_services(hass)

        # Call service for alice
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Call service for alice
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        # Only alice's sensor should be updated
        assert sensor_alice.get_state() == ChoreState.COMPLETE.value
        sensor_alice.async_update_ha_state.assert_called()
        # Bob's sensor should not have been updated
        sensor_bob.async_update_ha_state.assert_not_called()

        # Reset and call for bob
        sensor_alice.async_update_ha_state.reset_mock()
        sensor_bob.async_update_ha_state.reset_mock()
        service_data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "dishes"}
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        # Only bob's sensor should be updated
        sensor_alice.async_update_ha_state.assert_not_called()
        assert sensor_bob.get_state() == ChoreState.COMPLETE.value
        sensor_bob.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_service_with_special_characters_in_slug(self, hass) -> None:
        """Test service with special characters in slug."""
        chore = ChoreConfig(
            name="Test Chore",
            slug="test-chore_123",  # Gets sanitized to test_chore_123
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()

        # Key should be sanitized: hyphens converted to underscores
        hass.data[DOMAIN] = {"sensors": {"alice_test_chore_123": sensor}}

        await async_setup_services(hass)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "test-chore_123"}

        # Reset mock to ignore initialization calls
        sensor.async_update_ha_state.reset_mock()

        # Call the service
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        # Verify sensor state was updated
        assert sensor.get_state() == ChoreState.COMPLETE.value
        sensor.async_update_ha_state.assert_called()


class TestMarkAllAssignees:
    """Tests for mark_* services without user parameter (all assignees)."""

    @pytest.mark.asyncio
    async def test_mark_complete_all_assignees(self, hass) -> None:
        """Test mark_complete without user marks all assignees as complete."""
        # Create a chore with multiple assignees
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob", "charlie"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore, "alice")
            sensor_alice.async_write_ha_state = Mock()
            sensor_bob = ChoreSensor(hass, chore, "bob")
            sensor_bob.async_write_ha_state = Mock()
            sensor_charlie = ChoreSensor(hass, chore, "charlie")
            sensor_charlie.async_write_ha_state = Mock()

        # All start as NOT_REQUESTED
        assert sensor_alice.native_value == ChoreState.NOT_REQUESTED.value
        assert sensor_bob.native_value == ChoreState.NOT_REQUESTED.value
        assert sensor_charlie.native_value == ChoreState.NOT_REQUESTED.value

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice,
                "bob_dishes": sensor_bob,
                "charlie_dishes": sensor_charlie,
            },
            "states": {},
        }
        await async_setup_services(hass)

        # Call mark_complete without user
        service_data = {ATTR_CHORE_SLUG: "dishes"}  # No user specified

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE,
            service_data,
            blocking=True,
        )

        # All assignees should be marked complete
        assert sensor_alice.native_value == ChoreState.COMPLETE.value
        assert sensor_bob.native_value == ChoreState.COMPLETE.value
        assert sensor_charlie.native_value == ChoreState.COMPLETE.value

    @pytest.mark.asyncio
    async def test_mark_pending_all_assignees(self, hass) -> None:
        """Test mark_pending without user marks all assignees as pending."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore, "alice")
            sensor_alice.async_write_ha_state = Mock()
            sensor_bob = ChoreSensor(hass, chore, "bob")
            sensor_bob.async_write_ha_state = Mock()

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice,
                "bob_dishes": sensor_bob,
            },
            "states": {},
        }
        await async_setup_services(hass)

        # Call mark_pending without user
        service_data = {ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_PENDING,
            service_data,
            blocking=True,
        )

        # All assignees should be marked pending
        assert sensor_alice.native_value == ChoreState.PENDING.value
        assert sensor_bob.native_value == ChoreState.PENDING.value

    @pytest.mark.asyncio
    async def test_mark_not_requested_all_assignees(self, hass) -> None:
        """Test mark_not_requested without user marks all assignees as not requested."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore, "alice")
            sensor_alice.async_write_ha_state = Mock()
            sensor_alice.set_state(ChoreState.COMPLETE.value)
            sensor_bob = ChoreSensor(hass, chore, "bob")
            sensor_bob.async_write_ha_state = Mock()
            sensor_bob.set_state(ChoreState.PENDING.value)

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice,
                "bob_dishes": sensor_bob,
            },
            "states": {},
        }
        await async_setup_services(hass)

        # Call mark_not_requested without user
        service_data = {ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_NOT_REQUESTED,
            service_data,
            blocking=True,
        )

        # All assignees should be marked not requested
        assert sensor_alice.native_value == ChoreState.NOT_REQUESTED.value
        assert sensor_bob.native_value == ChoreState.NOT_REQUESTED.value

    @pytest.mark.asyncio
    async def test_mark_complete_all_assignees_with_multiple_chores(self, hass) -> None:
        """Test mark_complete all assignees only affects the specified chore."""
        chore_dishes = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )
        chore_vacuum = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice_dishes = ChoreSensor(hass, chore_dishes, "alice")
            sensor_alice_dishes.async_write_ha_state = Mock()
            sensor_bob_dishes = ChoreSensor(hass, chore_dishes, "bob")
            sensor_bob_dishes.async_write_ha_state = Mock()
            sensor_alice_vacuum = ChoreSensor(hass, chore_vacuum, "alice")
            sensor_alice_vacuum.async_write_ha_state = Mock()
            sensor_bob_vacuum = ChoreSensor(hass, chore_vacuum, "bob")
            sensor_bob_vacuum.async_write_ha_state = Mock()

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice_dishes,
                "bob_dishes": sensor_bob_dishes,
                "alice_vacuum": sensor_alice_vacuum,
                "bob_vacuum": sensor_bob_vacuum,
            },
            "states": {},
        }
        await async_setup_services(hass)

        # Mark dishes complete for all assignees
        service_data = {ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE,
            service_data,
            blocking=True,
        )

        # Only dishes sensors should be complete
        assert sensor_alice_dishes.native_value == ChoreState.COMPLETE.value
        assert sensor_bob_dishes.native_value == ChoreState.COMPLETE.value
        # Vacuum sensors should remain NOT_REQUESTED
        assert sensor_alice_vacuum.native_value == ChoreState.NOT_REQUESTED.value
        assert sensor_bob_vacuum.native_value == ChoreState.NOT_REQUESTED.value

    @pytest.mark.asyncio
    async def test_mark_complete_no_assignees_raises_error(
        self, hass, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_complete without user raises error when chore has no assignees."""
        hass.data[DOMAIN] = {"sensors": {}, "states": {}}
        await async_setup_services(hass)

        service_data = {ATTR_CHORE_SLUG: "nonexistent"}

        with (
            caplog.at_level("ERROR"),
            pytest.raises(ServiceValidationError, match="No sensors found"),
        ):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_COMPLETE,
                service_data,
                blocking=True,
            )

        assert "No sensors found for chore 'nonexistent'" in caplog.text


class TestMarkByCategoryServices:
    """Tests for the mark_*_by_category (request/complete/clear) services."""

    def _make_sensor(self, hass, *, slug, category, assignee, state=None):
        """Create a ChoreSensor for the given category/assignee, defaulting state."""
        chore = ChoreConfig(
            name=slug.title(),
            slug=slug,
            frequency=ChoreFrequency.DAILY,
            assignees=[assignee],
            points=10,
            category=category,
        )
        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, assignee)
            sensor.async_update_ha_state = AsyncMock()
        if state is not None:
            sensor.set_state(state.value)
        return sensor

    @pytest.mark.asyncio
    async def test_mark_complete_by_category_all_assignees(self, hass) -> None:
        """Test that mark_complete_by_category completes every chore in the category."""
        sensor_alice = self._make_sensor(
            hass, slug="dishes", category="kitchen", assignee="alice"
        )
        sensor_bob = self._make_sensor(
            hass, slug="counters", category="kitchen", assignee="bob"
        )
        # Different category - must not be touched
        sensor_other = self._make_sensor(
            hass, slug="vacuum", category="living_room", assignee="alice"
        )
        # Uncategorized - must not be touched
        sensor_uncategorized = self._make_sensor(
            hass, slug="trash", category=None, assignee="alice"
        )

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice,
                "bob_counters": sensor_bob,
                "alice_vacuum": sensor_other,
                "alice_trash": sensor_uncategorized,
            }
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen"},
            blocking=True,
        )

        assert sensor_alice.get_state() == ChoreState.COMPLETE.value
        assert sensor_bob.get_state() == ChoreState.COMPLETE.value
        assert sensor_other.get_state() == ChoreState.NOT_REQUESTED.value
        assert sensor_uncategorized.get_state() == ChoreState.NOT_REQUESTED.value

    @pytest.mark.asyncio
    async def test_mark_complete_by_category_scoped_to_user(self, hass) -> None:
        """Test that mark_complete_by_category respects an optional user filter."""
        sensor_alice = self._make_sensor(
            hass, slug="dishes", category="kitchen", assignee="alice"
        )
        sensor_bob = self._make_sensor(
            hass, slug="dishes", category="kitchen", assignee="bob"
        )

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice,
                "bob_dishes": sensor_bob,
            }
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen", ATTR_USER: "alice"},
            blocking=True,
        )

        assert sensor_alice.get_state() == ChoreState.COMPLETE.value
        assert sensor_bob.get_state() == ChoreState.NOT_REQUESTED.value

    @pytest.mark.asyncio
    async def test_mark_complete_by_category_awards_points_once(self, hass) -> None:
        """Test completing a category only awards points for newly-complete chores."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        sensor_pending = self._make_sensor(
            hass, slug="dishes", category="kitchen", assignee="alice"
        )
        sensor_already_complete = self._make_sensor(
            hass,
            slug="counters",
            category="kitchen",
            assignee="alice",
            state=ChoreState.COMPLETE,
        )

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_pending,
                "alice_counters": sensor_already_complete,
            },
            "points_storage": points_storage,
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen"},
            blocking=True,
        )

        # Only the newly-completed "dishes" chore's 10 points should be awarded -
        # "counters" was already complete, so it must not be double-counted.
        assert points_storage.get_points("alice") == 10
        assert points_storage.get_points_earned("alice") == 10

    @pytest.mark.asyncio
    async def test_mark_complete_by_category_no_matching_sensors_raises(
        self, hass, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that an unknown/empty category raises a ServiceValidationError."""
        hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(hass)

        with pytest.raises(ServiceValidationError, match="No chore sensors found"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_COMPLETE_BY_CATEGORY,
                {ATTR_CATEGORY_SLUG: "nonexistent"},
                blocking=True,
            )

        assert "No chore sensors found for category 'nonexistent'" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_pending_by_category_deducts_points_when_complete(
        self, hass
    ) -> None:
        """Test requesting a category deducts points for a previously-complete chore."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        await points_storage.add_points("alice", 10)
        await points_storage.add_points_earned("alice", 10)

        sensor = self._make_sensor(
            hass,
            slug="dishes",
            category="kitchen",
            assignee="alice",
            state=ChoreState.COMPLETE,
        )

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor},
            "points_storage": points_storage,
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_PENDING_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen"},
            blocking=True,
        )

        assert sensor.get_state() == ChoreState.PENDING.value
        assert points_storage.get_points("alice") == 0
        assert points_storage.get_points_earned("alice") == 0

    @pytest.mark.asyncio
    async def test_mark_not_requested_by_category_clears_without_touching_points(
        self, hass
    ) -> None:
        """Test that clearing a category never awards or deducts points."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        await points_storage.add_points("alice", 10)
        await points_storage.add_points_earned("alice", 10)

        sensor = self._make_sensor(
            hass,
            slug="dishes",
            category="kitchen",
            assignee="alice",
            state=ChoreState.COMPLETE,
        )

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor},
            "points_storage": points_storage,
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_NOT_REQUESTED_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen"},
            blocking=True,
        )

        assert sensor.get_state() == ChoreState.NOT_REQUESTED.value
        # Clearing (not_requested) never touches points, matching mark_not_requested.
        assert points_storage.get_points("alice") == 10
        assert points_storage.get_points_earned("alice") == 10

    @pytest.mark.asyncio
    async def test_mark_pending_by_category_no_matching_sensors_raises_for_user(
        self, hass
    ) -> None:
        """Test the user-scoped error message when nothing matches."""
        sensor = self._make_sensor(
            hass, slug="dishes", category="kitchen", assignee="bob"
        )
        hass.data[DOMAIN] = {"sensors": {"bob_dishes": sensor}}
        await async_setup_services(hass)

        with pytest.raises(
            ServiceValidationError,
            match="No chore sensor found for user 'alice' and category 'kitchen'",
        ):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_PENDING_BY_CATEGORY,
                {ATTR_CATEGORY_SLUG: "kitchen", ATTR_USER: "alice"},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_mark_complete_by_category_integration_not_loaded(self, hass) -> None:
        """Test mark_complete_by_category when the integration isn't loaded."""
        from homeassistant.exceptions import HomeAssistantError

        if DOMAIN in hass.data:
            del hass.data[DOMAIN]

        await async_setup_services(hass)

        with pytest.raises(HomeAssistantError, match="integration not loaded"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_COMPLETE_BY_CATEGORY,
                {ATTR_CATEGORY_SLUG: "kitchen"},
                blocking=True,
            )


class TestFinalizeByCategoryService:
    """Tests for the finalize_by_category service."""

    def _make_sensor(
        self, hass, *, slug, category, assignee, frequency, state=None
    ) -> ChoreSensor:
        """Create a ChoreSensor for the given category/frequency/assignee."""
        chore = ChoreConfig(
            name=slug.title(),
            slug=slug,
            frequency=frequency,
            assignees=[assignee],
            points=10,
            category=category,
        )
        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, assignee)
            sensor.async_update_ha_state = AsyncMock()
        if state is not None:
            sensor.set_state(state.value)
        return sensor

    @pytest.mark.asyncio
    async def test_finalize_resets_completed_manual_chores_only(self, hass) -> None:
        """Test that only completed manual chores in the category are reset."""
        sensor_manual = self._make_sensor(
            hass,
            slug="dishes",
            category="kitchen",
            assignee="alice",
            frequency=ChoreFrequency.MANUAL,
            state=ChoreState.COMPLETE,
        )
        # Daily chore in the same category - must be left untouched
        sensor_daily = self._make_sensor(
            hass,
            slug="counters",
            category="kitchen",
            assignee="alice",
            frequency=ChoreFrequency.DAILY,
            state=ChoreState.COMPLETE,
        )
        # Manual chore in a different category - must be left untouched
        sensor_other_category = self._make_sensor(
            hass,
            slug="vacuum",
            category="living_room",
            assignee="alice",
            frequency=ChoreFrequency.MANUAL,
            state=ChoreState.COMPLETE,
        )

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_manual,
                "alice_counters": sensor_daily,
                "alice_vacuum": sensor_other_category,
            }
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_FINALIZE_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen"},
            blocking=True,
        )

        assert sensor_manual.get_state() == ChoreState.NOT_REQUESTED.value
        assert sensor_daily.get_state() == ChoreState.COMPLETE.value
        assert sensor_other_category.get_state() == ChoreState.COMPLETE.value

    @pytest.mark.asyncio
    async def test_finalize_scoped_to_user(self, hass) -> None:
        """Test that finalize_by_category respects an optional user filter."""
        sensor_alice = self._make_sensor(
            hass,
            slug="dishes",
            category="kitchen",
            assignee="alice",
            frequency=ChoreFrequency.MANUAL,
            state=ChoreState.COMPLETE,
        )
        sensor_bob = self._make_sensor(
            hass,
            slug="dishes",
            category="kitchen",
            assignee="bob",
            frequency=ChoreFrequency.MANUAL,
            state=ChoreState.COMPLETE,
        )

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice,
                "bob_dishes": sensor_bob,
            }
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_FINALIZE_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen", ATTR_USER: "alice"},
            blocking=True,
        )

        assert sensor_alice.get_state() == ChoreState.NOT_REQUESTED.value
        assert sensor_bob.get_state() == ChoreState.COMPLETE.value

    @pytest.mark.asyncio
    async def test_finalize_counts_pending_manual_chores_as_missed(
        self, hass
    ) -> None:
        """Test pending manual chores in the category add to points_missed."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        sensor_pending = self._make_sensor(
            hass,
            slug="dishes",
            category="kitchen",
            assignee="alice",
            frequency=ChoreFrequency.MANUAL,
            state=ChoreState.PENDING,
        )

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor_pending},
            "points_storage": points_storage,
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_FINALIZE_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen"},
            blocking=True,
        )

        # Pending chores are left alone (not reset) but still counted missed
        assert sensor_pending.get_state() == ChoreState.PENDING.value
        assert points_storage.get_points_missed("alice") == 10

    @pytest.mark.asyncio
    async def test_finalize_ignores_not_requested_chores(self, hass) -> None:
        """Test that not_requested manual chores are left alone and uncounted."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        sensor = self._make_sensor(
            hass,
            slug="dishes",
            category="kitchen",
            assignee="alice",
            frequency=ChoreFrequency.MANUAL,
            state=ChoreState.NOT_REQUESTED,
        )

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor},
            "points_storage": points_storage,
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_FINALIZE_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen"},
            blocking=True,
        )

        assert sensor.get_state() == ChoreState.NOT_REQUESTED.value
        sensor.async_update_ha_state.assert_not_called()
        assert points_storage.get_points_missed("alice") == 0

    @pytest.mark.asyncio
    async def test_finalize_no_matching_manual_sensors_raises(self, hass) -> None:
        """Test that a category with no manual chores raises a validation error."""
        sensor_daily = self._make_sensor(
            hass,
            slug="counters",
            category="kitchen",
            assignee="alice",
            frequency=ChoreFrequency.DAILY,
            state=ChoreState.COMPLETE,
        )
        hass.data[DOMAIN] = {"sensors": {"alice_counters": sensor_daily}}
        await async_setup_services(hass)

        with pytest.raises(
            ServiceValidationError, match="No manual chore sensors found"
        ):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_FINALIZE_BY_CATEGORY,
                {ATTR_CATEGORY_SLUG: "kitchen"},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_finalize_no_matching_sensors_raises_for_user(self, hass) -> None:
        """Test the user-scoped error message when nothing matches."""
        sensor = self._make_sensor(
            hass,
            slug="dishes",
            category="kitchen",
            assignee="bob",
            frequency=ChoreFrequency.MANUAL,
            state=ChoreState.COMPLETE,
        )
        hass.data[DOMAIN] = {"sensors": {"bob_dishes": sensor}}
        await async_setup_services(hass)

        with pytest.raises(
            ServiceValidationError,
            match=(
                "No manual chore sensor found for user 'alice' and "
                "category 'kitchen'"
            ),
        ):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_FINALIZE_BY_CATEGORY,
                {ATTR_CATEGORY_SLUG: "kitchen", ATTR_USER: "alice"},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_finalize_integration_not_loaded(self, hass) -> None:
        """Test finalize_by_category when the integration isn't loaded."""
        from homeassistant.exceptions import HomeAssistantError

        if DOMAIN in hass.data:
            del hass.data[DOMAIN]

        await async_setup_services(hass)

        with pytest.raises(HomeAssistantError, match="integration not loaded"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_FINALIZE_BY_CATEGORY,
                {ATTR_CATEGORY_SLUG: "kitchen"},
                blocking=True,
            )


class TestResetCompletedService:
    """Tests for reset_completed service."""

    @pytest.mark.asyncio
    async def test_reset_completed_all_users(self, hass) -> None:
        """Test reset_completed resets all completed chores when no user specified."""
        # Create multiple sensors with different states
        chore1 = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        chore2 = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.DAILY,
            assignees=["bob"],
        )
        chore3 = ChoreConfig(
            name="Laundry",
            slug="laundry",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.COMPLETE.value)

            sensor2 = ChoreSensor(hass, chore2, "bob")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.COMPLETE.value)

            sensor3 = ChoreSensor(hass, chore3, "alice")
            sensor3.async_update_ha_state = AsyncMock()
            sensor3.set_state(ChoreState.PENDING.value)

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor1,
                "bob_vacuum": sensor2,
                "alice_laundry": sensor3,
            }
        }

        await async_setup_services(hass)

        # Get the reset_completed handler (should be 4th registered service)

        # Create service call without user (reset all)
        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_COMPLETED,
            service_data,
            blocking=True,
        )

        # Both COMPLETE sensors should be reset to NOT_REQUESTED
        assert sensor1.get_state() == ChoreState.NOT_REQUESTED.value
        assert sensor2.get_state() == ChoreState.NOT_REQUESTED.value
        # Pending sensor should remain pending
        assert sensor3.get_state() == ChoreState.PENDING.value

    @pytest.mark.asyncio
    async def test_reset_completed_specific_user(self, hass) -> None:
        """Test reset_completed only resets specified user's chores."""
        # Create sensors for different users
        chore1 = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        chore2 = ChoreConfig(
            name="Vacuum",
            slug="vacuum",
            frequency=ChoreFrequency.DAILY,
            assignees=["bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore1, "alice")
            sensor_alice.async_update_ha_state = AsyncMock()
            sensor_alice.set_state(ChoreState.COMPLETE.value)

            sensor_bob = ChoreSensor(hass, chore2, "bob")
            sensor_bob.async_update_ha_state = AsyncMock()
            sensor_bob.set_state(ChoreState.COMPLETE.value)

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice,
                "bob_vacuum": sensor_bob,
            }
        }

        await async_setup_services(hass)

        # Create service call for alice only
        service_data = {ATTR_USER: "alice"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_COMPLETED,
            service_data,
            blocking=True,
        )

        # Only alice's sensor should be reset
        assert sensor_alice.get_state() == ChoreState.NOT_REQUESTED.value
        # Bob's should remain complete
        assert sensor_bob.get_state() == ChoreState.COMPLETE.value

    @pytest.mark.asyncio
    async def test_reset_completed_no_completed_chores(self, hass) -> None:
        """Test reset_completed when no chores are completed."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()
            sensor.set_state(ChoreState.PENDING.value)

        hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}}

        await async_setup_services(hass)

        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_COMPLETED,
            service_data,
            blocking=True,
        )

        # Sensor should not be updated since it's not COMPLETE
        sensor.async_update_ha_state.assert_not_called()


"""Test code for reset_by_frequency service - will be added to test_services.py"""


class TestStartNewDayService:
    """Tests for start_new_day service."""

    @pytest.mark.asyncio
    async def test_start_new_day_manual_and_daily(self, hass) -> None:
        """Test that manual chores go to NOT_REQUESTED and daily to PENDING."""
        # Create sensors with different frequencies
        chore_manual = ChoreConfig(
            name="Manual Task",
            slug="manual_task",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
        )
        chore_daily = ChoreConfig(
            name="Daily Task",
            slug="daily_task",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_manual = ChoreSensor(hass, chore_manual, "alice")
            sensor_manual.async_update_ha_state = AsyncMock()
            sensor_manual.set_state(ChoreState.COMPLETE.value)

            sensor_daily = ChoreSensor(hass, chore_daily, "alice")
            sensor_daily.async_update_ha_state = AsyncMock()
            sensor_daily.set_state(ChoreState.COMPLETE.value)

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_manual_task": sensor_manual,
                "alice_daily_task": sensor_daily,
            }
        }

        await async_setup_services(hass)

        # Get the start_new_day handler (should be 5th registered service)

        # Create service call without user (reset all)
        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            service_data,
            blocking=True,
        )

        # Manual should be reset to NOT_REQUESTED
        assert sensor_manual.native_value == ChoreState.NOT_REQUESTED.value
        # Daily should be reset to PENDING
        assert sensor_daily.native_value == ChoreState.PENDING.value
        # Both sensors should have been updated
        sensor_manual.async_update_ha_state.assert_called()
        sensor_daily.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_start_new_day_specific_user(self, hass) -> None:
        """Test start_new_day only resets specified user's chores."""
        chore1 = ChoreConfig(
            name="Manual Task",
            slug="manual_task",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
        )
        chore2 = ChoreConfig(
            name="Daily Task",
            slug="daily_task",
            frequency=ChoreFrequency.DAILY,
            assignees=["bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore1, "alice")
            sensor_alice.async_update_ha_state = AsyncMock()
            sensor_alice.set_state(ChoreState.COMPLETE.value)

            sensor_bob = ChoreSensor(hass, chore2, "bob")
            sensor_bob.async_update_ha_state = AsyncMock()
            sensor_bob.set_state(ChoreState.COMPLETE.value)

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_manual_task": sensor_alice,
                "bob_daily_task": sensor_bob,
            }
        }

        await async_setup_services(hass)

        # Create service call for alice only
        service_data = {ATTR_USER: "alice"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            service_data,
            blocking=True,
        )

        # Only alice's sensor should be reset
        assert sensor_alice.native_value == ChoreState.NOT_REQUESTED.value
        sensor_alice.async_update_ha_state.assert_called()
        # Bob's should not be touched
        assert sensor_bob.native_value == ChoreState.COMPLETE.value
        sensor_bob.async_update_ha_state.assert_not_called()

    @pytest.mark.asyncio
    async def test_start_new_day_ignores_non_complete(self, hass) -> None:
        """Test start_new_day only affects completed chores."""
        chore = ChoreConfig(
            name="Manual Task",
            slug="manual_task",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()
            sensor.set_state(ChoreState.PENDING.value)

        hass.data[DOMAIN] = {"sensors": {"alice_manual_task": sensor}}

        await async_setup_services(hass)

        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            service_data,
            blocking=True,
        )

        # Sensor should not be updated since it's not COMPLETE
        sensor.async_update_ha_state.assert_not_called()

    @pytest.mark.asyncio
    async def test_start_new_day_mixed_states(self, hass) -> None:
        """Test start_new_day with mixed states and frequencies."""
        chore1 = ChoreConfig(
            name="Manual Complete",
            slug="manual_complete",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
        )
        chore2 = ChoreConfig(
            name="Manual Pending",
            slug="manual_pending",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
        )
        chore3 = ChoreConfig(
            name="Daily Complete",
            slug="daily_complete",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.COMPLETE.value)

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.PENDING.value)

            sensor3 = ChoreSensor(hass, chore3, "alice")
            sensor3.async_update_ha_state = AsyncMock()
            sensor3.set_state(ChoreState.COMPLETE.value)

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_manual_complete": sensor1,
                "alice_manual_pending": sensor2,
                "alice_daily_complete": sensor3,
            }
        }

        await async_setup_services(hass)

        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            service_data,
            blocking=True,
        )

        # Manual complete should be reset to NOT_REQUESTED
        assert sensor1.native_value == ChoreState.NOT_REQUESTED.value
        sensor1.async_update_ha_state.assert_called()
        # Manual pending should not be touched
        assert sensor2.native_value == ChoreState.PENDING.value
        sensor2.async_update_ha_state.assert_not_called()
        # Daily complete should be reset to PENDING
        assert sensor3.native_value == ChoreState.PENDING.value
        sensor3.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_start_new_day_updates_summary_attributes(self, hass) -> None:
        """Test that start_new_day properly updates summary sensor attributes."""
        from custom_components.simple_chores.sensor import (
            ChoreSensorManager,
            ChoreSummarySensor,
        )

        # Create chores with different frequencies
        chore_manual = ChoreConfig(
            name="Manual Task",
            slug="manual_task",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
        )
        chore_daily = ChoreConfig(
            name="Daily Task",
            slug="daily_task",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        # Create manager and sensors
        manager = MagicMock(spec=ChoreSensorManager)
        manager.sensors = {}
        manager.privilege_sensors = {}
        # Add points_storage mock
        mock_points_storage = MagicMock()
        mock_points_storage.get_points.return_value = 0
        manager.points_storage = mock_points_storage

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_manual = ChoreSensor(hass, chore_manual, "alice")
            sensor_manual.async_update_ha_state = AsyncMock()
            sensor_manual.set_state(ChoreState.COMPLETE.value)

            sensor_daily = ChoreSensor(hass, chore_daily, "alice")
            sensor_daily.async_update_ha_state = AsyncMock()
            sensor_daily.set_state(ChoreState.COMPLETE.value)

        manager.sensors = {
            "alice_manual_task": sensor_manual,
            "alice_daily_task": sensor_daily,
        }

        # Create summary sensor
        summary_sensor = ChoreSummarySensor(hass, "alice", manager)
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)
        await summary_sensor.async_update()

        hass.data[DOMAIN] = {
            "sensors": manager.sensors,
            "summary_sensors": {"alice": summary_sensor},
        }

        # Verify initial state - both complete
        attrs_before = summary_sensor.extra_state_attributes
        assert len(attrs_before["complete_chores"]) == 2
        assert len(attrs_before["pending_chores"]) == 0
        assert len(attrs_before["not_requested_chores"]) == 0

        # Call start_new_day
        await async_setup_services(hass)
        service_data = {}
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            service_data,
            blocking=True,
        )

        # Verify attributes updated - manual to NOT_REQUESTED, daily to PENDING
        attrs_after = summary_sensor.extra_state_attributes
        assert len(attrs_after["complete_chores"]) == 0
        assert len(attrs_after["pending_chores"]) == 1
        assert len(attrs_after["not_requested_chores"]) == 1
        assert "sensor.simple_chore_alice_daily_task" in attrs_after["pending_chores"]
        assert (
            "sensor.simple_chore_alice_manual_task"
            in attrs_after["not_requested_chores"]
        )

    @pytest.mark.asyncio
    async def test_start_new_day_calculates_points_missed(self, hass) -> None:
        """Test that start_new_day correctly calculates points_missed."""
        from custom_components.simple_chores.data import PointsStorage

        # Create chores with different point values
        chore1 = ChoreConfig(
            name="Chore 1",
            slug="chore1",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=10,
        )
        chore2 = ChoreConfig(
            name="Chore 2",
            slug="chore2",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=20,
        )
        chore3 = ChoreConfig(
            name="Chore 3",
            slug="chore3",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=5,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.PENDING.value)  # Missed 10 points

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.COMPLETE.value)  # Earned 20 points

            sensor3 = ChoreSensor(hass, chore3, "alice")
            sensor3.async_update_ha_state = AsyncMock()
            sensor3.set_state(ChoreState.PENDING.value)  # Missed 5 points

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_chore1": sensor1,
                "alice_chore2": sensor2,
                "alice_chore3": sensor3,
            },
            "summary_sensors": {},
            "points_storage": points_storage,
        }

        await async_setup_services(hass)

        # Simulate points awarded when chore2 was marked complete
        await points_storage.add_points("alice", 20)
        await points_storage.add_points_earned("alice", 20)

        # Call start_new_day
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            {},
            blocking=True,
        )

        # Verify points_missed = 10 + 5 = 15 (pending chores)
        assert points_storage.get_points_missed("alice") == 15
        # Verify total points unchanged (already awarded on complete)
        assert points_storage.get_points("alice") == 20

    @pytest.mark.asyncio
    async def test_start_new_day_calculates_points_possible(self, hass) -> None:
        """Test that start_new_day correctly calculates points_possible."""
        from custom_components.simple_chores.data import PointsStorage

        # Create chores with different point values
        chore1 = ChoreConfig(
            name="Chore 1",
            slug="chore1",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=10,
        )
        chore2 = ChoreConfig(
            name="Chore 2",
            slug="chore2",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=20,
        )
        chore3 = ChoreConfig(
            name="Chore 3",
            slug="chore3",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=5,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.PENDING.value)  # 10 possible

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.COMPLETE.value)  # 20 possible

            sensor3 = ChoreSensor(hass, chore3, "alice")
            sensor3.async_update_ha_state = AsyncMock()
            sensor3.set_state(ChoreState.PENDING.value)  # 5 possible

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_chore1": sensor1,
                "alice_chore2": sensor2,
                "alice_chore3": sensor3,
            },
            "summary_sensors": {},
            "points_storage": points_storage,
        }

        await async_setup_services(hass)

        # Call start_new_day
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            {},
            blocking=True,
        )

        # Verify cumulative points_missed = 10 + 5 = 15 (pending chores added)
        assert points_storage.get_points_missed("alice") == 15

    @pytest.mark.asyncio
    async def test_start_new_day_points_relationship(self, hass) -> None:
        """Test cumulative points_missed and dynamic points_possible."""
        from custom_components.simple_chores.data import PointsStorage
        from custom_components.simple_chores.sensor import (
            ChoreSensorManager,
            ChoreSummarySensor,
        )

        # Create chores
        chore1 = ChoreConfig(
            name="Chore 1",
            slug="chore1",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=15,
        )
        chore2 = ChoreConfig(
            name="Chore 2",
            slug="chore2",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=25,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        # Simulate alice completing chore2 earlier (points awarded on mark_complete)
        await points_storage.add_points("alice", 25)
        await points_storage.add_points_earned("alice", 25)

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.PENDING.value)  # Will add 15 to missed

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.COMPLETE.value)  # Earned 25

        manager = MagicMock(spec=ChoreSensorManager)
        manager.sensors = {
            "alice_chore1": sensor1,
            "alice_chore2": sensor2,
        }
        manager.privilege_sensors = {}
        manager.points_storage = points_storage

        hass.data[DOMAIN] = {
            "sensors": manager.sensors,
            "summary_sensors": {},
            "points_storage": points_storage,
        }

        await async_setup_services(hass)

        # Call start_new_day
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            {},
            blocking=True,
        )

        # Verify cumulative points_missed
        assert points_storage.get_points_missed("alice") == 15

        # Verify dynamic points_possible calculation after reset. After
        # start_new_day, chore2 (complete) is reset to pending, so the
        # expected total is earned (25) plus missed (15) plus pending
        # (both chores: 15 + 25), i.e. 40.
        summary_sensor = ChoreSummarySensor(hass, "alice", manager)
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)
        await summary_sensor.async_update()
        attrs = summary_sensor.extra_state_attributes
        assert attrs["points_possible"] == 80  # 25 earned + 15 missed + 40 pending

    @pytest.mark.asyncio
    async def test_start_new_day_ignores_not_requested_chores(self, hass) -> None:
        """Test that start_new_day ignores NOT_REQUESTED chores in calculations."""
        from custom_components.simple_chores.data import PointsStorage

        # Create chores
        chore1 = ChoreConfig(
            name="Chore 1",
            slug="chore1",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=10,
        )
        chore2 = ChoreConfig(
            name="Chore 2",
            slug="chore2",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
            points=20,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.PENDING.value)

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.NOT_REQUESTED.value)  # Should be ignored

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_chore1": sensor1,
                "alice_chore2": sensor2,
            },
            "summary_sensors": {},
            "points_storage": points_storage,
        }

        await async_setup_services(hass)

        # Call start_new_day
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            {},
            blocking=True,
        )

        # Verify only pending chore counted (cumulative missed)
        assert points_storage.get_points_missed("alice") == 10

    @pytest.mark.asyncio
    async def test_start_new_day_per_user_stats(self, hass) -> None:
        """Test that start_new_day calculates stats separately per user."""
        from custom_components.simple_chores.data import PointsStorage

        # Create chores for different users
        chore1 = ChoreConfig(
            name="Chore 1",
            slug="chore1",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
            points=10,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore1, "alice")
            sensor_alice.async_update_ha_state = AsyncMock()
            sensor_alice.set_state(ChoreState.PENDING.value)  # Missed

            sensor_bob = ChoreSensor(hass, chore1, "bob")
            sensor_bob.async_update_ha_state = AsyncMock()
            sensor_bob.set_state(ChoreState.COMPLETE.value)  # Earned

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_chore1": sensor_alice,
                "bob_chore1": sensor_bob,
            },
            "summary_sensors": {},
            "points_storage": points_storage,
        }

        await async_setup_services(hass)

        # Call start_new_day for all users
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            {},
            blocking=True,
        )

        # Verify separate cumulative missed stats
        assert points_storage.get_points_missed("alice") == 10
        assert points_storage.get_points_missed("bob") == 0

    @pytest.mark.asyncio
    async def test_start_new_day_updates_summary_sensor_point_attributes(
        self, hass
    ) -> None:
        """Test that start_new_day updates summary sensor point attributes correctly."""
        from custom_components.simple_chores.data import PointsStorage
        from custom_components.simple_chores.sensor import ChoreSensorManager

        # Create chores
        chore1 = ChoreConfig(
            name="Chore 1",
            slug="chore1",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=10,
        )
        chore2 = ChoreConfig(
            name="Chore 2",
            slug="chore2",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=5,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Create manager
        manager = MagicMock(spec=ChoreSensorManager)
        manager.points_storage = points_storage
        manager.privilege_sensors = {}

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            # One complete, one pending
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.COMPLETE.value)

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.PENDING.value)

        manager.sensors = {
            "alice_chore1": sensor1,
            "alice_chore2": sensor2,
        }

        # Create summary sensor
        summary_sensor = ChoreSummarySensor(hass, "alice", manager)
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)
        await summary_sensor.async_update()
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)

        hass.data[DOMAIN] = {
            "sensors": manager.sensors,
            "summary_sensors": {"alice": summary_sensor},
            "points_storage": points_storage,
        }

        await async_setup_services(hass)

        # Get initial attributes
        initial_attrs = summary_sensor.extra_state_attributes
        assert initial_attrs["total_points"] == 0
        assert initial_attrs["points_earned"] == 0
        assert initial_attrs["points_missed"] == 0
        # points_possible = earned + missed + pending = 0 + 0 + 5 (chore2 is pending)
        assert initial_attrs["points_possible"] == 5

        # Simulate points awarded when chore1 was marked complete
        # (In new behavior, points are awarded immediately on mark_complete)
        await points_storage.add_points("alice", 10)
        await points_storage.add_points_earned("alice", 10)

        # Update cache after modifying storage
        await summary_sensor.async_update()

        # Verify points were awarded
        mid_attrs = summary_sensor.extra_state_attributes
        assert mid_attrs["total_points"] == 10
        assert mid_attrs["points_earned"] == 10
        # points_possible is earned plus missed plus pending: 10 + 0 + 5
        # (chore2 still pending)
        assert mid_attrs["points_possible"] == 15

        # Call start_new_day (should update missed points, reset chore states)
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            {ATTR_USER: "alice"},
            blocking=True,
        )

        # Verify summary sensor was updated
        assert summary_sensor.async_update_ha_state.called

        # Get updated attributes
        updated_attrs = summary_sensor.extra_state_attributes
        assert updated_attrs["total_points"] == 10  # Unchanged (already awarded)
        assert updated_attrs["points_earned"] == 10  # Unchanged
        assert updated_attrs["points_missed"] == 5  # Missed from pending chore2
        # points_possible is earned plus missed plus pending: 10 + 5 + 15
        # (both chores now pending)
        assert updated_attrs["points_possible"] == 30

        # CRITICAL: Verify that complete_chores list is empty after reset
        # This is the bug reported by the user
        assert updated_attrs["complete_chores"] == []
        assert len(updated_attrs["pending_chores"]) == 2  # Both chores now pending

    @pytest.mark.asyncio
    async def test_start_new_day_clears_complete_chores_list(self, hass) -> None:
        """Test that start_new_day clears complete_chores in the summary sensor."""
        from custom_components.simple_chores.data import PointsStorage
        from custom_components.simple_chores.sensor import ChoreSensorManager

        # Create multiple chores with different states
        chore1 = ChoreConfig(
            name="Complete Chore 1",
            slug="complete1",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=10,
        )
        chore2 = ChoreConfig(
            name="Complete Chore 2",
            slug="complete2",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
            points=5,
        )
        chore3 = ChoreConfig(
            name="Pending Chore",
            slug="pending1",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=3,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        manager = MagicMock(spec=ChoreSensorManager)
        manager.points_storage = points_storage
        manager.privilege_sensors = {}

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            # Two complete chores
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.COMPLETE.value)

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.COMPLETE.value)

            # One pending chore
            sensor3 = ChoreSensor(hass, chore3, "alice")
            sensor3.async_update_ha_state = AsyncMock()
            sensor3.set_state(ChoreState.PENDING.value)

        manager.sensors = {
            "alice_complete1": sensor1,
            "alice_complete2": sensor2,
            "alice_pending1": sensor3,
        }

        summary_sensor = ChoreSummarySensor(hass, "alice", manager)
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)
        await summary_sensor.async_update()
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)

        hass.data[DOMAIN] = {
            "sensors": manager.sensors,
            "summary_sensors": {"alice": summary_sensor},
            "points_storage": points_storage,
        }

        await async_setup_services(hass)

        # Verify initial state has complete chores
        initial_attrs = summary_sensor.extra_state_attributes
        assert len(initial_attrs["complete_chores"]) == 2
        assert "sensor.simple_chore_alice_complete1" in initial_attrs["complete_chores"]
        assert "sensor.simple_chore_alice_complete2" in initial_attrs["complete_chores"]
        assert len(initial_attrs["pending_chores"]) == 1

        # Call start_new_day
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            {ATTR_USER: "alice"},
            blocking=True,
        )

        # Verify summary sensor was updated
        assert summary_sensor.async_update_ha_state.called

        # Get updated attributes - THIS IS THE CRITICAL CHECK
        updated_attrs = summary_sensor.extra_state_attributes

        # CRITICAL: complete_chores should be EMPTY
        assert updated_attrs["complete_chores"] == [], (
            f"Expected complete_chores to be empty after start_new_day, "
            f"but got: {updated_attrs['complete_chores']}"
        )

        # Daily chore should now be pending (was complete, now reset to pending)
        assert len(updated_attrs["pending_chores"]) == 2  # pending1 + complete1 (daily)

        # Manual chore should be not_requested (was complete, now reset)
        assert len(updated_attrs["not_requested_chores"]) == 1  # complete2 (manual)

        # Verify the actual sensor states were updated
        assert sensor1.get_state() == ChoreState.PENDING.value  # daily -> pending
        assert (
            sensor2.get_state() == ChoreState.NOT_REQUESTED.value
        )  # manual -> not_requested
        assert sensor3.get_state() == ChoreState.PENDING.value  # was already pending

    @pytest.mark.asyncio
    async def test_start_new_day_deletes_once_chores(self, hass) -> None:
        """Test that completed once chores are deleted on start_new_day."""
        from custom_components.simple_chores.config_loader import ConfigLoader

        # Create chores with different frequencies
        chore_once_complete = ChoreConfig(
            name="One-off Task",
            slug="one_off_task",
            frequency=ChoreFrequency.ONCE,
            assignees=["alice"],
        )
        chore_once_pending = ChoreConfig(
            name="Another One-off",
            slug="another_one_off",
            frequency=ChoreFrequency.ONCE,
            assignees=["alice"],
        )
        chore_daily = ChoreConfig(
            name="Daily Task",
            slug="daily_task",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_once_complete = ChoreSensor(hass, chore_once_complete, "alice")
            sensor_once_complete.async_update_ha_state = AsyncMock()
            sensor_once_complete.set_state(ChoreState.COMPLETE.value)

            sensor_once_pending = ChoreSensor(hass, chore_once_pending, "alice")
            sensor_once_pending.async_update_ha_state = AsyncMock()
            sensor_once_pending.set_state(ChoreState.PENDING.value)

            sensor_daily = ChoreSensor(hass, chore_daily, "alice")
            sensor_daily.async_update_ha_state = AsyncMock()
            sensor_daily.set_state(ChoreState.COMPLETE.value)

        # Mock config_loader
        mock_config_loader = MagicMock(spec=ConfigLoader)
        mock_config_loader.async_delete_chore = AsyncMock()

        hass.data[DOMAIN] = {
            "sensors": {
                "alice_one_off_task": sensor_once_complete,
                "alice_another_one_off": sensor_once_pending,
                "alice_daily_task": sensor_daily,
            },
            "config_loader": mock_config_loader,
        }

        await async_setup_services(hass)

        # Call start_new_day
        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            {},
            blocking=True,
        )

        # Completed once chore should be deleted
        mock_config_loader.async_delete_chore.assert_called_once_with("one_off_task")

        # Pending once chore should NOT be deleted
        assert mock_config_loader.async_delete_chore.call_count == 1

        # Daily chore should be reset to pending (not deleted)
        assert sensor_daily.get_state() == ChoreState.PENDING.value
        sensor_daily.async_update_ha_state.assert_called()


class TestSummarySensorUpdates:
    """Tests to verify all state-changing operations update summary sensors."""

    @pytest.mark.asyncio
    async def test_mark_complete_updates_summary_sensor(self, hass) -> None:
        """Test mark_complete updates the summary sensor."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        mock_summary = Mock()
        mock_summary.async_update_ha_state = AsyncMock()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor},
            "summary_sensors": {"alice": mock_summary},
            "states": {},
        }

        await async_setup_services(hass)

        # Get mark_complete handler
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE,
            service_data,
            blocking=True,
        )

        # Verify summary sensor was updated
        # Should be called once from _update_summary_sensors
        assert mock_summary.async_update_ha_state.call_count == 1

    @pytest.mark.asyncio
    async def test_mark_pending_updates_summary_sensor(self, hass) -> None:
        """Test mark_pending updates the summary sensor."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        mock_summary = Mock()
        mock_summary.async_update_ha_state = AsyncMock()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor},
            "summary_sensors": {"alice": mock_summary},
            "states": {},
        }

        await async_setup_services(hass)

        # Get mark_pending handler
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_PENDING,
            service_data,
            blocking=True,
        )

        # Verify summary sensor was updated
        # Should be called once from _update_summary_sensors
        assert mock_summary.async_update_ha_state.call_count == 1

    @pytest.mark.asyncio
    async def test_mark_not_requested_updates_summary_sensor(self, hass) -> None:
        """Test mark_not_requested updates the summary sensor."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        mock_summary = Mock()
        mock_summary.async_update_ha_state = AsyncMock()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor},
            "summary_sensors": {"alice": mock_summary},
            "states": {},
        }

        await async_setup_services(hass)

        # Get mark_not_requested handler
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_NOT_REQUESTED,
            service_data,
            blocking=True,
        )

        # Verify summary sensor was updated
        # Should be called once from _update_summary_sensors
        assert mock_summary.async_update_ha_state.call_count == 1

    @pytest.mark.asyncio
    async def test_reset_completed_updates_summary_sensor(self, hass) -> None:
        """Test reset_completed updates the summary sensor."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        mock_summary = Mock()
        mock_summary.async_update_ha_state = AsyncMock()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()
            sensor.set_state(ChoreState.COMPLETE.value)

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor},
            "summary_sensors": {"alice": mock_summary},
            "states": {},
        }

        await async_setup_services(hass)

        # Get reset_completed handler
        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_COMPLETED,
            service_data,
            blocking=True,
        )

        # Verify summary sensor was updated
        # Should be called once from _update_summary_sensors
        assert mock_summary.async_update_ha_state.call_count == 1

    @pytest.mark.asyncio
    async def test_start_new_day_updates_summary_sensor(self, hass) -> None:
        """Test start_new_day updates the summary sensor."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        mock_summary = Mock()
        mock_summary.async_update_ha_state = AsyncMock()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()
            sensor.set_state(ChoreState.COMPLETE.value)

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor},
            "summary_sensors": {"alice": mock_summary},
            "states": {},
        }

        await async_setup_services(hass)

        # Get start_new_day handler
        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            service_data,
            blocking=True,
        )

        # Verify summary sensor was updated
        # Should be called once from _update_summary_sensors (not individual sensors)
        mock_summary.async_update_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_mark_all_assignees_updates_all_summary_sensors(self, hass) -> None:
        """Test marking all assignees updates all their summary sensors."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        mock_summary_alice = Mock()
        mock_summary_alice.async_update_ha_state = AsyncMock()
        mock_summary_bob = Mock()
        mock_summary_bob.async_update_ha_state = AsyncMock()

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore, "alice")
            sensor_alice.async_update_ha_state = AsyncMock()
            sensor_bob = ChoreSensor(hass, chore, "bob")
            sensor_bob.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor_alice, "bob_dishes": sensor_bob},
            "summary_sensors": {"alice": mock_summary_alice, "bob": mock_summary_bob},
            "states": {},
        }

        await async_setup_services(hass)

        # Call mark_complete service without user (affects all assignees)
        service_data = {ATTR_CHORE_SLUG: "dishes"}  # No user specified

        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        # Verify both summary sensors were updated
        # Each sensor updated once from _update_summary_sensors
        assert mock_summary_alice.async_update_ha_state.call_count == 1
        assert mock_summary_bob.async_update_ha_state.call_count == 1


class TestRefreshSummaryService:
    """Tests for refresh_summary service."""

    @pytest.mark.asyncio
    async def test_refresh_summary_all_users(self, hass) -> None:
        """Test refresh_summary refreshes all summary sensors when no user specified."""
        mock_summary_alice = Mock()
        mock_summary_alice.async_update_ha_state = AsyncMock()
        mock_summary_bob = Mock()
        mock_summary_bob.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "summary_sensors": {"alice": mock_summary_alice, "bob": mock_summary_bob}
        }

        await async_setup_services(hass)

        # Call refresh_summary service
        await hass.services.async_call(
            DOMAIN,
            SERVICE_REFRESH_SUMMARY,
            {},
            blocking=True,
        )

        # Verify both summary sensors were refreshed
        mock_summary_alice.async_update_ha_state.assert_called_once_with(
            force_refresh=True
        )
        mock_summary_bob.async_update_ha_state.assert_called_once_with(
            force_refresh=True
        )

    @pytest.mark.asyncio
    async def test_refresh_summary_specific_user(self, hass) -> None:
        """Test refresh_summary refreshes only specified user's summary sensor."""
        mock_summary_alice = Mock()
        mock_summary_alice.async_update_ha_state = AsyncMock()
        mock_summary_bob = Mock()
        mock_summary_bob.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "summary_sensors": {"alice": mock_summary_alice, "bob": mock_summary_bob}
        }

        await async_setup_services(hass)

        # Get refresh_summary handler
        service_data = {ATTR_USER: "alice"}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_REFRESH_SUMMARY,
            service_data,
            blocking=True,
        )

        # Verify only Alice's summary sensor was refreshed
        mock_summary_alice.async_update_ha_state.assert_called_once_with(
            force_refresh=True
        )
        mock_summary_bob.async_update_ha_state.assert_not_called()

    @pytest.mark.asyncio
    async def test_refresh_summary_nonexistent_user(self, hass) -> None:
        """Test refresh_summary raises error for nonexistent user."""
        mock_summary_alice = Mock()

        hass.data[DOMAIN] = {"summary_sensors": {"alice": mock_summary_alice}}

        await async_setup_services(hass)

        # Get refresh_summary handler
        service_data = {ATTR_USER: "charlie"}

        with pytest.raises(ServiceValidationError, match="No summary sensor found"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_REFRESH_SUMMARY,
                service_data,
                blocking=True,
            )


class TestAdjustPointsService:
    """Tests for adjust_points service."""

    @pytest.mark.asyncio
    async def test_adjust_points_adds_points(self, hass) -> None:
        """Test that adjust_points correctly adds points."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set initial points
        await points_storage.set_points("alice", 10)

        mock_summary = Mock()
        mock_summary.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "points_storage": points_storage,
            "summary_sensors": {"alice": mock_summary},
        }

        await async_setup_services(hass)

        # Adjust points by +5
        await hass.services.async_call(
            DOMAIN,
            SERVICE_ADJUST_POINTS,
            {ATTR_USER: "alice", ATTR_ADJUSTMENT: 5},
            blocking=True,
        )

        # Verify points were added
        assert points_storage.get_points("alice") == 15

        # Verify summary sensor was updated
        mock_summary.async_update_ha_state.assert_called_once_with(force_refresh=True)

    @pytest.mark.asyncio
    async def test_adjust_points_subtracts_points(self, hass) -> None:
        """Test that adjust_points correctly subtracts points."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set initial points
        await points_storage.set_points("bob", 20)

        mock_summary = Mock()
        mock_summary.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "points_storage": points_storage,
            "summary_sensors": {"bob": mock_summary},
        }

        await async_setup_services(hass)

        # Adjust points by -7
        await hass.services.async_call(
            DOMAIN,
            SERVICE_ADJUST_POINTS,
            {ATTR_USER: "bob", ATTR_ADJUSTMENT: -7},
            blocking=True,
        )

        # Verify points were subtracted
        assert points_storage.get_points("bob") == 13

    @pytest.mark.asyncio
    async def test_adjust_points_new_user(self, hass) -> None:
        """Test adjust_points works for user with no previous points."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        mock_summary = Mock()
        mock_summary.async_update_ha_state = AsyncMock()

        hass.data[DOMAIN] = {
            "points_storage": points_storage,
            "summary_sensors": {"charlie": mock_summary},
        }

        await async_setup_services(hass)

        # Adjust points for new user
        await hass.services.async_call(
            DOMAIN,
            SERVICE_ADJUST_POINTS,
            {ATTR_USER: "charlie", ATTR_ADJUSTMENT: 15},
            blocking=True,
        )

        # Verify points were set
        assert points_storage.get_points("charlie") == 15

    @pytest.mark.asyncio
    async def test_adjust_points_integration_not_loaded(self, hass) -> None:
        """Test adjust_points raises error when integration not loaded."""
        from homeassistant.exceptions import HomeAssistantError

        # Remove DOMAIN from hass.data
        if DOMAIN in hass.data:
            del hass.data[DOMAIN]

        await async_setup_services(hass)

        with pytest.raises(HomeAssistantError, match="integration not loaded"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_ADJUST_POINTS,
                {ATTR_USER: "alice", ATTR_ADJUSTMENT: 10},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_adjust_points_no_storage(self, hass) -> None:
        """Test adjust_points raises error when points storage not initialized."""
        from homeassistant.exceptions import HomeAssistantError

        hass.data[DOMAIN] = {}  # No points_storage

        await async_setup_services(hass)

        with pytest.raises(HomeAssistantError, match="Points storage not initialized"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_ADJUST_POINTS,
                {ATTR_USER: "alice", ATTR_ADJUSTMENT: 10},
                blocking=True,
            )


class TestSummarySensorAttributes:
    """Tests for summary sensor attributes: points_missed and points_possible."""

    @pytest.mark.asyncio
    async def test_summary_sensor_includes_points_stats(self, hass) -> None:
        """Test summary sensor stats include points_missed and points_possible."""
        from custom_components.simple_chores.data import PointsStorage
        from custom_components.simple_chores.sensor import (
            ChoreSensorManager,
            ChoreSummarySensor,
        )

        # Create chores with different states to test calculation
        pending_chore = ChoreConfig(
            name="Pending Chore",
            slug="pending_chore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=10,
        )

        complete_chore = ChoreConfig(
            name="Complete Chore",
            slug="complete_chore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=5,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        await points_storage.set_points("alice", 100)

        manager = MagicMock(spec=ChoreSensorManager)
        manager.points_storage = points_storage
        manager.privilege_sensors = {}

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            pending_sensor = ChoreSensor(hass, pending_chore, "alice")
            pending_sensor.async_update_ha_state = AsyncMock()
            pending_sensor.set_state(ChoreState.PENDING.value)
            await pending_sensor.async_update_ha_state(force_refresh=True)

            complete_sensor = ChoreSensor(hass, complete_chore, "alice")
            complete_sensor.async_update_ha_state = AsyncMock()
            complete_sensor.set_state(ChoreState.COMPLETE.value)
            await complete_sensor.async_update_ha_state(force_refresh=True)

        manager.sensors = {
            "alice_pending_chore": pending_sensor,
            "alice_complete_chore": complete_sensor,
        }

        summary_sensor = ChoreSummarySensor(hass, "alice", manager)
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)
        await summary_sensor.async_update()

        attrs = summary_sensor.extra_state_attributes

        # Verify all expected attributes are present
        assert "total_points" in attrs
        assert "points_missed" in attrs
        assert "points_possible" in attrs

        # Verify values are calculated from current states
        assert attrs["total_points"] == 100
        # points_missed is cumulative from storage (not set yet, so 0)
        assert attrs["points_missed"] == 0
        # points_possible is earned plus missed plus pending: 0 + 0 + 10,
        # since pending_chore is pending.
        assert attrs["points_possible"] == 10

    @pytest.mark.asyncio
    async def test_summary_sensor_default_points_stats(self, hass) -> None:
        """Test that summary sensor has default values for points stats."""
        from custom_components.simple_chores.data import PointsStorage
        from custom_components.simple_chores.sensor import (
            ChoreSensorManager,
            ChoreSummarySensor,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        manager = MagicMock(spec=ChoreSensorManager)
        manager.sensors = {}
        manager.points_storage = points_storage
        manager.privilege_sensors = {}

        summary_sensor = ChoreSummarySensor(hass, "bob", manager)
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)
        await summary_sensor.async_update()

        attrs = summary_sensor.extra_state_attributes

        # Verify default values (no stats set yet)
        assert attrs["total_points"] == 0
        assert attrs["points_missed"] == 0
        assert attrs["points_possible"] == 0


class TestResetPointsService:
    """Tests for reset_points service."""

    @pytest.mark.asyncio
    async def test_reset_points_daily_stats_only(self, hass) -> None:
        """Test that reset_points, by default, resets points_missed but not total."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set up initial state
        await points_storage.set_points("alice", 100)
        await points_storage.set_points_missed("alice", 15)

        hass.data[DOMAIN] = {"points_storage": points_storage}

        await async_setup_services(hass)

        # Call reset_points without reset_total
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_POINTS,
            {ATTR_USER: "alice", ATTR_RESET_TOTAL: False},
            blocking=True,
        )

        # Verify cumulative points_missed reset but total points unchanged
        assert points_storage.get_points("alice") == 100
        assert points_storage.get_points_missed("alice") == 0

    @pytest.mark.asyncio
    async def test_reset_points_with_total(self, hass) -> None:
        """Test reset_points resets both missed and total points when requested."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set up initial state
        await points_storage.set_points("alice", 100)
        await points_storage.set_points_missed("alice", 15)

        hass.data[DOMAIN] = {"points_storage": points_storage}

        await async_setup_services(hass)

        # Call reset_points with reset_total=True
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_POINTS,
            {ATTR_USER: "alice", ATTR_RESET_TOTAL: True},
            blocking=True,
        )

        # Verify everything reset to 0
        assert points_storage.get_points("alice") == 0
        assert points_storage.get_points_missed("alice") == 0

    @pytest.mark.asyncio
    async def test_reset_points_all_users(self, hass) -> None:
        """Test reset_points resets for all users when no user specified."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set up initial state for multiple users
        await points_storage.set_points("alice", 100)
        await points_storage.set_points_missed("alice", 15)
        await points_storage.set_points("bob", 50)
        await points_storage.set_points_missed("bob", 10)

        # Create sensors to ensure all users are found
        chore = ChoreConfig(
            name="Test Chore",
            slug="test_chore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore, "alice")
            sensor_bob = ChoreSensor(hass, chore, "bob")

        hass.data[DOMAIN] = {
            "points_storage": points_storage,
            "sensors": {
                "alice_test_chore": sensor_alice,
                "bob_test_chore": sensor_bob,
            },
            "summary_sensors": {},
        }

        await async_setup_services(hass)

        # Call reset_points without user (all users)
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_POINTS,
            {ATTR_RESET_TOTAL: False},
            blocking=True,
        )

        # Verify cumulative missed reset for both users, totals unchanged
        assert points_storage.get_points("alice") == 100
        assert points_storage.get_points_missed("alice") == 0
        assert points_storage.get_points("bob") == 50
        assert points_storage.get_points_missed("bob") == 0

    @pytest.mark.asyncio
    async def test_reset_points_all_users_with_total(self, hass) -> None:
        """Test reset_points resets everything for all users when requested."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set up initial state for multiple users
        await points_storage.set_points("alice", 100)
        await points_storage.set_points_missed("alice", 15)
        await points_storage.set_points("bob", 50)
        await points_storage.set_points_missed("bob", 10)

        # Create sensors
        chore = ChoreConfig(
            name="Test Chore",
            slug="test_chore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(hass, chore, "alice")
            sensor_bob = ChoreSensor(hass, chore, "bob")

        hass.data[DOMAIN] = {
            "points_storage": points_storage,
            "sensors": {
                "alice_test_chore": sensor_alice,
                "bob_test_chore": sensor_bob,
            },
            "summary_sensors": {},
        }

        await async_setup_services(hass)

        # Call reset_points for all users with total reset
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_POINTS,
            {ATTR_RESET_TOTAL: True},
            blocking=True,
        )

        # Verify everything reset for both users
        assert points_storage.get_points("alice") == 0
        assert points_storage.get_points_missed("alice") == 0
        assert points_storage.get_points("bob") == 0
        assert points_storage.get_points_missed("bob") == 0

    @pytest.mark.asyncio
    async def test_reset_points_integration_not_loaded(self, hass) -> None:
        """Test reset_points raises error when integration not loaded."""
        from homeassistant.exceptions import HomeAssistantError

        # Remove DOMAIN from hass.data
        if DOMAIN in hass.data:
            del hass.data[DOMAIN]

        await async_setup_services(hass)

        with pytest.raises(HomeAssistantError, match="integration not loaded"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_RESET_POINTS,
                {ATTR_USER: "alice"},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_reset_points_no_storage(self, hass) -> None:
        """Test reset_points raises error when points storage not initialized."""
        from homeassistant.exceptions import HomeAssistantError

        hass.data[DOMAIN] = {}  # No points_storage

        await async_setup_services(hass)

        with pytest.raises(HomeAssistantError, match="Points storage not initialized"):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_RESET_POINTS,
                {ATTR_USER: "alice"},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_reset_points_default_reset_total_false(self, hass) -> None:
        """Test that reset_total defaults to False when not provided."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        await points_storage.set_points("alice", 100)
        await points_storage.set_points_earned("alice", 50)
        await points_storage.set_points_missed("alice", 15)

        hass.data[DOMAIN] = {"points_storage": points_storage}

        await async_setup_services(hass)

        # Call without specifying reset_total (should default to False)
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_POINTS,
            {ATTR_USER: "alice"},
            blocking=True,
        )

        # Verify total points not reset, earned and cumulative missed reset
        assert points_storage.get_points("alice") == 100
        assert points_storage.get_points_earned("alice") == 0
        assert points_storage.get_points_missed("alice") == 0

    @pytest.mark.asyncio
    async def test_points_earned_increments_with_mark_complete(self, hass) -> None:
        """Test points_earned and total_points increment on mark_complete."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Create chores with different states
        chore1 = ChoreConfig(
            name="Complete Chore",
            slug="complete_chore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=10,
        )
        chore2 = ChoreConfig(
            name="Another Complete Chore",
            slug="another_complete",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=5,
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor1 = ChoreSensor(hass, chore1, "alice")
            sensor1.async_update_ha_state = AsyncMock()
            sensor1.set_state(ChoreState.PENDING.value)

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.async_update_ha_state = AsyncMock()
            sensor2.set_state(ChoreState.PENDING.value)

        hass.data[DOMAIN] = {
            "points_storage": points_storage,
            "sensors": {
                "alice_complete_chore": sensor1,
                "alice_another_complete": sensor2,
            },
            "summary_sensors": {},
        }

        await async_setup_services(hass)

        # Initially no points
        assert points_storage.get_points("alice") == 0
        assert points_storage.get_points_earned("alice") == 0

        # Mark chores as complete (points awarded immediately)
        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE,
            {ATTR_USER: "alice", ATTR_CHORE_SLUG: "complete_chore"},
            blocking=True,
        )

        # Verify points for first chore
        assert points_storage.get_points("alice") == 10
        assert points_storage.get_points_earned("alice") == 10

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE,
            {ATTR_USER: "alice", ATTR_CHORE_SLUG: "another_complete"},
            blocking=True,
        )

        # Verify both total_points and points_earned are updated
        assert points_storage.get_points("alice") == 15  # 10 + 5
        assert points_storage.get_points_earned("alice") == 15  # 10 + 5

    @pytest.mark.asyncio
    async def test_points_earned_resets_independently(self, hass) -> None:
        """Test that points_earned resets without affecting total_points."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set initial values
        await points_storage.set_points("alice", 100)
        await points_storage.set_points_earned("alice", 50)

        hass.data[DOMAIN] = {"points_storage": points_storage}

        await async_setup_services(hass)

        # Reset with reset_total=false (default)
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_POINTS,
            {ATTR_USER: "alice"},
            blocking=True,
        )

        # total_points should remain, points_earned should be reset
        assert points_storage.get_points("alice") == 100
        assert points_storage.get_points_earned("alice") == 0

    @pytest.mark.asyncio
    async def test_mark_pending_deducts_points(self, hass) -> None:
        """Test that marking a completed chore as pending deducts points."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Create a chore
        chore = ChoreConfig(
            name="Test Chore",
            slug="test_chore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            points=25,
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")
            sensor.async_update_ha_state = AsyncMock()
            sensor.set_state(ChoreState.COMPLETE.value)

        hass.data[DOMAIN] = {
            "points_storage": points_storage,
            "sensors": {"alice_test_chore": sensor},
            "summary_sensors": {},
        }

        await async_setup_services(hass)

        # Set points (as if chore was completed earlier)
        await points_storage.add_points("alice", 25)
        await points_storage.add_points_earned("alice", 25)

        # Verify initial points
        assert points_storage.get_points("alice") == 25
        assert points_storage.get_points_earned("alice") == 25

        # Mark as pending (should deduct points)
        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_PENDING,
            {ATTR_USER: "alice", ATTR_CHORE_SLUG: "test_chore"},
            blocking=True,
        )

        # Verify points were deducted
        assert points_storage.get_points("alice") == 0
        assert points_storage.get_points_earned("alice") == 0

    @pytest.mark.asyncio
    async def test_points_earned_resets_with_total(self, hass) -> None:
        """Test that both points_earned and total_points reset when reset_total=true."""
        from custom_components.simple_chores.data import PointsStorage

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set initial values
        await points_storage.set_points("alice", 100)
        await points_storage.set_points_earned("alice", 50)

        hass.data[DOMAIN] = {"points_storage": points_storage}

        await async_setup_services(hass)

        # Reset with reset_total=true
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_POINTS,
            {ATTR_USER: "alice", ATTR_RESET_TOTAL: True},
            blocking=True,
        )

        # Both should be reset
        assert points_storage.get_points("alice") == 0
        assert points_storage.get_points_earned("alice") == 0

    @pytest.mark.asyncio
    async def test_reset_points_updates_summary_sensor_attributes(self, hass) -> None:
        """Test that reset_points updates summary sensor attributes correctly."""
        from unittest.mock import MagicMock

        from custom_components.simple_chores.data import PointsStorage
        from custom_components.simple_chores.sensor import (
            ChoreSensorManager,
            ChoreSummarySensor,
        )

        points_storage = PointsStorage(hass)
        await points_storage.async_load()

        # Set initial points
        await points_storage.set_points("alice", 100)
        await points_storage.set_points_earned("alice", 50)
        await points_storage.set_points_missed("alice", 25)

        # Create a chore and sensor
        chore = ChoreConfig(
            name="Test Chore",
            slug="test_chore",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(hass, chore, "alice")

        # Create sensor manager and summary sensor
        mock_config_loader = MagicMock()
        mock_config = SimpleChoresConfig(chores=[chore])
        mock_config_loader.config = mock_config

        manager = ChoreSensorManager(hass, Mock(), mock_config_loader)
        manager.points_storage = points_storage
        manager.sensors = {"alice_test_chore": sensor}

        # Create summary sensor
        summary_sensor = ChoreSummarySensor(hass, "alice", manager)
        summary_sensor.async_update_ha_state = make_summary_update_mock(summary_sensor)
        await summary_sensor.async_update()

        hass.data[DOMAIN] = {
            "points_storage": points_storage,
            "sensors": {"alice_test_chore": sensor},
            "summary_sensors": {"alice": summary_sensor},
        }

        await async_setup_services(hass)

        # Verify initial state
        attrs_before = summary_sensor.extra_state_attributes
        assert attrs_before["total_points"] == 100
        assert attrs_before["points_earned"] == 50
        assert attrs_before["points_missed"] == 25

        # Call reset_points
        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_POINTS,
            {ATTR_USER: "alice"},
            blocking=True,
        )

        # Verify summary sensor attributes are updated
        attrs_after = summary_sensor.extra_state_attributes
        assert attrs_after["total_points"] == 100  # Should not change
        assert attrs_after["points_earned"] == 0  # Should be reset
        assert attrs_after["points_missed"] == 0  # Should be reset


class TestClearTemporaryDisableService:
    """Tests for the clear_temporary_disable service."""

    @pytest.fixture
    def privilege_sensor(self, hass) -> PrivilegeSensor:
        """Create a manual privilege sensor for alice, wired up like a real entity."""
        privilege = PrivilegeConfig(
            name="Extra Dessert",
            slug="extra_dessert",
            behavior=PrivilegeBehavior.MANUAL,
            assignees=["alice"],
        )
        manager = Mock()
        manager.points_storage = Mock()
        manager.points_storage.get_privilege_state = Mock(return_value=None)
        manager.points_storage.get_privilege_disable_until = Mock(return_value=None)
        manager.points_storage.get_privilege_pre_block_state = Mock(return_value=None)
        manager.points_storage.set_privilege_state = AsyncMock()
        manager.points_storage.set_privilege_disable_until = AsyncMock()
        manager.points_storage.set_privilege_pre_block_state = AsyncMock()
        sensor = PrivilegeSensor(hass, privilege, "alice", manager)
        sensor.async_update_ha_state = AsyncMock()
        return sensor

    @pytest.mark.asyncio
    async def test_clear_restores_privilege_that_was_enabled(
        self, hass, privilege_sensor: PrivilegeSensor
    ) -> None:
        """Clearing a block on a previously-enabled privilege re-enables it."""
        await privilege_sensor.async_enable()
        await privilege_sensor.async_temporarily_disable(60)
        hass.data[DOMAIN]["privilege_sensors"] = {
            "alice_extra_dessert": privilege_sensor
        }
        await async_setup_services(hass)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_CLEAR_TEMPORARY_DISABLE,
            {ATTR_USER: "alice", ATTR_PRIVILEGE_SLUG: "extra_dessert"},
            blocking=True,
        )

        assert privilege_sensor.get_state() == PrivilegeState.ENABLED.value
        privilege_sensor.async_update_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_clear_raises_when_no_matching_sensor(self, hass) -> None:
        """Clearing a privilege with no matching sensor raises a validation error."""
        hass.data[DOMAIN]["privilege_sensors"] = {}
        await async_setup_services(hass)

        with pytest.raises(ServiceValidationError):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_CLEAR_TEMPORARY_DISABLE,
                {ATTR_USER: "alice", ATTR_PRIVILEGE_SLUG: "nonexistent"},
                blocking=True,
            )

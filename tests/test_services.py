"""Tests for simple_chores services."""

from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from custom_components.simple_chores.const import (
    ATTR_CHORE_SLUG,
    ATTR_USER,
    DOMAIN,
    SERVICE_CREATE_CHORE,
    SERVICE_DELETE_CHORE,
    SERVICE_MARK_COMPLETE,
    SERVICE_MARK_NOT_REQUESTED,
    SERVICE_MARK_PENDING,
    SERVICE_RESET_COMPLETED,
    SERVICE_START_NEW_DAY,
    SERVICE_UPDATE_CHORE,
)
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
)
from custom_components.simple_chores.sensor import ChoreSensor
from custom_components.simple_chores.services import async_setup_services


@pytest.fixture
def mock_hass() -> MagicMock:
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.services = MagicMock()
    hass.services.async_register = Mock()
    hass.loop = MagicMock()
    return hass


@pytest.fixture
def mock_sensor(mock_hass: MagicMock) -> ChoreSensor:
    """Create a mock chore sensor."""
    chore = ChoreConfig(
        name="Dishes",
        slug="dishes",
        frequency=ChoreFrequency.DAILY,
        assignees=["alice"],
    )
    with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
        sensor = ChoreSensor(mock_hass, chore, "alice")
        sensor.set_state = AsyncMock()
    return sensor


class TestServiceSetup:
    """Tests for service setup."""

    @pytest.mark.asyncio
    async def test_setup_services_registers_all_services(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that all services are registered."""
        await async_setup_services(mock_hass)

        assert mock_hass.services.async_register.call_count == 8

        # Check that each service was registered
        calls = mock_hass.services.async_register.call_args_list
        registered_services = [call[0][1] for call in calls]

        assert SERVICE_MARK_COMPLETE in registered_services
        assert SERVICE_MARK_PENDING in registered_services
        assert SERVICE_MARK_NOT_REQUESTED in registered_services
        assert SERVICE_RESET_COMPLETED in registered_services
        assert SERVICE_START_NEW_DAY in registered_services
        assert SERVICE_CREATE_CHORE in registered_services
        assert SERVICE_UPDATE_CHORE in registered_services
        assert SERVICE_DELETE_CHORE in registered_services

    @pytest.mark.asyncio
    async def test_setup_services_uses_correct_domain(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that services are registered with correct domain."""
        await async_setup_services(mock_hass)

        calls = mock_hass.services.async_register.call_args_list
        for call in calls:
            assert call[0][0] == DOMAIN


class TestMarkCompleteService:
    """Tests for mark_complete service."""

    @pytest.mark.asyncio
    async def test_mark_complete_updates_sensor_state(
        self, mock_hass: MagicMock, mock_sensor: ChoreSensor
    ) -> None:
        """Test that mark_complete service updates sensor state."""
        # Setup
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(mock_hass)

        # Get the registered handler
        handler = mock_hass.services.async_register.call_args_list[0][0][2]

        # Create service call
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mock to ignore initialization calls
        mock_sensor.set_state.reset_mock()

        # Execute
        await handler(call)

        # Verify - should be called with COMPLETE (may be called multiple times due to internals)
        mock_sensor.set_state.assert_called_with(ChoreState.COMPLETE)

    @pytest.mark.asyncio
    async def test_mark_complete_logs_info(
        self,
        mock_hass: MagicMock,
        mock_sensor: ChoreSensor,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """Test that mark_complete logs at INFO level."""
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        with caplog.at_level("INFO"):
            await handler(call)

        # Check that INFO logs contain service call details
        assert "Service 'mark_complete' called" in caplog.text
        assert "user='alice'" in caplog.text
        assert "chore_slug='dishes'" in caplog.text
        assert "Marked chore 'dishes' as complete for user 'alice'" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_complete_sensor_not_found(
        self, mock_hass: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_complete when sensor doesn't exist."""
        from homeassistant.exceptions import ServiceValidationError

        mock_hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        with pytest.raises(ServiceValidationError, match="No sensor found"):
            await handler(call)

        # Should also log error
        assert "No sensor found" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_complete_integration_not_loaded(
        self, mock_hass: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_complete when integration not loaded."""
        from homeassistant.exceptions import HomeAssistantError

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        with pytest.raises(HomeAssistantError, match="integration not loaded"):
            await handler(call)

        assert "integration not loaded" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_complete_actually_changes_state(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that mark_complete actually changes the sensor state value."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(mock_hass, chore, "alice")
            sensor.async_write_ha_state = Mock()

        # Initially NOT_REQUESTED
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value

        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}, "states": {}}
        await async_setup_services(mock_hass)

        # Call mark_complete
        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await handler(call)

        # Verify state changed to COMPLETE
        assert sensor.native_value == ChoreState.COMPLETE.value, (
            f"Expected state to be '{ChoreState.COMPLETE.value}' but got '{sensor.native_value}'"
        )


class TestMarkPendingService:
    """Tests for mark_pending service."""

    @pytest.mark.asyncio
    async def test_mark_pending_updates_sensor_state(
        self, mock_hass: MagicMock, mock_sensor: ChoreSensor
    ) -> None:
        """Test that mark_pending service updates sensor state."""
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(mock_hass)

        # Get the handler for mark_pending (second service)
        handler = mock_hass.services.async_register.call_args_list[1][0][2]

        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mock to ignore initialization calls
        mock_sensor.set_state.reset_mock()

        await handler(call)

        mock_sensor.set_state.assert_called_with(ChoreState.PENDING)

    @pytest.mark.asyncio
    async def test_mark_pending_logs_info(
        self,
        mock_hass: MagicMock,
        mock_sensor: ChoreSensor,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """Test that mark_pending logs at INFO level."""
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[1][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        with caplog.at_level("INFO"):
            await handler(call)

        # Check that INFO logs contain service call details
        assert "Service 'mark_pending' called" in caplog.text
        assert "user='alice'" in caplog.text
        assert "chore_slug='dishes'" in caplog.text
        assert "Marked chore 'dishes' as pending for user 'alice'" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_pending_sensor_not_found(
        self, mock_hass: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_pending when sensor doesn't exist."""
        from homeassistant.exceptions import ServiceValidationError

        mock_hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[1][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        with pytest.raises(ServiceValidationError, match="No sensor found"):
            await handler(call)

        assert "No sensor found" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_pending_actually_changes_state(
        self, mock_hass: MagicMock
    ) -> None:
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
            sensor = ChoreSensor(mock_hass, chore, "alice")
            # Also mock it on the instance for calls during set_state
            sensor.async_write_ha_state = Mock()

        # Initially the sensor should be in NOT_REQUESTED state
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value

        # Setup the service
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}, "states": {}}
        await async_setup_services(mock_hass)

        # Call mark_pending service
        handler = mock_hass.services.async_register.call_args_list[1][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await handler(call)

        # Verify the state actually changed to PENDING
        assert sensor.native_value == ChoreState.PENDING.value, (
            f"Expected state to be '{ChoreState.PENDING.value}' but got '{sensor.native_value}'"
        )


class TestMarkNotRequestedService:
    """Tests for mark_not_requested service."""

    @pytest.mark.asyncio
    async def test_mark_not_requested_updates_sensor_state(
        self, mock_hass: MagicMock, mock_sensor: ChoreSensor
    ) -> None:
        """Test that mark_not_requested service updates sensor state."""
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(mock_hass)

        # Get the handler for mark_not_requested (third service)
        handler = mock_hass.services.async_register.call_args_list[2][0][2]

        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mock to ignore initialization calls
        mock_sensor.set_state.reset_mock()

        await handler(call)

        mock_sensor.set_state.assert_called_with(ChoreState.NOT_REQUESTED)

    @pytest.mark.asyncio
    async def test_mark_not_requested_logs_info(
        self,
        mock_hass: MagicMock,
        mock_sensor: ChoreSensor,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """Test that mark_not_requested logs at INFO level."""
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": mock_sensor}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[2][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        with caplog.at_level("INFO"):
            await handler(call)

        # Check that INFO logs contain service call details
        assert "Service 'mark_not_requested' called" in caplog.text
        assert "user='alice'" in caplog.text
        assert "chore_slug='dishes'" in caplog.text
        assert "Marked chore 'dishes' as not requested for user 'alice'" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_not_requested_sensor_not_found(
        self, mock_hass: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_not_requested when sensor doesn't exist."""
        from homeassistant.exceptions import ServiceValidationError

        mock_hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[2][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        with pytest.raises(ServiceValidationError, match="No sensor found"):
            await handler(call)

        assert "No sensor found" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_not_requested_actually_changes_state(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that mark_not_requested actually changes the sensor state value."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(mock_hass, chore, "alice")
            sensor.async_write_ha_state = Mock()
            # Set initial state to COMPLETE
            sensor._attr_native_value = ChoreState.COMPLETE.value

        assert sensor.native_value == ChoreState.COMPLETE.value

        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}, "states": {}}
        await async_setup_services(mock_hass)

        # Call mark_not_requested
        handler = mock_hass.services.async_register.call_args_list[2][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await handler(call)

        # Verify state changed to NOT_REQUESTED
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value, (
            f"Expected state to be '{ChoreState.NOT_REQUESTED.value}' but got '{sensor.native_value}'"
        )


class TestServiceStateTransitions:
    """Test state transitions through service calls."""

    @pytest.mark.asyncio
    async def test_complete_state_transition_sequence(
        self, mock_hass: MagicMock
    ) -> None:
        """Test a complete sequence of state transitions."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(mock_hass, chore, "alice")
            sensor.async_write_ha_state = Mock()

        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}, "states": {}}
        await async_setup_services(mock_hass)

        # Get handlers
        mark_complete_handler = mock_hass.services.async_register.call_args_list[0][0][
            2
        ]
        mark_pending_handler = mock_hass.services.async_register.call_args_list[1][0][2]
        mark_not_requested_handler = mock_hass.services.async_register.call_args_list[
            2
        ][0][2]

        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Initial state: NOT_REQUESTED
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value

        # NOT_REQUESTED -> PENDING
        await mark_pending_handler(call)
        assert sensor.native_value == ChoreState.PENDING.value, (
            "Failed to transition from NOT_REQUESTED to PENDING"
        )

        # PENDING -> COMPLETE
        await mark_complete_handler(call)
        assert sensor.native_value == ChoreState.COMPLETE.value, (
            "Failed to transition from PENDING to COMPLETE"
        )

        # COMPLETE -> NOT_REQUESTED
        await mark_not_requested_handler(call)
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value, (
            "Failed to transition from COMPLETE to NOT_REQUESTED"
        )

        # NOT_REQUESTED -> COMPLETE (direct transition)
        await mark_complete_handler(call)
        assert sensor.native_value == ChoreState.COMPLETE.value, (
            "Failed to transition directly from NOT_REQUESTED to COMPLETE"
        )

        # COMPLETE -> PENDING (backwards transition)
        await mark_pending_handler(call)
        assert sensor.native_value == ChoreState.PENDING.value, (
            "Failed to transition from COMPLETE back to PENDING"
        )


class TestServiceIntegration:
    """Integration tests for services."""

    @pytest.mark.asyncio
    async def test_services_work_after_sensor_platform_setup(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that services work after sensor platform is set up."""
        # Create sensors manually (simulating what sensor platform does)
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(mock_hass, chore, "alice")
            sensor.set_state = AsyncMock()

        # Simulate sensor platform setup storing sensors
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}}

        # Setup services
        await async_setup_services(mock_hass)

        # Verify we can call the service
        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mock to ignore initialization calls
        sensor.set_state.reset_mock()

        # This should not raise an error
        await handler(call)

        # Verify sensor state was updated
        sensor.set_state.assert_called_with(ChoreState.COMPLETE)

    @pytest.mark.asyncio
    async def test_multiple_sensors_different_users(self, mock_hass: MagicMock) -> None:
        """Test services with multiple sensors for different users."""
        # Create multiple sensors
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(mock_hass, chore, "alice")
            sensor_bob = ChoreSensor(mock_hass, chore, "bob")
            sensor_alice.set_state = AsyncMock()
            sensor_bob.set_state = AsyncMock()

        mock_hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor_alice, "bob_dishes": sensor_bob}
        }

        await async_setup_services(mock_hass)

        # Call service for alice
        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mocks to ignore initialization calls
        sensor_alice.set_state.reset_mock()
        sensor_bob.set_state.reset_mock()

        await handler(call)

        # Only alice's sensor should be updated
        sensor_alice.set_state.assert_called_with(ChoreState.COMPLETE)
        sensor_bob.set_state.assert_not_called()

        # Reset and call for bob
        sensor_alice.set_state.reset_mock()
        sensor_bob.set_state.reset_mock()
        call.data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "dishes"}
        await handler(call)

        # Only bob's sensor should be updated
        sensor_alice.set_state.assert_not_called()
        sensor_bob.set_state.assert_called_with(ChoreState.COMPLETE)

    @pytest.mark.asyncio
    async def test_service_with_special_characters_in_slug(
        self, mock_hass: MagicMock
    ) -> None:
        """Test service with special characters in slug."""
        chore = ChoreConfig(
            name="Test Chore",
            slug="test-chore_123",  # Gets sanitized to test_chore_123
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(mock_hass, chore, "alice")
            sensor.set_state = AsyncMock()

        # Key should be sanitized: hyphens converted to underscores
        mock_hass.data[DOMAIN] = {"sensors": {"alice_test_chore_123": sensor}}

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "test-chore_123"}

        # Reset mock to ignore initialization calls
        sensor.set_state.reset_mock()

        await handler(call)

        sensor.set_state.assert_called_with(ChoreState.COMPLETE)


class TestResetCompletedService:
    """Tests for reset_completed service."""

    @pytest.mark.asyncio
    async def test_reset_completed_all_users(self, mock_hass: MagicMock) -> None:
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
            sensor1 = ChoreSensor(mock_hass, chore1, "alice")
            sensor1.set_state = AsyncMock()
            sensor1._attr_native_value = ChoreState.COMPLETE.value

            sensor2 = ChoreSensor(mock_hass, chore2, "bob")
            sensor2.set_state = AsyncMock()
            sensor2._attr_native_value = ChoreState.COMPLETE.value

            sensor3 = ChoreSensor(mock_hass, chore3, "alice")
            sensor3.set_state = AsyncMock()
            sensor3._attr_native_value = ChoreState.PENDING.value

        mock_hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor1,
                "bob_vacuum": sensor2,
                "alice_laundry": sensor3,
            }
        }

        await async_setup_services(mock_hass)

        # Get the reset_completed handler (should be 4th registered service)
        handler = mock_hass.services.async_register.call_args_list[3][0][2]

        # Create service call without user (reset all)
        call = MagicMock()
        call.data = {}

        await handler(call)

        # Both COMPLETE sensors should be reset
        sensor1.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        sensor2.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        # PENDING sensor should not be touched
        sensor3.set_state.assert_not_called()

    @pytest.mark.asyncio
    async def test_reset_completed_specific_user(self, mock_hass: MagicMock) -> None:
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
            sensor_alice = ChoreSensor(mock_hass, chore1, "alice")
            sensor_alice.set_state = AsyncMock()
            sensor_alice._attr_native_value = ChoreState.COMPLETE.value

            sensor_bob = ChoreSensor(mock_hass, chore2, "bob")
            sensor_bob.set_state = AsyncMock()
            sensor_bob._attr_native_value = ChoreState.COMPLETE.value

        mock_hass.data[DOMAIN] = {
            "sensors": {
                "alice_dishes": sensor_alice,
                "bob_vacuum": sensor_bob,
            }
        }

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[3][0][2]

        # Create service call for alice only
        call = MagicMock()
        call.data = {ATTR_USER: "alice"}

        await handler(call)

        # Only alice's sensor should be reset
        sensor_alice.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        sensor_bob.set_state.assert_not_called()

    @pytest.mark.asyncio
    async def test_reset_completed_no_completed_chores(
        self, mock_hass: MagicMock
    ) -> None:
        """Test reset_completed when no chores are completed."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(mock_hass, chore, "alice")
            sensor.set_state = AsyncMock()
            sensor._attr_native_value = ChoreState.PENDING.value

        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}}

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[3][0][2]

        call = MagicMock()
        call.data = {}

        await handler(call)

        # Sensor should not be reset since it's not COMPLETE
        sensor.set_state.assert_not_called()


"""Test code for reset_by_frequency service - will be added to test_services.py"""


class TestStartNewDayService:
    """Tests for start_new_day service."""

    @pytest.mark.asyncio
    async def test_start_new_day_manual_and_daily(self, mock_hass: MagicMock) -> None:
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
            sensor_manual = ChoreSensor(mock_hass, chore_manual, "alice")
            sensor_manual.set_state = AsyncMock()
            sensor_manual._attr_native_value = ChoreState.COMPLETE.value

            sensor_daily = ChoreSensor(mock_hass, chore_daily, "alice")
            sensor_daily.set_state = AsyncMock()
            sensor_daily._attr_native_value = ChoreState.COMPLETE.value

        mock_hass.data[DOMAIN] = {
            "sensors": {
                "alice_manual_task": sensor_manual,
                "alice_daily_task": sensor_daily,
            }
        }

        await async_setup_services(mock_hass)

        # Get the start_new_day handler (should be 5th registered service)
        handler = mock_hass.services.async_register.call_args_list[4][0][2]

        # Create service call without user (reset all)
        call = MagicMock()
        call.data = {}

        await handler(call)

        # Manual should be reset to NOT_REQUESTED
        sensor_manual.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        # Daily should be reset to PENDING
        sensor_daily.set_state.assert_called_once_with(ChoreState.PENDING)

    @pytest.mark.asyncio
    async def test_start_new_day_specific_user(self, mock_hass: MagicMock) -> None:
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
            sensor_alice = ChoreSensor(mock_hass, chore1, "alice")
            sensor_alice.set_state = AsyncMock()
            sensor_alice._attr_native_value = ChoreState.COMPLETE.value

            sensor_bob = ChoreSensor(mock_hass, chore2, "bob")
            sensor_bob.set_state = AsyncMock()
            sensor_bob._attr_native_value = ChoreState.COMPLETE.value

        mock_hass.data[DOMAIN] = {
            "sensors": {
                "alice_manual_task": sensor_alice,
                "bob_daily_task": sensor_bob,
            }
        }

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[4][0][2]

        # Create service call for alice only
        call = MagicMock()
        call.data = {ATTR_USER: "alice"}

        await handler(call)

        # Only alice's sensor should be reset
        sensor_alice.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        sensor_bob.set_state.assert_not_called()

    @pytest.mark.asyncio
    async def test_start_new_day_ignores_non_complete(
        self, mock_hass: MagicMock
    ) -> None:
        """Test start_new_day only affects completed chores."""
        chore = ChoreConfig(
            name="Manual Task",
            slug="manual_task",
            frequency=ChoreFrequency.MANUAL,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor = ChoreSensor(mock_hass, chore, "alice")
            sensor.set_state = AsyncMock()
            sensor._attr_native_value = ChoreState.PENDING.value

        mock_hass.data[DOMAIN] = {"sensors": {"alice_manual_task": sensor}}

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[4][0][2]

        call = MagicMock()
        call.data = {}

        await handler(call)

        # Sensor should not be reset since it's not COMPLETE
        sensor.set_state.assert_not_called()

    @pytest.mark.asyncio
    async def test_start_new_day_mixed_states(self, mock_hass: MagicMock) -> None:
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
            sensor1 = ChoreSensor(mock_hass, chore1, "alice")
            sensor1.set_state = AsyncMock()
            sensor1._attr_native_value = ChoreState.COMPLETE.value

            sensor2 = ChoreSensor(mock_hass, chore2, "alice")
            sensor2.set_state = AsyncMock()
            sensor2._attr_native_value = ChoreState.PENDING.value

            sensor3 = ChoreSensor(mock_hass, chore3, "alice")
            sensor3.set_state = AsyncMock()
            sensor3._attr_native_value = ChoreState.COMPLETE.value

        mock_hass.data[DOMAIN] = {
            "sensors": {
                "alice_manual_complete": sensor1,
                "alice_manual_pending": sensor2,
                "alice_daily_complete": sensor3,
            }
        }

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[4][0][2]

        call = MagicMock()
        call.data = {}

        await handler(call)

        # Manual complete should be reset to NOT_REQUESTED
        sensor1.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        # Manual pending should not be reset
        sensor2.set_state.assert_not_called()
        # Daily complete should be reset to PENDING
        sensor3.set_state.assert_called_once_with(ChoreState.PENDING)

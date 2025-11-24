"""Tests for simple_chores services."""

from unittest.mock import MagicMock, Mock, patch

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
        sensor.set_state = Mock()
    return sensor


class TestServiceSetup:
    """Tests for service setup."""

    @pytest.mark.asyncio
    async def test_setup_services_registers_all_services(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that all services are registered."""
        await async_setup_services(mock_hass)

        assert mock_hass.services.async_register.call_count == 7

        # Check that each service was registered
        calls = mock_hass.services.async_register.call_args_list
        registered_services = [call[0][1] for call in calls]

        assert SERVICE_MARK_COMPLETE in registered_services
        assert SERVICE_MARK_PENDING in registered_services
        assert SERVICE_MARK_NOT_REQUESTED in registered_services
        assert SERVICE_RESET_COMPLETED in registered_services
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

        # Execute
        await handler(call)

        # Verify
        mock_sensor.set_state.assert_called_once()
        assert mock_sensor.set_state.call_args[0][0] == ChoreState.COMPLETE

    @pytest.mark.asyncio
    async def test_mark_complete_sensor_not_found(
        self, mock_hass: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_complete when sensor doesn't exist."""
        mock_hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        await handler(call)

        # Should log error
        assert "No sensor found" in caplog.text

    @pytest.mark.asyncio
    async def test_mark_complete_integration_not_loaded(
        self, mock_hass: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_complete when integration not loaded."""
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await handler(call)

        assert "integration not loaded" in caplog.text


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

        await handler(call)

        mock_sensor.set_state.assert_called_once()
        assert mock_sensor.set_state.call_args[0][0] == ChoreState.PENDING

    @pytest.mark.asyncio
    async def test_mark_pending_sensor_not_found(
        self, mock_hass: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_pending when sensor doesn't exist."""
        mock_hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[1][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        await handler(call)

        assert "No sensor found" in caplog.text


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

        await handler(call)

        mock_sensor.set_state.assert_called_once()
        assert mock_sensor.set_state.call_args[0][0] == ChoreState.NOT_REQUESTED

    @pytest.mark.asyncio
    async def test_mark_not_requested_sensor_not_found(
        self, mock_hass: MagicMock, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test mark_not_requested when sensor doesn't exist."""
        mock_hass.data[DOMAIN] = {"sensors": {}}
        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[2][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "vacuum"}

        await handler(call)

        assert "No sensor found" in caplog.text


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
            sensor.set_state = Mock()

        # Simulate sensor platform setup storing sensors
        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}}

        # Setup services
        await async_setup_services(mock_hass)

        # Verify we can call the service
        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # This should not raise an error
        await handler(call)

        # Verify sensor state was updated
        sensor.set_state.assert_called_once_with(ChoreState.COMPLETE)

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
            sensor_alice.set_state = Mock()
            sensor_bob.set_state = Mock()

        mock_hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor_alice, "bob_dishes": sensor_bob}
        }

        await async_setup_services(mock_hass)

        # Call service for alice
        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}
        await handler(call)

        # Only alice's sensor should be updated
        sensor_alice.set_state.assert_called_once()
        sensor_bob.set_state.assert_not_called()

        # Reset and call for bob
        sensor_alice.set_state.reset_mock()
        call.data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "dishes"}
        await handler(call)

        # Only bob's sensor should be updated
        sensor_alice.set_state.assert_not_called()
        sensor_bob.set_state.assert_called_once()

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
            sensor.set_state = Mock()

        # Key should be sanitized: hyphens converted to underscores
        mock_hass.data[DOMAIN] = {"sensors": {"alice_test_chore_123": sensor}}

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[0][0][2]
        call = MagicMock()
        call.data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "test-chore_123"}

        await handler(call)

        sensor.set_state.assert_called_once()


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
            frequency=ChoreFrequency.WEEKLY,
            assignees=["bob"],
        )
        chore3 = ChoreConfig(
            name="Laundry",
            slug="laundry",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["alice"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor1 = ChoreSensor(mock_hass, chore1, "alice")
            sensor1.set_state = Mock()
            sensor1._attr_native_value = ChoreState.COMPLETE.value

            sensor2 = ChoreSensor(mock_hass, chore2, "bob")
            sensor2.set_state = Mock()
            sensor2._attr_native_value = ChoreState.COMPLETE.value

            sensor3 = ChoreSensor(mock_hass, chore3, "alice")
            sensor3.set_state = Mock()
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
            frequency=ChoreFrequency.WEEKLY,
            assignees=["bob"],
        )

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_alice = ChoreSensor(mock_hass, chore1, "alice")
            sensor_alice.set_state = Mock()
            sensor_alice._attr_native_value = ChoreState.COMPLETE.value

            sensor_bob = ChoreSensor(mock_hass, chore2, "bob")
            sensor_bob.set_state = Mock()
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
            sensor.set_state = Mock()
            sensor._attr_native_value = ChoreState.PENDING.value

        mock_hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}}

        await async_setup_services(mock_hass)

        handler = mock_hass.services.async_register.call_args_list[3][0][2]

        call = MagicMock()
        call.data = {}

        await handler(call)

        # Sensor should not be reset since it's not COMPLETE
        sensor.set_state.assert_not_called()

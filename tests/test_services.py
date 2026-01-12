"""Tests for simple_chores services."""

from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.simple_chores.const import (
    ATTR_ADJUSTMENT,
    ATTR_CHORE_SLUG,
    ATTR_USER,
    DOMAIN,
    SERVICE_ADJUST_POINTS,
    SERVICE_CREATE_CHORE,
    SERVICE_DELETE_CHORE,
    SERVICE_MARK_COMPLETE,
    SERVICE_MARK_NOT_REQUESTED,
    SERVICE_MARK_PENDING,
    SERVICE_REFRESH_SUMMARY,
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


@pytest.fixture(autouse=True)
async def setup_hass_data(hass):
    """Setup hass.data for all tests in this file."""
    # Ensure DOMAIN data exists
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    yield hass


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
        sensor.set_state = AsyncMock()
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

    @pytest.mark.asyncio
    async def test_setup_services_uses_correct_domain(self, hass) -> None:
        """Test that services are registered with correct domain."""
        await async_setup_services(hass)

        # Verify all services are in the correct domain
        services = hass.services.async_services_for_domain(DOMAIN)
        assert len(services) == 10  # Should have exactly 10 services


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
        mock_sensor.set_state.reset_mock()

        # Execute service
        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_COMPLETE,
            {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"},
            blocking=True,
        )

        # Verify - should be called with COMPLETE (may be called multiple times due to internals)
        mock_sensor.set_state.assert_called_with(ChoreState.COMPLETE)

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
            f"Expected state to be '{ChoreState.COMPLETE.value}' but got '{sensor.native_value}'"
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
        mock_sensor.set_state.reset_mock()

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_PENDING,
            service_data,
            blocking=True,
        )

        mock_sensor.set_state.assert_called_with(ChoreState.PENDING)

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
            f"Expected state to be '{ChoreState.PENDING.value}' but got '{sensor.native_value}'"
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
        mock_sensor.set_state.reset_mock()

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_NOT_REQUESTED,
            service_data,
            blocking=True,
        )

        mock_sensor.set_state.assert_called_with(ChoreState.NOT_REQUESTED)

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
            sensor._attr_native_value = ChoreState.COMPLETE.value

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
            f"Expected state to be '{ChoreState.NOT_REQUESTED.value}' but got '{sensor.native_value}'"
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
            sensor.set_state = AsyncMock()

        # Simulate sensor platform setup storing sensors
        hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}}

        # Setup services
        await async_setup_services(hass)

        # Verify we can call the service
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mock to ignore initialization calls
        sensor.set_state.reset_mock()

        # Call the mark_complete service
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        # Verify sensor state was updated
        sensor.set_state.assert_called_with(ChoreState.COMPLETE)

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
            sensor_alice.set_state = AsyncMock()
            sensor_bob.set_state = AsyncMock()

        hass.data[DOMAIN] = {
            "sensors": {"alice_dishes": sensor_alice, "bob_dishes": sensor_bob}
        }

        await async_setup_services(hass)

        # Call service for alice
        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        # Reset mocks to ignore initialization calls
        sensor_alice.set_state.reset_mock()
        sensor_bob.set_state.reset_mock()

        # Call service for alice
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        # Only alice's sensor should be updated
        sensor_alice.set_state.assert_called_with(ChoreState.COMPLETE)
        sensor_bob.set_state.assert_not_called()

        # Reset and call for bob
        sensor_alice.set_state.reset_mock()
        sensor_bob.set_state.reset_mock()
        service_data = {ATTR_USER: "bob", ATTR_CHORE_SLUG: "dishes"}
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        # Only bob's sensor should be updated
        sensor_alice.set_state.assert_not_called()
        sensor_bob.set_state.assert_called_with(ChoreState.COMPLETE)

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
            sensor.set_state = AsyncMock()

        # Key should be sanitized: hyphens converted to underscores
        hass.data[DOMAIN] = {"sensors": {"alice_test_chore_123": sensor}}

        await async_setup_services(hass)

        service_data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "test-chore_123"}

        # Reset mock to ignore initialization calls
        sensor.set_state.reset_mock()

        # Call the service
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, service_data, blocking=True
        )

        sensor.set_state.assert_called_with(ChoreState.COMPLETE)


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
            sensor_alice._attr_native_value = ChoreState.COMPLETE.value
            sensor_bob = ChoreSensor(hass, chore, "bob")
            sensor_bob.async_write_ha_state = Mock()
            sensor_bob._attr_native_value = ChoreState.PENDING.value

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

        with caplog.at_level("ERROR"):
            with pytest.raises(ServiceValidationError, match="No sensors found"):
                await hass.services.async_call(
                    DOMAIN,
                    SERVICE_MARK_COMPLETE,
                    service_data,
                    blocking=True,
                )

        assert "No sensors found for chore 'nonexistent'" in caplog.text


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
            sensor1.set_state = AsyncMock()
            sensor1._attr_native_value = ChoreState.COMPLETE.value

            sensor2 = ChoreSensor(hass, chore2, "bob")
            sensor2.set_state = AsyncMock()
            sensor2._attr_native_value = ChoreState.COMPLETE.value

            sensor3 = ChoreSensor(hass, chore3, "alice")
            sensor3.set_state = AsyncMock()
            sensor3._attr_native_value = ChoreState.PENDING.value

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

        # Both COMPLETE sensors should be reset
        sensor1.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        sensor2.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        # PENDING sensor should not be touched
        sensor3.set_state.assert_not_called()

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
            sensor_alice.set_state = AsyncMock()
            sensor_alice._attr_native_value = ChoreState.COMPLETE.value

            sensor_bob = ChoreSensor(hass, chore2, "bob")
            sensor_bob.set_state = AsyncMock()
            sensor_bob._attr_native_value = ChoreState.COMPLETE.value

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
        sensor_alice.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        sensor_bob.set_state.assert_not_called()

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
            sensor.set_state = AsyncMock()
            sensor._attr_native_value = ChoreState.PENDING.value

        hass.data[DOMAIN] = {"sensors": {"alice_dishes": sensor}}

        await async_setup_services(hass)

        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_RESET_COMPLETED,
            service_data,
            blocking=True,
        )

        # Sensor should not be reset since it's not COMPLETE
        sensor.set_state.assert_not_called()


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
            sensor_manual.set_state = AsyncMock()
            sensor_manual._attr_native_value = ChoreState.COMPLETE.value

            sensor_daily = ChoreSensor(hass, chore_daily, "alice")
            sensor_daily.set_state = AsyncMock()
            sensor_daily._attr_native_value = ChoreState.COMPLETE.value

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
        sensor_manual.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        # Daily should be reset to PENDING
        sensor_daily.set_state.assert_called_once_with(ChoreState.PENDING)

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
            sensor_alice.set_state = AsyncMock()
            sensor_alice._attr_native_value = ChoreState.COMPLETE.value

            sensor_bob = ChoreSensor(hass, chore2, "bob")
            sensor_bob.set_state = AsyncMock()
            sensor_bob._attr_native_value = ChoreState.COMPLETE.value

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
        sensor_alice.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        sensor_bob.set_state.assert_not_called()

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
            sensor.set_state = AsyncMock()
            sensor._attr_native_value = ChoreState.PENDING.value

        hass.data[DOMAIN] = {"sensors": {"alice_manual_task": sensor}}

        await async_setup_services(hass)

        service_data = {}

        await hass.services.async_call(
            DOMAIN,
            SERVICE_START_NEW_DAY,
            service_data,
            blocking=True,
        )

        # Sensor should not be reset since it's not COMPLETE
        sensor.set_state.assert_not_called()

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
            sensor1.set_state = AsyncMock()
            sensor1._attr_native_value = ChoreState.COMPLETE.value

            sensor2 = ChoreSensor(hass, chore2, "alice")
            sensor2.set_state = AsyncMock()
            sensor2._attr_native_value = ChoreState.PENDING.value

            sensor3 = ChoreSensor(hass, chore3, "alice")
            sensor3.set_state = AsyncMock()
            sensor3._attr_native_value = ChoreState.COMPLETE.value

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
        sensor1.set_state.assert_called_once_with(ChoreState.NOT_REQUESTED)
        # Manual pending should not be reset
        sensor2.set_state.assert_not_called()
        # Daily complete should be reset to PENDING
        sensor3.set_state.assert_called_once_with(ChoreState.PENDING)

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
        # Add points_storage mock
        mock_points_storage = MagicMock()
        mock_points_storage.get_points.return_value = 0
        manager.points_storage = mock_points_storage

        with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
            sensor_manual = ChoreSensor(hass, chore_manual, "alice")
            sensor_manual.async_update_ha_state = AsyncMock()
            sensor_manual._attr_native_value = ChoreState.COMPLETE.value

            sensor_daily = ChoreSensor(hass, chore_daily, "alice")
            sensor_daily.async_update_ha_state = AsyncMock()
            sensor_daily._attr_native_value = ChoreState.COMPLETE.value

        manager.sensors = {
            "alice_manual_task": sensor_manual,
            "alice_daily_task": sensor_daily,
        }

        # Create summary sensor
        summary_sensor = ChoreSummarySensor(hass, "alice", manager)

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
        # Should be called twice: once from set_state, once from _update_summary_sensors
        assert mock_summary.async_update_ha_state.call_count == 2

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
        mock_summary.async_update_ha_state.assert_called_once()

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
        mock_summary.async_update_ha_state.assert_called_once()

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
            sensor._attr_native_value = ChoreState.COMPLETE.value

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

        # Verify summary sensor was updated (once per set_state call)
        mock_summary.async_update_ha_state.assert_called_once()

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
            sensor._attr_native_value = ChoreState.COMPLETE.value

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

        # Verify summary sensor was updated (once per set_state call)
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
        # Each sensor updated twice: once from each sensor's set_state, once from _update_summary_sensors
        assert mock_summary_alice.async_update_ha_state.call_count == 2
        assert mock_summary_bob.async_update_ha_state.call_count == 2


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

"""Edge case tests for simple_chores sensor platform."""

from typing import Any
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from custom_components.simple_chores.config_loader import ConfigLoader
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    SimpleChoresConfig,
)
from custom_components.simple_chores.sensor import (
    ChoreSensor,
    ChoreSensorManager,
)

# Patch async_write_ha_state globally for all ChoreSensor instances
pytestmark = pytest.mark.usefixtures("mock_async_write_ha_state")


@pytest.fixture
def mock_async_write_ha_state() -> Any:
    """Mock async_write_ha_state for ChoreSensor."""
    with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
        yield


@pytest.fixture
def mock_hass() -> MagicMock:
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.async_add_executor_job = AsyncMock(side_effect=lambda func, *args: func(*args))
    # Mock the loop to avoid thread safety checks
    hass.loop = MagicMock()
    return hass


@pytest.fixture
def mock_config_loader(mock_hass: MagicMock) -> MagicMock:
    """Create a mock config loader."""
    loader = MagicMock(spec=ConfigLoader)
    loader.config = SimpleChoresConfig(chores=[])
    loader.register_callback = Mock()
    return loader


class TestSensorStatePersistence:
    """Tests for sensor state persistence edge cases."""

    def test_state_persists_across_sensor_recreation(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that state persists when sensor is recreated."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        # Create first sensor and set state
        sensor1 = ChoreSensor(mock_hass, chore, "alice")
        sensor1.set_state(ChoreState.COMPLETE)

        # Create second sensor with same parameters
        sensor2 = ChoreSensor(mock_hass, chore, "alice")

        # State should be restored
        assert sensor2.native_value == ChoreState.COMPLETE.value

    def test_state_isolated_between_different_assignees(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that state is isolated between different assignees."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        sensor_alice = ChoreSensor(mock_hass, chore, "alice")
        sensor_bob = ChoreSensor(mock_hass, chore, "bob")

        # Set different states
        sensor_alice.set_state(ChoreState.COMPLETE)
        sensor_bob.set_state(ChoreState.PENDING)

        # States should be independent
        assert sensor_alice.native_value == ChoreState.COMPLETE.value
        assert sensor_bob.native_value == ChoreState.PENDING.value

    def test_state_isolated_between_different_chores(
        self, mock_hass: MagicMock
    ) -> None:
        """Test that states are isolated between different chores."""
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
            assignees=["alice"],
        )

        sensor1 = ChoreSensor(mock_hass, chore1, "alice")
        sensor2 = ChoreSensor(mock_hass, chore2, "alice")

        # Set different states
        sensor1.set_state(ChoreState.COMPLETE)
        sensor2.set_state(ChoreState.PENDING)

        # States should be independent
        assert sensor1.native_value == ChoreState.COMPLETE.value
        assert sensor2.native_value == ChoreState.PENDING.value

    def test_state_persistence_with_special_characters_in_slug(
        self, mock_hass: MagicMock
    ) -> None:
        """Test state persistence with special characters in slug."""
        chore = ChoreConfig(
            name="Test Chore",
            slug="test-chore_123",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        sensor1 = ChoreSensor(mock_hass, chore, "alice")
        sensor1.set_state(ChoreState.COMPLETE)

        sensor2 = ChoreSensor(mock_hass, chore, "alice")
        assert sensor2.native_value == ChoreState.COMPLETE.value

    def test_state_persistence_with_special_characters_in_assignee(
        self, mock_hass: MagicMock
    ) -> None:
        """Test state persistence with special characters in assignee."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice.smith"],
        )

        sensor1 = ChoreSensor(mock_hass, chore, "alice.smith")
        sensor1.set_state(ChoreState.COMPLETE)

        sensor2 = ChoreSensor(mock_hass, chore, "alice.smith")
        assert sensor2.native_value == ChoreState.COMPLETE.value


class TestSensorManagerEdgeCases:
    """Edge case tests for ChoreSensorManager."""

    @pytest.mark.asyncio
    async def test_manager_handles_empty_config_after_populated(
        self, mock_hass: MagicMock, mock_config_loader: MagicMock
    ) -> None:
        """Test manager handles transition from populated to empty config."""
        # Start with populated config
        initial_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
            ]
        )
        mock_config_loader.config = initial_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        assert len(manager.sensors) == 1

        # Mock async_remove for sensors
        for sensor in manager.sensors.values():
            sensor.async_remove = AsyncMock()

        # Update to empty config
        empty_config = SimpleChoresConfig(chores=[])
        await manager.async_config_changed(empty_config)

        # All sensors should be removed
        assert len(manager.sensors) == 0

    @pytest.mark.asyncio
    async def test_manager_handles_assignee_addition(
        self, mock_hass: MagicMock, mock_config_loader: MagicMock
    ) -> None:
        """Test adding assignee to existing chore."""
        initial_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
            ]
        )
        mock_config_loader.config = initial_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        assert len(manager.sensors) == 1
        assert "alice_dishes" in manager.sensors

        # Add assignee
        updated_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice", "bob"],
                ),
            ]
        )
        await manager.async_config_changed(updated_config)

        # Should now have 2 sensors
        assert len(manager.sensors) == 2
        assert "alice_dishes" in manager.sensors
        assert "bob_dishes" in manager.sensors

    @pytest.mark.asyncio
    async def test_manager_handles_assignee_removal(
        self, mock_hass: MagicMock, mock_config_loader: MagicMock
    ) -> None:
        """Test manager handles removing assignee from existing chore."""
        initial_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice", "bob"],
                ),
            ]
        )
        mock_config_loader.config = initial_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        assert len(manager.sensors) == 2

        # Mock async_remove
        for sensor in manager.sensors.values():
            sensor.async_remove = AsyncMock()

        # Remove assignee
        updated_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
            ]
        )
        await manager.async_config_changed(updated_config)

        # Should now have 1 sensor
        assert len(manager.sensors) == 1
        assert "alice_dishes" in manager.sensors
        assert "bob_dishes" not in manager.sensors

    @pytest.mark.asyncio
    async def test_manager_handles_chore_slug_change(
        self, mock_hass: MagicMock, mock_config_loader: MagicMock
    ) -> None:
        """Test manager handles chore slug change (creates new sensor)."""
        initial_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
            ]
        )
        mock_config_loader.config = initial_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        assert "alice_dishes" in manager.sensors

        # Mock async_remove
        for sensor in manager.sensors.values():
            sensor.async_remove = AsyncMock()

        # Change slug
        updated_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="do_dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
            ]
        )
        await manager.async_config_changed(updated_config)

        # Old sensor removed, new one created
        assert "alice_dishes" not in manager.sensors
        assert "alice_do_dishes" in manager.sensors

    @pytest.mark.asyncio
    async def test_manager_handles_multiple_simultaneous_changes(
        self, mock_hass: MagicMock, mock_config_loader: MagicMock
    ) -> None:
        """Test manager handles multiple changes at once."""
        initial_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
                ChoreConfig(
                    name="Vacuum",
                    slug="vacuum",
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["bob"],
                ),
            ]
        )
        mock_config_loader.config = initial_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        assert len(manager.sensors) == 2

        # Mock async_remove
        for sensor in manager.sensors.values():
            sensor.async_remove = AsyncMock()

        # Multiple changes: remove one chore, add one, modify one
        updated_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes (Updated)",
                    slug="dishes",
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["alice", "bob"],  # Added assignee
                ),
                ChoreConfig(
                    name="Laundry",
                    slug="laundry",
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["charlie"],
                ),
            ]
        )
        await manager.async_config_changed(updated_config)

        # Should have 3 sensors now
        assert len(manager.sensors) == 3
        assert "alice_dishes" in manager.sensors
        assert "bob_dishes" in manager.sensors
        assert "charlie_laundry" in manager.sensors
        assert "bob_vacuum" not in manager.sensors


class TestSensorIconStates:
    """Tests for sensor icon based on state."""

    def test_icon_changes_with_state(self, mock_hass: MagicMock) -> None:
        """Test that icon changes correctly with state."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        sensor = ChoreSensor(mock_hass, chore, "alice")

        # Initial state
        assert sensor.icon == "mdi:clipboard-list-outline"

        # Set to pending
        sensor.set_state(ChoreState.PENDING)
        assert sensor.icon == "mdi:clipboard-list"

        # Set to complete
        sensor.set_state(ChoreState.COMPLETE)
        assert sensor.icon == "mdi:check-circle"

        # Set back to not requested
        sensor.set_state(ChoreState.NOT_REQUESTED)
        assert sensor.icon == "mdi:clipboard-list-outline"


class TestSensorExtraAttributes:
    """Tests for sensor extra attributes edge cases."""

    def test_attributes_with_empty_description(self, mock_hass: MagicMock) -> None:
        """Test attributes when description is None."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            description="",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        sensor = ChoreSensor(mock_hass, chore, "alice")

        attrs = sensor.extra_state_attributes
        assert attrs["description"] == ""

    def test_attributes_with_single_assignee(self, mock_hass: MagicMock) -> None:
        """Test attributes when there's only one assignee."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        sensor = ChoreSensor(mock_hass, chore, "alice")

        attrs = sensor.extra_state_attributes
        assert attrs["all_assignees"] == ["alice"]
        assert attrs["assignee"] == "alice"

    def test_attributes_with_many_assignees(self, mock_hass: MagicMock) -> None:
        """Test attributes when there are many assignees."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob", "charlie", "dave", "eve"],
        )
        sensor = ChoreSensor(mock_hass, chore, "charlie")

        attrs = sensor.extra_state_attributes
        assert attrs["all_assignees"] == ["alice", "bob", "charlie", "dave", "eve"]
        assert attrs["assignee"] == "charlie"

    def test_attributes_include_all_frequency_types(self, mock_hass: MagicMock) -> None:
        """Test attributes for all frequency types."""
        for frequency in [
            ChoreFrequency.DAILY,
            ChoreFrequency.WEEKLY,
            ChoreFrequency.MANUAL,
        ]:
            chore = ChoreConfig(
                name="Test",
                slug="test",
                frequency=frequency,
                assignees=["alice"],
            )
            sensor = ChoreSensor(mock_hass, chore, "alice")

            attrs = sensor.extra_state_attributes
            assert attrs["frequency"] == frequency.value


class TestSensorRemovalEdgeCases:
    """Tests for edge cases when removing sensors."""

    @pytest.mark.asyncio
    async def test_manager_handles_removing_unregistered_sensor(
        self, mock_hass: MagicMock, mock_config_loader: MagicMock
    ) -> None:
        """Test that manager can remove sensors that were never registered with HA."""
        initial_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice", "bob"],
                ),
            ]
        )
        mock_config_loader.config = initial_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)

        # Create sensors manually without going through async_setup
        # This simulates sensors that exist but aren't properly registered
        for assignee in ["alice", "bob"]:
            sensor = ChoreSensor(mock_hass, initial_config.chores[0], assignee)
            # Deliberately set hass to None to simulate unregistered sensor
            sensor.hass = None
            manager.sensors[f"{assignee}_dishes"] = sensor

        assert len(manager.sensors) == 2

        # Update config to remove all chores - should handle unregistered sensors gracefully
        empty_config = SimpleChoresConfig(chores=[])
        await manager.async_config_changed(empty_config)

        # All sensors should be removed without error
        assert len(manager.sensors) == 0

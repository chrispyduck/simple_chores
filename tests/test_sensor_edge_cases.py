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
def mock_config_loader(hass) -> MagicMock:
    """Create a mock config loader."""
    loader = MagicMock(spec=ConfigLoader)
    loader.config = SimpleChoresConfig(chores=[])
    loader.register_callback = Mock()
    return loader


class TestSensorStatePersistence:
    """Tests for sensor state persistence edge cases."""

    @pytest.mark.asyncio
    async def test_state_persists_across_sensor_recreation(self, hass) -> None:
        """Test that state persists when sensor is recreated."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        # Create first sensor and set state
        sensor1 = ChoreSensor(hass, chore, "alice")
        await sensor1.set_state(ChoreState.COMPLETE)

        # Create mock last state with the saved value
        mock_last_state = MagicMock()
        mock_last_state.state = ChoreState.COMPLETE.value

        # Create second sensor with same parameters
        sensor2 = ChoreSensor(hass, chore, "alice")
        sensor2.async_get_last_state = AsyncMock(return_value=mock_last_state)
        await sensor2.async_added_to_hass()

        # State should be restored
        assert sensor2.native_value == ChoreState.COMPLETE.value

    @pytest.mark.asyncio
    async def test_state_isolated_between_different_assignees(self, hass) -> None:
        """Test that state is isolated between different assignees."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        sensor_alice = ChoreSensor(hass, chore, "alice")
        sensor_bob = ChoreSensor(hass, chore, "bob")

        # Set different states
        await sensor_alice.set_state(ChoreState.COMPLETE)
        await sensor_bob.set_state(ChoreState.PENDING)

        # States should be independent
        assert sensor_alice.native_value == ChoreState.COMPLETE.value
        assert sensor_bob.native_value == ChoreState.PENDING.value

    @pytest.mark.asyncio
    async def test_state_isolated_between_different_chores(self, hass) -> None:
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
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        sensor1 = ChoreSensor(hass, chore1, "alice")
        sensor2 = ChoreSensor(hass, chore2, "alice")

        # Set different states
        await sensor1.set_state(ChoreState.COMPLETE)
        await sensor2.set_state(ChoreState.PENDING)

        # States should be independent
        assert sensor1.native_value == ChoreState.COMPLETE.value
        assert sensor2.native_value == ChoreState.PENDING.value

    @pytest.mark.asyncio
    async def test_state_persistence_with_special_characters_in_slug(
        self, hass
    ) -> None:
        """Test state persistence with special characters in slug."""
        chore = ChoreConfig(
            name="Test Chore",
            slug="test-chore_123",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        sensor1 = ChoreSensor(hass, chore, "alice")
        await sensor1.set_state(ChoreState.COMPLETE)

        # Create mock last state
        mock_last_state = MagicMock()
        mock_last_state.state = ChoreState.COMPLETE.value

        sensor2 = ChoreSensor(hass, chore, "alice")
        sensor2.async_get_last_state = AsyncMock(return_value=mock_last_state)
        await sensor2.async_added_to_hass()

        assert sensor2.native_value == ChoreState.COMPLETE.value

    @pytest.mark.asyncio
    async def test_state_persistence_with_special_characters_in_assignee(
        self, hass
    ) -> None:
        """Test state persistence with special characters in assignee."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice.smith"],
        )

        sensor1 = ChoreSensor(hass, chore, "alice.smith")
        await sensor1.set_state(ChoreState.COMPLETE)

        # Create mock last state
        mock_last_state = MagicMock()
        mock_last_state.state = ChoreState.COMPLETE.value

        sensor2 = ChoreSensor(hass, chore, "alice.smith")
        sensor2.async_get_last_state = AsyncMock(return_value=mock_last_state)
        await sensor2.async_added_to_hass()

        assert sensor2.native_value == ChoreState.COMPLETE.value


class TestSensorManagerEdgeCases:
    """Edge case tests for ChoreSensorManager."""

    @pytest.mark.asyncio
    async def test_manager_handles_empty_config_after_populated(
        self, hass, mock_config_loader: MagicMock
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

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
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
        self, hass, mock_config_loader: MagicMock
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

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
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
        self, hass, mock_config_loader: MagicMock
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

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
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
        self, hass, mock_config_loader: MagicMock
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

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
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
        self, hass, mock_config_loader: MagicMock
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
                    frequency=ChoreFrequency.DAILY,
                    assignees=["bob"],
                ),
            ]
        )
        mock_config_loader.config = initial_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
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
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice", "bob"],  # Added assignee
                ),
                ChoreConfig(
                    name="Laundry",
                    slug="laundry",
                    frequency=ChoreFrequency.DAILY,
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

    @pytest.mark.asyncio
    async def test_icon_changes_with_state(self, hass) -> None:
        """Test that icon is preserved from chore config regardless of state."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        sensor = ChoreSensor(hass, chore, "alice")

        # Initial state - uses default icon from chore
        assert sensor.icon == "mdi:clipboard-list-outline"

        # Set to pending - icon should NOT change
        await sensor.set_state(ChoreState.PENDING)
        assert sensor.icon == "mdi:clipboard-list-outline"

        # Set to complete - icon should NOT change
        await sensor.set_state(ChoreState.COMPLETE)
        assert sensor.icon == "mdi:clipboard-list-outline"

        # Set back to not requested - icon should remain the same
        await sensor.set_state(ChoreState.NOT_REQUESTED)
        assert sensor.icon == "mdi:clipboard-list-outline"


class TestSensorExtraAttributes:
    """Tests for sensor extra attributes edge cases."""

    def test_attributes_with_empty_description(self, hass) -> None:
        """Test attributes when description is None."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            description="",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        sensor = ChoreSensor(hass, chore, "alice")

        attrs = sensor.extra_state_attributes
        assert attrs["description"] == ""

    def test_attributes_with_single_assignee(self, hass) -> None:
        """Test attributes when there's only one assignee."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        sensor = ChoreSensor(hass, chore, "alice")

        attrs = sensor.extra_state_attributes
        assert attrs["all_assignees"] == ["alice"]
        assert attrs["assignee"] == "alice"

    def test_attributes_with_many_assignees(self, hass) -> None:
        """Test attributes when there are many assignees."""
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob", "charlie", "dave", "eve"],
        )
        sensor = ChoreSensor(hass, chore, "charlie")

        attrs = sensor.extra_state_attributes
        assert attrs["all_assignees"] == ["alice", "bob", "charlie", "dave", "eve"]
        assert attrs["assignee"] == "charlie"

    def test_attributes_include_all_frequency_types(self, hass) -> None:
        """Test attributes for all frequency types."""
        for frequency in [
            ChoreFrequency.DAILY,
            ChoreFrequency.MANUAL,
        ]:
            chore = ChoreConfig(
                name="Test",
                slug="test",
                frequency=frequency,
                assignees=["alice"],
            )
            sensor = ChoreSensor(hass, chore, "alice")

            attrs = sensor.extra_state_attributes
            assert attrs["frequency"] == frequency.value


class TestSensorRemovalEdgeCases:
    """Tests for edge cases when removing sensors."""

    @pytest.mark.asyncio
    async def test_manager_handles_removing_unregistered_sensor(
        self, hass, mock_config_loader: MagicMock
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

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)

        # Create sensors manually without going through async_setup
        # This simulates sensors that exist but aren't properly registered
        for assignee in ["alice", "bob"]:
            sensor = ChoreSensor(hass, initial_config.chores[0], assignee)
            # Deliberately set hass to None to simulate unregistered sensor
            sensor.hass = None
            manager.sensors[f"{assignee}_dishes"] = sensor

        assert len(manager.sensors) == 2

        # Update config to remove all chores - should handle unregistered sensors gracefully
        empty_config = SimpleChoresConfig(chores=[])
        await manager.async_config_changed(empty_config)

        # All sensors should be removed without error
        assert len(manager.sensors) == 0

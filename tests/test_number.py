"""Tests for the point-goal number platform."""

from unittest.mock import Mock

import pytest

from custom_components.simple_chores.data import PointsStorage
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    SimpleChoresConfig,
)
from custom_components.simple_chores.number import PointGoalManager, PointGoalNumber


@pytest.fixture
def sample_config() -> SimpleChoresConfig:
    """Create a sample config with two assignees across two chores."""
    return SimpleChoresConfig(
        chores=[
            ChoreConfig(
                name="Dishes",
                slug="dishes",
                frequency=ChoreFrequency.DAILY,
                assignees=["alice", "bob"],
            ),
            ChoreConfig(
                name="Vacuum",
                slug="vacuum",
                frequency=ChoreFrequency.DAILY,
                assignees=["alice"],
            ),
        ]
    )


class TestPointGoalNumber:
    """Tests for the PointGoalNumber entity itself."""

    @pytest.mark.asyncio
    async def test_entity_id_and_unique_id(self, hass) -> None:
        """Test the entity is published under the expected number.* entity_id."""
        storage = PointsStorage(hass)
        await storage.async_load()

        number = PointGoalNumber(hass, "alice", storage)

        assert number.entity_id == "number.simple_chore_meta_alice_point_goal"
        assert number.unique_id == "simple_chores_meta_alice_point_goal"

    @pytest.mark.asyncio
    async def test_defaults_to_zero(self, hass) -> None:
        """Test an assignee with no stored goal starts at 0."""
        storage = PointsStorage(hass)
        await storage.async_load()

        number = PointGoalNumber(hass, "alice", storage)

        assert number.native_value == 0

    @pytest.mark.asyncio
    async def test_restores_previously_set_goal(self, hass) -> None:
        """Test the entity picks up a goal already stored for the assignee."""
        storage = PointsStorage(hass)
        await storage.async_load()
        await storage.set_point_goal("alice", 50)

        number = PointGoalNumber(hass, "alice", storage)

        assert number.native_value == 50

    @pytest.mark.asyncio
    async def test_set_native_value_persists_and_updates(self, hass) -> None:
        """Test setting a new value both updates the entity and persists it."""
        storage = PointsStorage(hass)
        await storage.async_load()
        number = PointGoalNumber(hass, "alice", storage)
        number.async_write_ha_state = Mock()

        await number.async_set_native_value(75)

        assert number.native_value == 75
        assert storage.get_point_goal("alice") == 75
        number.async_write_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_assignee_is_case_insensitive(self, hass) -> None:
        """Test the entity_id/goal lookup is normalized, same as other assignee data."""
        storage = PointsStorage(hass)
        await storage.async_load()
        await storage.set_point_goal("Alice", 20)

        number = PointGoalNumber(hass, "alice", storage)

        assert number.native_value == 20


class TestPointGoalManager:
    """Tests for PointGoalManager's create/remove reconciliation."""

    @pytest.mark.asyncio
    async def test_creates_one_number_per_assignee(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test one entity is created per unique assignee, not per chore."""
        storage = PointsStorage(hass)
        await storage.async_load()
        async_add_entities = Mock()

        manager = PointGoalManager(hass, async_add_entities, storage)
        await manager.async_setup(sample_config)

        assert set(manager.numbers) == {"alice", "bob"}
        async_add_entities.assert_called_once()
        added = list(async_add_entities.call_args[0][0])
        assert len(added) == 2

    @pytest.mark.asyncio
    async def test_config_change_adds_new_assignee(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test a newly-added assignee gets its own number entity."""
        storage = PointsStorage(hass)
        await storage.async_load()
        async_add_entities = Mock()
        manager = PointGoalManager(hass, async_add_entities, storage)
        await manager.async_setup(sample_config)

        sample_config.chores[0].assignees = ["alice", "bob", "carol"]
        await manager.async_config_changed(sample_config)

        assert "carol" in manager.numbers

    @pytest.mark.asyncio
    async def test_config_change_removes_departed_assignee(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test an assignee no longer in config has its number entity removed."""
        storage = PointsStorage(hass)
        await storage.async_load()
        async_add_entities = Mock()
        manager = PointGoalManager(hass, async_add_entities, storage)
        await manager.async_setup(sample_config)

        sample_config.chores[0].assignees = ["alice"]
        sample_config.chores[1].assignees = ["alice"]
        await manager.async_config_changed(sample_config)

        assert "bob" not in manager.numbers
        assert "alice" in manager.numbers

    @pytest.mark.asyncio
    async def test_shares_the_same_points_storage_instance(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test a goal set on one manager's entity is visible via the shared storage."""
        storage = PointsStorage(hass)
        await storage.async_load()
        manager = PointGoalManager(hass, Mock(), storage)
        await manager.async_setup(sample_config)
        manager.numbers["alice"].async_write_ha_state = Mock()

        await manager.numbers["alice"].async_set_native_value(42)

        assert storage.get_point_goal("alice") == 42

"""Tests for simple_chores data structures."""

import asyncio
from dataclasses import is_dataclass
from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest

from custom_components.simple_chores.config_loader import ConfigLoader
from custom_components.simple_chores.data import (
    MAX_HISTORY_ENTRIES,
    HistoryStorage,
    PointsStorage,
    SimpleChoresData,
)


class TestSimpleChoresData:
    """Tests for SimpleChoresData dataclass."""

    def test_data_init(self) -> None:
        """Test SimpleChoresData initialization."""
        mock_hass = MagicMock()
        mock_config_loader = MagicMock(spec=ConfigLoader)

        data = SimpleChoresData(
            config_loader=mock_config_loader,
            hass=mock_hass,
        )

        assert data.config_loader == mock_config_loader
        assert data.hass == mock_hass

    def test_data_is_dataclass(self) -> None:
        """Test that SimpleChoresData is a dataclass."""
        assert is_dataclass(SimpleChoresData)

    def test_data_attributes_accessible(self) -> None:
        """Test that data attributes are accessible."""
        mock_hass = MagicMock()
        mock_config_loader = MagicMock(spec=ConfigLoader)

        data = SimpleChoresData(
            config_loader=mock_config_loader,
            hass=mock_hass,
        )

        # Should be able to access attributes
        assert hasattr(data, "config_loader")
        assert hasattr(data, "hass")

        # Should be able to get attributes
        _ = data.config_loader
        _ = data.hass


class TestPointsStorage:
    """Tests for PointsStorage."""

    @pytest.mark.asyncio
    async def test_points_storage_init(self, hass) -> None:
        """Test PointsStorage initialization."""
        storage = PointsStorage(hass)
        await storage.async_load()

        # Should start with empty points
        assert storage.get_points("alice") == 0
        assert storage.get_all_points() == {}

    @pytest.mark.asyncio
    async def test_add_points(self, hass) -> None:
        """Test adding points to an assignee."""
        storage = PointsStorage(hass)
        await storage.async_load()

        # Add points
        total = await storage.add_points("alice", 10)
        assert total == 10
        assert storage.get_points("alice") == 10

        # Add more points
        total = await storage.add_points("alice", 5)
        assert total == 15
        assert storage.get_points("alice") == 15

    @pytest.mark.asyncio
    async def test_set_points(self, hass) -> None:
        """Test setting points for an assignee."""
        storage = PointsStorage(hass)
        await storage.async_load()

        # Set points
        await storage.set_points("alice", 100)
        assert storage.get_points("alice") == 100

        # Set again (overwrite)
        await storage.set_points("alice", 50)
        assert storage.get_points("alice") == 50

    @pytest.mark.asyncio
    async def test_points_persistence(self, hass) -> None:
        """Test that points persist across storage instances."""
        # First storage instance - add points
        storage1 = PointsStorage(hass)
        await storage1.async_load()
        await storage1.add_points("alice", 10)
        await storage1.add_points("bob", 20)

        # Second storage instance - should load persisted data
        storage2 = PointsStorage(hass)
        await storage2.async_load()
        assert storage2.get_points("alice") == 10
        assert storage2.get_points("bob") == 20

    @pytest.mark.asyncio
    async def test_get_all_points(self, hass) -> None:
        """Test getting all assignee points."""
        storage = PointsStorage(hass)
        await storage.async_load()

        # Add points for multiple assignees
        await storage.add_points("alice", 10)
        await storage.add_points("bob", 20)
        await storage.add_points("charlie", 30)

        all_points = storage.get_all_points()
        assert all_points == {"alice": 10, "bob": 20, "charlie": 30}

    @pytest.mark.asyncio
    async def test_points_for_nonexistent_assignee(self, hass) -> None:
        """Test getting points for an assignee that doesn't exist."""
        storage = PointsStorage(hass)
        await storage.async_load()

        # Should return 0 for nonexistent assignee
        assert storage.get_points("nonexistent") == 0


class TestPointsStoragePrivilegePreBlockState:
    """Tests for PointsStorage's privilege pre-block-state tracking."""

    @pytest.mark.asyncio
    async def test_defaults_to_none(self, hass) -> None:
        """Test that an assignee/privilege with nothing stored returns None."""
        storage = PointsStorage(hass)
        await storage.async_load()

        assert storage.get_privilege_pre_block_state("alice", "extra_dessert") is None

    @pytest.mark.asyncio
    async def test_set_and_get(self, hass) -> None:
        """Test storing and retrieving a pre-block state."""
        storage = PointsStorage(hass)
        await storage.async_load()

        await storage.set_privilege_pre_block_state("alice", "extra_dessert", "Enabled")

        assert (
            storage.get_privilege_pre_block_state("alice", "extra_dessert") == "Enabled"
        )

    @pytest.mark.asyncio
    async def test_set_none_clears_it(self, hass) -> None:
        """Test that setting None clears a previously stored value."""
        storage = PointsStorage(hass)
        await storage.async_load()

        await storage.set_privilege_pre_block_state("alice", "extra_dessert", "Enabled")
        await storage.set_privilege_pre_block_state("alice", "extra_dessert", None)

        assert storage.get_privilege_pre_block_state("alice", "extra_dessert") is None

    @pytest.mark.asyncio
    async def test_persists_across_instances(self, hass) -> None:
        """Test that pre-block state survives a reload, like other privilege data."""
        storage1 = PointsStorage(hass)
        await storage1.async_load()
        await storage1.set_privilege_pre_block_state(
            "alice", "extra_dessert", "Enabled"
        )

        storage2 = PointsStorage(hass)
        await storage2.async_load()

        assert (
            storage2.get_privilege_pre_block_state("alice", "extra_dessert")
            == "Enabled"
        )

    @pytest.mark.asyncio
    async def test_clear_privilege_data_removes_it(self, hass) -> None:
        """Test that clear_privilege_data also clears the pre-block state."""
        storage = PointsStorage(hass)
        await storage.async_load()
        await storage.set_privilege_pre_block_state("alice", "extra_dessert", "Enabled")

        await storage.clear_privilege_data("alice", "extra_dessert")

        assert storage.get_privilege_pre_block_state("alice", "extra_dessert") is None


class TestPointsStoragePrivilegeDisableReason:
    """Tests for PointsStorage's temporary-disable justification tracking."""

    @pytest.mark.asyncio
    async def test_defaults_to_none(self, hass) -> None:
        """Test that an assignee/privilege with nothing stored returns None."""
        storage = PointsStorage(hass)
        await storage.async_load()

        assert storage.get_privilege_disable_reason("alice", "extra_dessert") is None

    @pytest.mark.asyncio
    async def test_set_and_get(self, hass) -> None:
        """Test storing and retrieving a disable reason."""
        storage = PointsStorage(hass)
        await storage.async_load()

        await storage.set_privilege_disable_reason(
            "alice", "extra_dessert", "Didn't finish homework"
        )

        assert (
            storage.get_privilege_disable_reason("alice", "extra_dessert")
            == "Didn't finish homework"
        )

    @pytest.mark.asyncio
    async def test_set_none_clears_it(self, hass) -> None:
        """Test that setting None clears a previously stored value."""
        storage = PointsStorage(hass)
        await storage.async_load()

        await storage.set_privilege_disable_reason("alice", "extra_dessert", "Rude")
        await storage.set_privilege_disable_reason("alice", "extra_dessert", None)

        assert storage.get_privilege_disable_reason("alice", "extra_dessert") is None

    @pytest.mark.asyncio
    async def test_persists_across_instances(self, hass) -> None:
        """Test that the disable reason survives a reload, like other privilege data."""
        storage1 = PointsStorage(hass)
        await storage1.async_load()
        await storage1.set_privilege_disable_reason("alice", "extra_dessert", "Rude")

        storage2 = PointsStorage(hass)
        await storage2.async_load()

        assert storage2.get_privilege_disable_reason("alice", "extra_dessert") == "Rude"

    @pytest.mark.asyncio
    async def test_clear_privilege_data_removes_it(self, hass) -> None:
        """Test that clear_privilege_data also clears the disable reason."""
        storage = PointsStorage(hass)
        await storage.async_load()
        await storage.set_privilege_disable_reason("alice", "extra_dessert", "Rude")

        await storage.clear_privilege_data("alice", "extra_dessert")

        assert storage.get_privilege_disable_reason("alice", "extra_dessert") is None

    @pytest.mark.asyncio
    async def test_key_is_case_insensitive(self, hass) -> None:
        """Test that the assignee key is normalized, same as other privilege maps."""
        storage = PointsStorage(hass)
        await storage.async_load()

        await storage.set_privilege_disable_reason("Alice", "extra_dessert", "Rude")

        assert storage.get_privilege_disable_reason("alice", "extra_dessert") == "Rude"


class TestPointsStoragePointGoal:
    """Tests for PointsStorage's per-assignee point goal (see number.py)."""

    @pytest.mark.asyncio
    async def test_defaults_to_zero(self, hass) -> None:
        """An assignee with nothing stored has a goal of 0."""
        storage = PointsStorage(hass)
        await storage.async_load()

        assert storage.get_point_goal("alice") == 0

    @pytest.mark.asyncio
    async def test_set_and_get(self, hass) -> None:
        """Test storing and retrieving a point goal."""
        storage = PointsStorage(hass)
        await storage.async_load()

        await storage.set_point_goal("alice", 100)

        assert storage.get_point_goal("alice") == 100

    @pytest.mark.asyncio
    async def test_persists_across_instances(self, hass) -> None:
        """Test that a point goal survives a reload, like other stored data."""
        storage1 = PointsStorage(hass)
        await storage1.async_load()
        await storage1.set_point_goal("alice", 100)

        storage2 = PointsStorage(hass)
        await storage2.async_load()

        assert storage2.get_point_goal("alice") == 100

    @pytest.mark.asyncio
    async def test_key_is_case_insensitive(self, hass) -> None:
        """Test the assignee key is normalized, same as the other per-assignee maps."""
        storage = PointsStorage(hass)
        await storage.async_load()

        await storage.set_point_goal("Alice", 100)

        assert storage.get_point_goal("alice") == 100


class TestPointsStorageAsyncLoadIdempotency:
    """
    Tests that async_load() is safe to call more than once.

    The sensor and number platforms both call it on the same shared
    PointsStorage instance during their own setup (see __init__.py), so a
    second call must be a no-op rather than re-reading and clobbering
    whatever's already in memory.
    """

    @pytest.mark.asyncio
    async def test_second_load_does_not_clobber_in_memory_changes(self, hass) -> None:
        """A set_* call between two async_load() calls must survive the second."""
        storage = PointsStorage(hass)
        await storage.async_load()
        await storage.set_points("alice", 100)

        await storage.async_load()

        assert storage.get_points("alice") == 100

    @pytest.mark.asyncio
    async def test_concurrent_loads_on_the_same_instance_dont_race(self, hass) -> None:
        """
        Two concurrent async_load() calls on one shared instance don't race.

        This is exactly what happens in practice: the sensor and number
        platforms' setup both call async_load() on the one PointsStorage
        instance __init__.py hands them (see its async_setup_entry).
        """
        storage = PointsStorage(hass)
        await storage.set_point_goal("alice", 7)  # writes + saves to disk

        reloaded = PointsStorage(hass)
        await asyncio.gather(reloaded.async_load(), reloaded.async_load())

        assert reloaded.get_point_goal("alice") == 7


class TestPointsStorageChoreCompletedAt:
    """Tests for PointsStorage's chore completed-at tracking (auto-finalize)."""

    @pytest.mark.asyncio
    async def test_defaults_to_none(self, hass) -> None:
        """An entity with nothing stored has no tracked completion time."""
        storage = PointsStorage(hass)
        await storage.async_load()

        entity_id = "sensor.simple_chore_alice_dishes"
        assert storage.get_chore_completed_at(entity_id) is None

    @pytest.mark.asyncio
    async def test_set_and_get(self, hass) -> None:
        """Test storing and retrieving a completion time."""
        storage = PointsStorage(hass)
        await storage.async_load()

        entity_id = "sensor.simple_chore_alice_dishes"
        when = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
        await storage.set_chore_completed_at(entity_id, when)

        assert storage.get_chore_completed_at(entity_id) == when

    @pytest.mark.asyncio
    async def test_set_none_clears_it(self, hass) -> None:
        """Test that setting None clears a previously stored completion time."""
        storage = PointsStorage(hass)
        await storage.async_load()

        entity_id = "sensor.simple_chore_alice_dishes"
        await storage.set_chore_completed_at(entity_id, datetime.now(UTC))
        await storage.set_chore_completed_at(entity_id, None)

        assert storage.get_chore_completed_at(entity_id) is None

    @pytest.mark.asyncio
    async def test_persists_across_instances(self, hass) -> None:
        """Test that a completion time survives a reload, like other stored data."""
        entity_id = "sensor.simple_chore_alice_dishes"
        when = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)

        storage1 = PointsStorage(hass)
        await storage1.async_load()
        await storage1.set_chore_completed_at(entity_id, when)

        storage2 = PointsStorage(hass)
        await storage2.async_load()

        assert storage2.get_chore_completed_at(entity_id) == when


class TestHistoryStorage:
    """Tests for HistoryStorage."""

    @pytest.mark.asyncio
    async def test_starts_empty(self, hass) -> None:
        """A fresh HistoryStorage has no entries."""
        storage = HistoryStorage(hass)
        await storage.async_load()

        assert storage.get_entries() == []

    @pytest.mark.asyncio
    async def test_add_entry_returns_and_stores_it(self, hass) -> None:
        """Test that async_add_entry both returns and persists the new entry."""
        storage = HistoryStorage(hass)
        await storage.async_load()

        entry = await storage.async_add_entry(
            action="completed",
            chore_slug="dishes",
            chore_name="Dishes",
            category="kitchen",
            assignee="alice",
            points_delta=10,
            points_total=10,
        )

        assert entry["action"] == "completed"
        assert entry["chore_slug"] == "dishes"
        assert entry["assignee"] == "alice"
        assert entry["points_delta"] == 10
        assert entry["points_total"] == 10
        # Missed-point fields default to zero for entries that miss nothing.
        assert entry["points_missed"] == 0
        assert entry["missed_total"] == 0
        assert entry["id"]
        assert entry["timestamp"]

        assert storage.get_entries() == [entry]

    @pytest.mark.asyncio
    async def test_add_entry_records_missed_points(self, hass) -> None:
        """Test that a missed entry stores its delta and the running tally."""
        storage = HistoryStorage(hass)
        await storage.async_load()

        entry = await storage.async_add_entry(
            action="missed",
            chore_slug="dishes",
            chore_name="Dishes",
            category=None,
            assignee="alice",
            points_delta=0,
            points_total=20,
            points_missed=5,
            missed_total=12,
        )

        assert entry["action"] == "missed"
        assert entry["points_delta"] == 0
        assert entry["points_missed"] == 5
        assert entry["missed_total"] == 12

    @pytest.mark.asyncio
    async def test_entries_are_oldest_first(self, hass) -> None:
        """Test that entries come back in the order they were added."""
        storage = HistoryStorage(hass)
        await storage.async_load()

        await storage.async_add_entry(
            action="completed",
            chore_slug="dishes",
            chore_name="Dishes",
            category=None,
            assignee="alice",
            points_delta=10,
            points_total=10,
        )
        await storage.async_add_entry(
            action="completed",
            chore_slug="trash",
            chore_name="Trash",
            category=None,
            assignee="alice",
            points_delta=5,
            points_total=15,
        )

        entries = storage.get_entries()
        assert [e["chore_slug"] for e in entries] == ["dishes", "trash"]

    @pytest.mark.asyncio
    async def test_evicts_oldest_past_max_entries(self, hass) -> None:
        """Test that adding beyond MAX_HISTORY_ENTRIES drops the oldest first."""
        storage = HistoryStorage(hass)
        await storage.async_load()

        for i in range(MAX_HISTORY_ENTRIES + 5):
            await storage.async_add_entry(
                action="completed",
                chore_slug=f"chore_{i}",
                chore_name=f"Chore {i}",
                category=None,
                assignee="alice",
                points_delta=1,
                points_total=i + 1,
            )

        entries = storage.get_entries()
        assert len(entries) == MAX_HISTORY_ENTRIES
        # The oldest 5 were evicted, so the first entry left is chore_5.
        assert entries[0]["chore_slug"] == "chore_5"
        assert entries[-1]["chore_slug"] == f"chore_{MAX_HISTORY_ENTRIES + 4}"

    @pytest.mark.asyncio
    async def test_async_clear_removes_everything_and_returns_count(self, hass) -> None:
        """Test that async_clear empties the log and reports how many were removed."""
        storage = HistoryStorage(hass)
        await storage.async_load()

        await storage.async_add_entry(
            action="completed",
            chore_slug="dishes",
            chore_name="Dishes",
            category=None,
            assignee="alice",
            points_delta=10,
            points_total=10,
        )
        await storage.async_add_entry(
            action="uncompleted",
            chore_slug="dishes",
            chore_name="Dishes",
            category=None,
            assignee="alice",
            points_delta=-10,
            points_total=0,
        )

        removed = await storage.async_clear()

        assert removed == 2
        assert storage.get_entries() == []

    @pytest.mark.asyncio
    async def test_persists_across_instances(self, hass) -> None:
        """Test that entries survive a reload, like other stored data."""
        storage1 = HistoryStorage(hass)
        await storage1.async_load()
        await storage1.async_add_entry(
            action="completed",
            chore_slug="dishes",
            chore_name="Dishes",
            category="kitchen",
            assignee="alice",
            points_delta=10,
            points_total=10,
        )

        storage2 = HistoryStorage(hass)
        await storage2.async_load()

        entries = storage2.get_entries()
        assert len(entries) == 1
        assert entries[0]["chore_slug"] == "dishes"

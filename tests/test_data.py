"""Tests for simple_chores data structures."""

from dataclasses import is_dataclass
from unittest.mock import MagicMock

import pytest

from custom_components.simple_chores.config_loader import ConfigLoader
from custom_components.simple_chores.data import PointsStorage, SimpleChoresData


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
            storage.get_privilege_pre_block_state("alice", "extra_dessert")
            == "Enabled"
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
        """Test that the pre-block state survives a reload, like other privilege data."""
        storage1 = PointsStorage(hass)
        await storage1.async_load()
        await storage1.set_privilege_pre_block_state("alice", "extra_dessert", "Enabled")

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

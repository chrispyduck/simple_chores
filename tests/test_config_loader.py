"""Tests for simple_chores config_loader."""

import asyncio
from pathlib import Path
from typing import Any, Callable
from unittest.mock import AsyncMock, MagicMock, Mock

import pytest
import yaml

from custom_components.simple_chores.config_loader import (
    ConfigLoader,
    ConfigLoadError,
)
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    SimpleChoresConfig,
)


@pytest.fixture
def mock_hass() -> MagicMock:
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.async_add_executor_job = AsyncMock(side_effect=lambda func, *args: func(*args))
    return hass


@pytest.fixture
def temp_config_file(tmp_path: Path) -> Path:
    """Create a temporary config file."""
    config_path = tmp_path / "simple_chores.yaml"
    return config_path


@pytest.fixture
def valid_config_data() -> dict[str, Any]:
    """Return valid config data."""
    return {
        "chores": [
            {
                "name": "Dishes",
                "slug": "dishes",
                "frequency": "daily",
                "assignees": ["alice"],
            },
            {
                "name": "Vacuum",
                "slug": "vacuum",
                "frequency": "weekly",
                "assignees": ["bob"],
            },
        ]
    }


class TestConfigLoaderInit:
    """Tests for ConfigLoader initialization."""

    def test_init(self, mock_hass: MagicMock, temp_config_file: Path) -> None:
        """Test ConfigLoader initialization."""
        loader = ConfigLoader(mock_hass, temp_config_file)

        assert loader.hass == mock_hass
        assert loader.config_path == temp_config_file
        assert loader._config is None
        assert loader._callbacks == []
        assert loader._watch_task is None
        assert loader._last_mtime is None


class TestConfigLoaderLoad:
    """Tests for ConfigLoader.async_load."""

    @pytest.mark.asyncio
    async def test_load_valid_config(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test loading a valid config file."""
        # Write config file
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        config = await loader.async_load()

        assert config is not None
        assert len(config.chores) == 2
        assert config.chores[0].slug == "dishes"
        assert config.chores[1].slug == "vacuum"
        assert loader._config == config
        assert loader._last_mtime is not None

    @pytest.mark.asyncio
    async def test_load_missing_file(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test loading when config file doesn't exist."""
        loader = ConfigLoader(mock_hass, temp_config_file)
        config = await loader.async_load()

        assert config is not None
        assert len(config.chores) == 0
        assert loader._last_mtime is None

    @pytest.mark.asyncio
    async def test_load_invalid_yaml(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test loading invalid YAML."""
        temp_config_file.write_text("invalid: yaml: content: [")

        loader = ConfigLoader(mock_hass, temp_config_file)

        with pytest.raises(ConfigLoadError) as exc_info:
            await loader.async_load()

        assert "Invalid YAML" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_load_config_with_sanitized_slug(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test loading config where slug gets sanitized."""
        data = {
            "chores": [
                {
                    "name": "Test",
                    "slug": "invalid slug!",  # Will be sanitized to "invalidslug"
                    "frequency": "daily",
                    "assignees": ["alice"],
                }
            ]
        }
        temp_config_file.write_text(yaml.dump(data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Verify slug was sanitized
        assert loader.config.chores[0].slug == "invalidslug"

    @pytest.mark.asyncio
    async def test_load_empty_yaml(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test loading empty YAML file."""
        temp_config_file.write_text("")

        loader = ConfigLoader(mock_hass, temp_config_file)
        config = await loader.async_load()

        assert config is not None
        assert len(config.chores) == 0

    @pytest.mark.asyncio
    async def test_config_property_before_load(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test accessing config property before loading."""
        loader = ConfigLoader(mock_hass, temp_config_file)

        with pytest.raises(ConfigLoadError) as exc_info:
            _ = loader.config

        assert "Configuration not loaded" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_config_property_after_load(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test accessing config property after loading."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        config = loader.config
        assert config is not None
        assert len(config.chores) == 2


class TestConfigLoaderCallbacks:
    """Tests for ConfigLoader callback functionality."""

    @pytest.mark.asyncio
    async def test_register_callback(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test registering a callback."""
        loader = ConfigLoader(mock_hass, temp_config_file)
        callback = Mock()

        loader.register_callback(callback)

        assert callback in loader._callbacks

    @pytest.mark.asyncio
    async def test_notify_callbacks_sync(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test notifying synchronous callbacks."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        callback = Mock()
        loader.register_callback(callback)

        await loader._notify_callbacks()

        callback.assert_called_once()
        assert isinstance(callback.call_args[0][0], SimpleChoresConfig)

    @pytest.mark.asyncio
    async def test_notify_callbacks_async(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test notifying asynchronous callbacks."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        callback = AsyncMock()
        loader.register_callback(callback)

        await loader._notify_callbacks()

        callback.assert_called_once()
        assert isinstance(callback.call_args[0][0], SimpleChoresConfig)

    @pytest.mark.asyncio
    async def test_notify_callbacks_with_exception(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test that callback exceptions are caught and logged."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        failing_callback = Mock(side_effect=Exception("Test error"))
        successful_callback = Mock()

        loader.register_callback(failing_callback)
        loader.register_callback(successful_callback)

        # Should not raise exception
        await loader._notify_callbacks()

        # Both callbacks should be called
        failing_callback.assert_called_once()
        successful_callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_notify_callbacks_before_load(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test notifying callbacks before config is loaded."""
        loader = ConfigLoader(mock_hass, temp_config_file)
        callback = Mock()
        loader.register_callback(callback)

        await loader._notify_callbacks()

        # Callback should not be called if config is None
        callback.assert_not_called()


class TestConfigLoaderFileWatching:
    """Tests for ConfigLoader file watching functionality."""

    @pytest.mark.asyncio
    async def test_check_for_changes_file_modified(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test detecting file changes."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Modify file
        await asyncio.sleep(0.01)  # Ensure mtime is different
        temp_config_file.write_text(yaml.dump(valid_config_data))

        has_changes = await loader._check_for_changes()

        assert has_changes is True

        # Clean up
        await loader.async_stop_watching()

    @pytest.mark.asyncio
    async def test_check_for_changes_no_modification(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test when file hasn't changed."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        has_changes = await loader._check_for_changes()

        assert has_changes is False

    @pytest.mark.asyncio
    async def test_check_for_changes_file_missing(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test checking for changes when file doesn't exist."""
        loader = ConfigLoader(mock_hass, temp_config_file)

        has_changes = await loader._check_for_changes()

        assert has_changes is False

    @pytest.mark.asyncio
    async def test_start_watching(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test starting file watcher."""
        loader = ConfigLoader(mock_hass, temp_config_file)

        await loader.async_start_watching()

        assert loader._watch_task is not None
        assert not loader._watch_task.done()

        # Clean up
        await loader.async_stop_watching()

    @pytest.mark.asyncio
    async def test_start_watching_already_running(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test starting watcher when already running."""
        loader = ConfigLoader(mock_hass, temp_config_file)

        await loader.async_start_watching()
        original_task = loader._watch_task

        await loader.async_start_watching()

        # Should not create a new task
        assert loader._watch_task == original_task

        # Clean up
        await loader.async_stop_watching()

    @pytest.mark.asyncio
    async def test_stop_watching(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test stopping file watcher."""
        loader = ConfigLoader(mock_hass, temp_config_file)

        await loader.async_start_watching()
        assert loader._watch_task is not None

        await loader.async_stop_watching()

        assert loader._watch_task is None

    @pytest.mark.asyncio
    async def test_stop_watching_not_running(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test stopping watcher when not running."""
        loader = ConfigLoader(mock_hass, temp_config_file)

        # Should not raise exception
        await loader.async_stop_watching()

        assert loader._watch_task is None

    @pytest.mark.asyncio
    async def test_watch_file_detects_changes(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test that file watcher detects and processes changes."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        callback = Mock()
        loader.register_callback(callback)

        await loader.async_start_watching()

        # Modify config
        modified_data = valid_config_data.copy()
        modified_data["chores"].append(
            {
                "name": "Laundry",
                "slug": "laundry",
                "frequency": "weekly",
                "assignees": ["charlie"],
            }
        )

        await asyncio.sleep(0.1)
        temp_config_file.write_text(yaml.dump(modified_data))

        # Wait for watcher to detect change (max 6 seconds)
        try:
            for _ in range(12):
                await asyncio.sleep(0.5)
                if callback.called:
                    break

            # Callback should have been called with updated config
            assert callback.called
            if callback.called:
                updated_config = callback.call_args[0][0]
                assert len(updated_config.chores) == 3
        finally:
            await loader.async_stop_watching()

    @pytest.mark.asyncio
    async def test_watch_file_no_notify_if_config_unchanged(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test that callbacks aren't notified if config content is same."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        callback = Mock()
        loader.register_callback(callback)

        await loader.async_start_watching()

        # Write same content (different mtime but same data)
        await asyncio.sleep(0.1)
        temp_config_file.write_text(yaml.dump(valid_config_data))

        # Wait a bit
        await asyncio.sleep(6)

        try:
            # Callback should not be called since config didn't actually change
            assert not callback.called
        finally:
            await loader.async_stop_watching()


class TestConfigLoaderCreateChore:
    """Tests for creating chores via ConfigLoader."""

    @pytest.mark.asyncio
    async def test_create_chore_success(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test creating a new chore successfully."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Create new chore with enum frequency
        new_chore = ChoreConfig(
            name="Take Out Trash",
            slug="take_out_trash",
            description="Take the trash to the curb",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["alice", "bob"],
        )

        await loader.async_create_chore(new_chore)

        # Verify file was saved correctly
        saved_data = yaml.safe_load(temp_config_file.read_text())
        assert len(saved_data["chores"]) == 3

        # Find the new chore
        trash_chore = next(
            c for c in saved_data["chores"] if c["slug"] == "take_out_trash"
        )
        assert trash_chore["name"] == "Take Out Trash"
        assert trash_chore["frequency"] == "weekly"  # Should be serialized as string
        assert trash_chore["assignees"] == ["alice", "bob"]

    @pytest.mark.asyncio
    async def test_create_chore_with_manual_frequency(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test creating a chore with manual frequency (the problematic enum value)."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Create chore with MANUAL frequency (this was failing before)
        new_chore = ChoreConfig(
            name="Seasonal Task",
            slug="seasonal_task",
            frequency=ChoreFrequency.MANUAL,
            assignees=["charlie"],
        )

        # This should not raise an error
        await loader.async_create_chore(new_chore)

        # Verify file was saved correctly with string value
        saved_data = yaml.safe_load(temp_config_file.read_text())
        seasonal = next(c for c in saved_data["chores"] if c["slug"] == "seasonal_task")
        assert seasonal["frequency"] == "manual"  # Must be string, not enum object

    @pytest.mark.asyncio
    async def test_create_chore_duplicate_slug(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test creating a chore with duplicate slug fails."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Try to create chore with existing slug
        duplicate_chore = ChoreConfig(
            name="Another Dishes",
            slug="dishes",  # This already exists
            frequency=ChoreFrequency.DAILY,
            assignees=["charlie"],
        )

        with pytest.raises(ConfigLoadError, match="already exists"):
            await loader.async_create_chore(duplicate_chore)

    @pytest.mark.asyncio
    async def test_create_chore_with_custom_icon(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test creating a chore with custom icon."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Create chore with custom icon
        new_chore = ChoreConfig(
            name="Clean Kitchen",
            slug="clean_kitchen",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            icon="mdi:broom",
        )

        await loader.async_create_chore(new_chore)

        # Verify icon was saved correctly
        saved_data = yaml.safe_load(temp_config_file.read_text())
        kitchen_chore = next(
            c for c in saved_data["chores"] if c["slug"] == "clean_kitchen"
        )
        assert kitchen_chore["icon"] == "mdi:broom"

        # Verify it loads back correctly
        await loader.async_load()
        chore = loader.config.get_chore_by_slug("clean_kitchen")
        assert chore is not None
        assert chore.icon == "mdi:broom"


class TestConfigLoaderUpdateChore:
    """Tests for the async_update_chore method."""

    @pytest.mark.asyncio
    async def test_update_chore_name(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test updating a chore's name."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Update chore name
        await loader.async_update_chore(slug="dishes", name="Do The Dishes")

        # Verify name was updated
        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.name == "Do The Dishes"

        # Verify it was saved
        saved_data = yaml.safe_load(temp_config_file.read_text())
        dishes_chore = next(c for c in saved_data["chores"] if c["slug"] == "dishes")
        assert dishes_chore["name"] == "Do The Dishes"

    @pytest.mark.asyncio
    async def test_update_chore_icon(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test updating a chore's icon."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Update chore icon
        await loader.async_update_chore(slug="dishes", icon="mdi:dishwasher")

        # Verify icon was updated
        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.icon == "mdi:dishwasher"

        # Verify it was saved
        saved_data = yaml.safe_load(temp_config_file.read_text())
        dishes_chore = next(c for c in saved_data["chores"] if c["slug"] == "dishes")
        assert dishes_chore["icon"] == "mdi:dishwasher"

    @pytest.mark.asyncio
    async def test_update_chore_multiple_fields(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test updating multiple chore fields at once."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        # Update multiple fields
        await loader.async_update_chore(
            slug="dishes",
            name="Clean Dishes",
            description="Wash all dishes and put them away",
            icon="mdi:dishwasher",
        )

        # Verify all fields were updated
        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.name == "Clean Dishes"
        assert chore.description == "Wash all dishes and put them away"
        assert chore.icon == "mdi:dishwasher"

    @pytest.mark.asyncio
    async def test_update_chore_not_found(
        self,
        mock_hass: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test updating a non-existent chore fails."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        with pytest.raises(ConfigLoadError, match="not found"):
            await loader.async_update_chore(slug="nonexistent", name="New Name")

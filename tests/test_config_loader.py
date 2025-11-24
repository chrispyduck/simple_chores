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
    async def test_load_invalid_config_schema(
        self, mock_hass: MagicMock, temp_config_file: Path
    ) -> None:
        """Test loading config with invalid schema."""
        invalid_data = {
            "chores": [
                {
                    "name": "Test",
                    "slug": "invalid slug!",  # Invalid characters
                    "frequency": "daily",
                    "assignees": ["alice"],
                }
            ]
        }
        temp_config_file.write_text(yaml.dump(invalid_data))

        loader = ConfigLoader(mock_hass, temp_config_file)

        with pytest.raises(ConfigLoadError) as exc_info:
            await loader.async_load()

        assert "Invalid configuration" in str(exc_info.value)

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

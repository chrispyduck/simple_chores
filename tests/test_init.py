"""Tests for simple_chores __init__.py."""

from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
import yaml

from custom_components.simple_chores import (
    async_reload_entry,
    async_setup,
    async_setup_entry,
    async_unload_entry,
)
from custom_components.simple_chores.config_loader import ConfigLoadError


@pytest.fixture
def hass() -> MagicMock:
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.config.path = Mock(return_value="/config")
    hass.helpers.discovery.async_load_platform = AsyncMock()
    hass.config_entries.async_reload = AsyncMock()
    hass.config_entries.async_forward_entry_setups = AsyncMock(return_value=True)
    hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)
    hass.config_entries.async_entries = Mock(return_value=[])
    hass.async_add_executor_job = AsyncMock(side_effect=lambda func, *args: func(*args))
    return hass


@pytest.fixture
def mock_config_loader() -> MagicMock:
    """Create a mock config loader."""
    loader = MagicMock()
    loader.async_load = AsyncMock()
    loader.async_start_watching = AsyncMock()
    loader.async_stop_watching = AsyncMock()
    return loader


@pytest.fixture
def mock_config_entry() -> MagicMock:
    """Create a mock config entry."""
    entry = MagicMock()
    entry.entry_id = "test_entry_id"
    return entry


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
        ]
    }


class TestAsyncSetup:
    """Tests for async_setup."""

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_success(
        self,
        mock_loader_class: MagicMock,
        hass,
        mock_config_loader: MagicMock,
    ) -> None:
        """Test successful setup."""
        mock_loader_class.return_value = mock_config_loader

        result = await async_setup(hass, {})

        assert result is True
        assert "simple_chores" in hass.data
        assert hass.data["simple_chores"]["config_loader"] == mock_config_loader

        # Verify config loader was created with correct path
        mock_loader_class.assert_called_once()
        call_args = mock_loader_class.call_args
        assert call_args[0][0] == hass
        assert isinstance(call_args[0][1], Path)
        assert str(call_args[0][1]).endswith("simple_chores.yaml")

        # Verify config was loaded
        mock_config_loader.async_load.assert_called_once()

        # Verify watcher was started
        mock_config_loader.async_start_watching.assert_called_once()

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.async_setup_platform")
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_with_sensor_platform(
        self,
        mock_loader_class: MagicMock,
        mock_sensor_setup: MagicMock,
        hass,
        mock_config_loader: MagicMock,
    ) -> None:
        """Test setup loads sensor platform."""
        mock_loader_class.return_value = mock_config_loader

        result = await async_setup(hass, {})

        assert result is True
        # Verify sensor platform setup was called
        mock_sensor_setup.assert_called_once()
        call_args = mock_sensor_setup.call_args
        assert call_args[0][0] == hass
        assert call_args[0][1] == {}
        assert callable(call_args[0][2])  # add_entities callback
        assert call_args[0][3] is None  # discovery_info

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_config_load_error(
        self,
        mock_loader_class: MagicMock,
        hass,
        mock_config_loader: MagicMock,
    ) -> None:
        """Test setup when config loading fails."""
        mock_config_loader.async_load.side_effect = ConfigLoadError("Test error")
        mock_loader_class.return_value = mock_config_loader

        result = await async_setup(hass, {})

        assert result is False

        # Should not start watcher or load platform
        mock_config_loader.async_start_watching.assert_not_called()
        hass.helpers.discovery.async_load_platform.assert_not_called()

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_initializes_hass_data(
        self,
        mock_loader_class: MagicMock,
        hass,
        mock_config_loader: MagicMock,
    ) -> None:
        """Test that setup initializes hass.data correctly."""
        mock_loader_class.return_value = mock_config_loader

        # Pre-populate hass.data with other data
        hass.data["other_integration"] = {"key": "value"}

        result = await async_setup(hass, {})

        assert result is True
        # Should preserve existing data
        assert "other_integration" in hass.data
        # Should add simple_chores data
        assert "simple_chores" in hass.data

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_config_path(
        self,
        mock_loader_class: MagicMock,
        hass,
        mock_config_loader: MagicMock,
    ) -> None:
        """Test that setup uses correct config path."""
        mock_loader_class.return_value = mock_config_loader
        hass.config.path = Mock(return_value="/custom/path")

        await async_setup(hass, {})

        call_args = mock_loader_class.call_args
        config_path = call_args[0][1]
        assert str(config_path) == "/custom/path/simple_chores.yaml"


class TestAsyncSetupEntry:
    """Tests for async_setup_entry."""

    @pytest.mark.asyncio
    async def test_setup_entry_success(
        self,
        hass,
        mock_config_entry: MagicMock,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test successful entry setup."""
        # Create config file
        temp_config_file.write_text(yaml.dump(valid_config_data))

        # Mock the config path
        hass.config.path = MagicMock(return_value=str(temp_config_file.parent))

        # Mock the forward entry setups
        hass.config_entries.async_forward_entry_setups = AsyncMock(
            return_value=True
        )

        result = await async_setup_entry(hass, mock_config_entry)

        assert result is True
        assert "simple_chores" in hass.data
        assert "config_loader" in hass.data["simple_chores"]

        # Clean up
        await hass.data["simple_chores"]["config_loader"].async_stop_watching()

    @pytest.mark.asyncio
    async def test_setup_entry_config_load_error(
        self, hass, mock_config_entry: MagicMock
    ) -> None:
        """Test setup entry with config load error."""
        # Mock config path to non-existent file with invalid content
        hass.config.path = MagicMock(return_value="/nonexistent")

        # This should handle the error gracefully
        with patch(
            "custom_components.simple_chores.ConfigLoader.async_load",
            side_effect=ConfigLoadError("Test error"),
        ):
            result = await async_setup_entry(hass, mock_config_entry)

        assert result is False


class TestAsyncUnloadEntry:
    """Tests for async_unload_entry."""

    @pytest.mark.asyncio
    async def test_unload_entry_success(
        self,
        hass,
        mock_config_entry: MagicMock,
        mock_config_loader: MagicMock,
    ) -> None:
        """Test successful unload."""
        hass.data["simple_chores"] = {"config_loader": mock_config_loader}

        result = await async_unload_entry(hass, mock_config_entry)

        assert result is True
        mock_config_loader.async_stop_watching.assert_called_once()

    @pytest.mark.asyncio
    async def test_unload_entry_no_data(
        self, hass, mock_config_entry: MagicMock
    ) -> None:
        """Test unload when no data exists."""
        result = await async_unload_entry(hass, mock_config_entry)

        assert result is True

    @pytest.mark.asyncio
    async def test_unload_entry_no_config_loader(
        self, hass, mock_config_entry: MagicMock
    ) -> None:
        """Test unload when config_loader doesn't exist."""
        hass.data["simple_chores"] = {}

        result = await async_unload_entry(hass, mock_config_entry)

        assert result is True


class TestAsyncReloadEntry:
    """Tests for async_reload_entry."""

    @pytest.mark.asyncio
    async def test_reload_entry(
        self, hass, mock_config_entry: MagicMock
    ) -> None:
        """Test reload entry."""
        await async_reload_entry(hass, mock_config_entry)

        hass.config_entries.async_reload.assert_called_once_with("test_entry_id")

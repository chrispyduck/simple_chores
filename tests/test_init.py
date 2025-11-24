"""Tests for simple_chores __init__."""

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from custom_components.simple_chores import (
    async_reload_entry,
    async_setup,
    async_setup_entry,
    async_unload_entry,
)
from custom_components.simple_chores.config_loader import ConfigLoadError


@pytest.fixture
def mock_hass():
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.config.path = Mock(return_value="/config")
    hass.helpers.discovery.async_load_platform = AsyncMock()
    hass.config_entries.async_reload = AsyncMock()
    return hass


@pytest.fixture
def mock_config_loader():
    """Create a mock config loader."""
    loader = MagicMock()
    loader.async_load = AsyncMock()
    loader.async_start_watching = AsyncMock()
    loader.async_stop_watching = AsyncMock()
    return loader


@pytest.fixture
def mock_config_entry():
    """Create a mock config entry."""
    entry = MagicMock()
    entry.entry_id = "test_entry_id"
    return entry


class TestAsyncSetup:
    """Tests for async_setup."""

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_success(
        self, mock_loader_class, mock_hass, mock_config_loader
    ):
        """Test successful setup."""
        mock_loader_class.return_value = mock_config_loader

        result = await async_setup(mock_hass, {})

        assert result is True
        assert "simple_chores" in mock_hass.data
        assert mock_hass.data["simple_chores"]["config_loader"] == mock_config_loader

        # Verify config loader was created with correct path
        mock_loader_class.assert_called_once()
        call_args = mock_loader_class.call_args
        assert call_args[0][0] == mock_hass
        assert isinstance(call_args[0][1], Path)
        assert str(call_args[0][1]).endswith("simple_chores.yaml")

        # Verify config was loaded
        mock_config_loader.async_load.assert_called_once()

        # Verify watcher was started
        mock_config_loader.async_start_watching.assert_called_once()

        # Verify sensor platform was loaded
        mock_hass.helpers.discovery.async_load_platform.assert_called_once_with(
            "sensor", "simple_chores", {}, {}
        )

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_config_load_error(
        self, mock_loader_class, mock_hass, mock_config_loader
    ):
        """Test setup when config loading fails."""
        mock_config_loader.async_load.side_effect = ConfigLoadError("Test error")
        mock_loader_class.return_value = mock_config_loader

        result = await async_setup(mock_hass, {})

        assert result is False

        # Should not start watcher or load platform
        mock_config_loader.async_start_watching.assert_not_called()
        mock_hass.helpers.discovery.async_load_platform.assert_not_called()

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_initializes_hass_data(
        self, mock_loader_class, mock_hass, mock_config_loader
    ):
        """Test that setup initializes hass.data correctly."""
        mock_loader_class.return_value = mock_config_loader

        # Pre-populate hass.data with other data
        mock_hass.data["other_integration"] = {"key": "value"}

        result = await async_setup(mock_hass, {})

        assert result is True
        # Should preserve existing data
        assert "other_integration" in mock_hass.data
        # Should add simple_chores data
        assert "simple_chores" in mock_hass.data

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_setup_config_path(
        self, mock_loader_class, mock_hass, mock_config_loader
    ):
        """Test that setup uses correct config path."""
        mock_loader_class.return_value = mock_config_loader
        mock_hass.config.path = Mock(return_value="/custom/path")

        await async_setup(mock_hass, {})

        call_args = mock_loader_class.call_args
        config_path = call_args[0][1]
        assert str(config_path) == "/custom/path/simple_chores.yaml"


class TestAsyncSetupEntry:
    """Tests for async_setup_entry."""

    @pytest.mark.asyncio
    async def test_setup_entry_not_supported(self, mock_hass, mock_config_entry):
        """Test that UI-based setup returns False."""
        result = await async_setup_entry(mock_hass, mock_config_entry)

        assert result is False


class TestAsyncUnloadEntry:
    """Tests for async_unload_entry."""

    @pytest.mark.asyncio
    async def test_unload_entry_success(
        self, mock_hass, mock_config_entry, mock_config_loader
    ):
        """Test successful unload."""
        mock_hass.data["simple_chores"] = {"config_loader": mock_config_loader}

        result = await async_unload_entry(mock_hass, mock_config_entry)

        assert result is True
        mock_config_loader.async_stop_watching.assert_called_once()

    @pytest.mark.asyncio
    async def test_unload_entry_no_data(self, mock_hass, mock_config_entry):
        """Test unload when no data exists."""
        result = await async_unload_entry(mock_hass, mock_config_entry)

        assert result is True

    @pytest.mark.asyncio
    async def test_unload_entry_no_config_loader(self, mock_hass, mock_config_entry):
        """Test unload when config_loader doesn't exist."""
        mock_hass.data["simple_chores"] = {}

        result = await async_unload_entry(mock_hass, mock_config_entry)

        assert result is True


class TestAsyncReloadEntry:
    """Tests for async_reload_entry."""

    @pytest.mark.asyncio
    async def test_reload_entry(self, mock_hass, mock_config_entry):
        """Test reload entry."""
        await async_reload_entry(mock_hass, mock_config_entry)

        mock_hass.config_entries.async_reload.assert_called_once_with("test_entry_id")

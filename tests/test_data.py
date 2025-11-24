"""Tests for simple_chores data structures."""

from unittest.mock import MagicMock

from custom_components.simple_chores.config_loader import ConfigLoader
from custom_components.simple_chores.data import SimpleChoresData


class TestSimpleChoresData:
    """Tests for SimpleChoresData dataclass."""

    def test_data_init(self):
        """Test SimpleChoresData initialization."""
        mock_hass = MagicMock()
        mock_config_loader = MagicMock(spec=ConfigLoader)

        data = SimpleChoresData(
            config_loader=mock_config_loader,
            hass=mock_hass,
        )

        assert data.config_loader == mock_config_loader
        assert data.hass == mock_hass

    def test_data_is_dataclass(self):
        """Test that SimpleChoresData is a dataclass."""
        from dataclasses import is_dataclass

        assert is_dataclass(SimpleChoresData)

    def test_data_attributes_accessible(self):
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

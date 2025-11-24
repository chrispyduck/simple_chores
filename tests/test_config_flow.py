"""Test the Simple Chores config flow."""

from unittest.mock import MagicMock

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.simple_chores.config_flow import SimpleChoresConfigFlow
from custom_components.simple_chores.const import DOMAIN


class TestConfigFlow:
    """Test the config flow."""

    @pytest.mark.asyncio
    async def test_user_flow_success(self, hass: HomeAssistant):
        """Test successful user flow."""
        flow = SimpleChoresConfigFlow()
        flow.hass = hass

        result = await flow.async_step_user()
        assert result["type"] == FlowResultType.FORM
        assert result["step_id"] == "user"

        # Submit the form
        result2 = await flow.async_step_user({})
        assert result2["type"] == FlowResultType.CREATE_ENTRY
        assert result2["title"] == "Simple Chores"
        assert result2["data"] == {}

    @pytest.mark.asyncio
    async def test_user_flow_single_instance(self, hass: HomeAssistant):
        """Test that only one instance is allowed."""
        flow = SimpleChoresConfigFlow()
        flow.hass = hass

        # Mock existing entry
        flow._async_current_entries = MagicMock(return_value=[MagicMock()])

        result = await flow.async_step_user()
        assert result["type"] == FlowResultType.ABORT
        assert result["reason"] == "single_instance_allowed"

    @pytest.mark.asyncio
    async def test_options_flow(self, hass: HomeAssistant):
        """Test the options flow."""
        from custom_components.simple_chores.config_flow import (
            SimpleChoresOptionsFlow,
        )

        # Create a config entry
        entry = MagicMock()
        entry.domain = DOMAIN
        entry.entry_id = "test_entry"

        flow = SimpleChoresOptionsFlow(entry)
        flow.hass = hass

        result = await flow.async_step_init()
        assert result["type"] == FlowResultType.FORM
        assert result["step_id"] == "init"

        # Submit the form
        result2 = await flow.async_step_init({})
        assert result2["type"] == FlowResultType.CREATE_ENTRY


class TestConfigFlowUI:
    """Test the config flow UI elements."""

    @pytest.mark.asyncio
    async def test_config_file_path_shown(self, hass: HomeAssistant):
        """Test that config file path is shown in description."""
        flow = SimpleChoresConfigFlow()
        flow.hass = hass

        result = await flow.async_step_user()
        assert "config_file" in result.get("description_placeholders", {})

    @pytest.mark.asyncio
    async def test_options_shows_config_file_path(self, hass: HomeAssistant):
        """Test that options flow shows config file path."""
        from custom_components.simple_chores.config_flow import (
            SimpleChoresOptionsFlow,
        )

        entry = MagicMock()
        entry.domain = DOMAIN
        entry.entry_id = "test_entry"

        flow = SimpleChoresOptionsFlow(entry)
        flow.hass = hass

        result = await flow.async_step_init()
        assert "config_file" in result.get("description_placeholders", {})

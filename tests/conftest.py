"""Shared fixtures for simple_chores tests."""

import pytest


@pytest.fixture
def mock_hass():
    """
    Create a mock Home Assistant instance.

    This is a shared fixture that can be imported by test modules.
    Individual test modules may also define their own mock_hass with
    specific requirements.
    """
    from unittest.mock import AsyncMock, MagicMock

    hass = MagicMock()
    hass.data = {}
    hass.config.path = lambda: "/config"
    hass.async_add_executor_job = AsyncMock(side_effect=lambda func, *args: func(*args))
    return hass

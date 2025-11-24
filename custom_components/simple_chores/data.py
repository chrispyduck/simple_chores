"""Custom types for simple_chores."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .config_loader import ConfigLoader


@dataclass
class SimpleChoresData:
    """Data for the Simple Chores integration."""

    config_loader: ConfigLoader
    hass: HomeAssistant

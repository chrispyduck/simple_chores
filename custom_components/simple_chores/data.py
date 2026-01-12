"""Custom types for simple_chores."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from homeassistant.helpers.storage import Store

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .config_loader import ConfigLoader

STORAGE_VERSION = 1
STORAGE_KEY = "simple_chores.points"


@dataclass
class SimpleChoresData:
    """Data for the Simple Chores integration."""

    config_loader: ConfigLoader
    hass: HomeAssistant


class PointsStorage:
    """Storage for assignee points."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize points storage."""
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, int] = {}

    async def async_load(self) -> None:
        """Load points from storage."""
        data = await self._store.async_load()
        if data:
            self._data = data.get("points", {})

    async def async_save(self) -> None:
        """Save points to storage."""
        await self._store.async_save({"points": self._data})

    def get_points(self, assignee: str) -> int:
        """Get points for an assignee."""
        return self._data.get(assignee, 0)

    async def add_points(self, assignee: str, points: int) -> int:
        """Add points to an assignee and return new total."""
        current = self._data.get(assignee, 0)
        new_total = current + points
        self._data[assignee] = new_total
        await self.async_save()
        return new_total

    async def set_points(self, assignee: str, points: int) -> None:
        """Set points for an assignee."""
        self._data[assignee] = points
        await self.async_save()

    def get_all_points(self) -> dict[str, int]:
        """Get all assignee points."""
        return dict(self._data)

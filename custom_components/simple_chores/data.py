"""Custom types for simple_chores."""

from __future__ import annotations

from dataclasses import dataclass
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
        self._points_earned: dict[str, int] = {}
        self._points_missed: dict[str, int] = {}
        self._points_possible: dict[str, int] = {}

    async def async_load(self) -> None:
        """Load points from storage."""
        data = await self._store.async_load()
        if data:
            self._data = data.get("points", {})
            self._points_earned = data.get("points_earned", {})
            self._points_missed = data.get("points_missed", {})
            self._points_possible = data.get("points_possible", {})

    async def async_save(self) -> None:
        """Save points to storage."""
        await self._store.async_save(
            {
                "points": self._data,
                "points_earned": self._points_earned,
                "points_missed": self._points_missed,
                "points_possible": self._points_possible,
            }
        )

    def get_points(self, assignee: str) -> int:
        """Get points for an assignee."""
        return self._data.get(assignee, 0)

    async def add_points(self, assignee: str, points: int) -> int:
        """Add points to total_points for an assignee and return new total."""
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

    def get_points_earned(self, assignee: str) -> int:
        """Get points earned for an assignee (resets with reset_points)."""
        return self._points_earned.get(assignee, 0)

    async def add_points_earned(self, assignee: str, points: int) -> int:
        """Add points to earned total and return new total."""
        current = self._points_earned.get(assignee, 0)
        new_total = current + points
        self._points_earned[assignee] = new_total
        await self.async_save()
        return new_total

    async def set_points_earned(self, assignee: str, points: int) -> None:
        """Set points earned for an assignee."""
        self._points_earned[assignee] = points
        await self.async_save()

    def get_points_missed(self, assignee: str) -> int:
        """Get cumulative points missed for an assignee."""
        return self._points_missed.get(assignee, 0)

    def get_points_possible(self, assignee: str) -> int:
        """Get points possible for an assignee (deprecated - calculated dynamically)."""
        return self._points_possible.get(assignee, 0)

    async def add_points_missed(self, assignee: str, points: int) -> None:
        """Add to cumulative points missed for an assignee."""
        current = self._points_missed.get(assignee, 0)
        self._points_missed[assignee] = current + points
        await self.async_save()

    async def set_points_missed(self, assignee: str, points: int) -> None:
        """Set cumulative points missed for an assignee (used by reset_points)."""
        self._points_missed[assignee] = points
        await self.async_save()

    async def set_daily_stats(
        self, assignee: str, points_missed: int, points_possible: int
    ) -> None:
        """Set daily stats for an assignee (deprecated - use add_points_missed)."""
        self._points_missed[assignee] = points_missed
        self._points_possible[assignee] = points_possible
        await self.async_save()

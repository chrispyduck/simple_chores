"""Custom types for simple_chores."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from homeassistant.helpers.storage import Store

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .config_loader import ConfigLoader

STORAGE_VERSION = 1
STORAGE_KEY = "simple_chores.points"

HISTORY_STORAGE_VERSION = 1
HISTORY_STORAGE_KEY = "simple_chores.history"

# Hard cap on stored audit-log entries. This is meant to be a household's
# day-to-day chore history, not indefinite bookkeeping - once it's exceeded,
# the oldest entries are evicted first so both the storage file and the
# get_history service response stay bounded.
MAX_HISTORY_ENTRIES = 500


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
        # Privilege state storage: {assignee: {privilege_slug: state_value}}
        self._privilege_states: dict[str, dict[str, str]] = {}
        # Temporary disable end times: {assignee: {privilege_slug: ISO timestamp}}
        self._privilege_disable_until: dict[str, dict[str, str]] = {}
        # Pre-block state: {assignee: {privilege_slug: state_value}}. The
        # state a manual-behavior privilege was in immediately before a
        # temporary disable started, so ending the block can restore it
        # instead of always falling back to Disabled.
        self._privilege_pre_block_state: dict[str, dict[str, str]] = {}
        # When each chore sensor most recently became Complete, keyed by its
        # entity_id: {entity_id: ISO timestamp}. Durable record backing
        # auto-finalize, so a HA restart (or a missed timer while HA was
        # down) can still finalize a chore at the right time instead of
        # losing track of it - see services.py's auto-finalize helpers.
        self._chore_completed_at: dict[str, str] = {}

    async def async_load(self) -> None:
        """Load points from storage."""
        data = await self._store.async_load()
        if data:
            self._data = data.get("points", {})
            self._points_earned = data.get("points_earned", {})
            self._points_missed = data.get("points_missed", {})
            self._points_possible = data.get("points_possible", {})
            self._privilege_states = data.get("privilege_states", {})
            self._privilege_disable_until = data.get("privilege_disable_until", {})
            self._privilege_pre_block_state = data.get("privilege_pre_block_state", {})
            self._chore_completed_at = data.get("chore_completed_at", {})

    async def async_save(self) -> None:
        """Save points to storage."""
        await self._store.async_save(
            {
                "points": self._data,
                "points_earned": self._points_earned,
                "points_missed": self._points_missed,
                "points_possible": self._points_possible,
                "privilege_states": self._privilege_states,
                "privilege_disable_until": self._privilege_disable_until,
                "privilege_pre_block_state": self._privilege_pre_block_state,
                "chore_completed_at": self._chore_completed_at,
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

    # Privilege state methods
    def get_privilege_state(self, assignee: str, privilege_slug: str) -> str | None:
        """Get the stored state for a privilege."""
        user_states = self._privilege_states.get(assignee, {})
        return user_states.get(privilege_slug)

    async def set_privilege_state(
        self, assignee: str, privilege_slug: str, state: str
    ) -> None:
        """Set the state for a privilege."""
        if assignee not in self._privilege_states:
            self._privilege_states[assignee] = {}
        self._privilege_states[assignee][privilege_slug] = state
        await self.async_save()

    def get_privilege_disable_until(
        self, assignee: str, privilege_slug: str
    ) -> datetime | None:
        """Get the temporary disable end time for a privilege."""
        user_times = self._privilege_disable_until.get(assignee, {})
        timestamp = user_times.get(privilege_slug)
        if timestamp:
            return datetime.fromisoformat(timestamp)
        return None

    async def set_privilege_disable_until(
        self, assignee: str, privilege_slug: str, until: datetime | None
    ) -> None:
        """Set the temporary disable end time for a privilege."""
        if assignee not in self._privilege_disable_until:
            self._privilege_disable_until[assignee] = {}
        if until is None:
            # Clear the disable time
            self._privilege_disable_until[assignee].pop(privilege_slug, None)
        else:
            self._privilege_disable_until[assignee][privilege_slug] = until.isoformat()
        await self.async_save()

    def get_privilege_pre_block_state(
        self, assignee: str, privilege_slug: str
    ) -> str | None:
        """Get the state a privilege was in before its current temporary disable."""
        user_states = self._privilege_pre_block_state.get(assignee, {})
        return user_states.get(privilege_slug)

    async def set_privilege_pre_block_state(
        self, assignee: str, privilege_slug: str, state: str | None
    ) -> None:
        """Set (or clear, if `state` is None) the pre-block state for a privilege."""
        if assignee not in self._privilege_pre_block_state:
            self._privilege_pre_block_state[assignee] = {}
        if state is None:
            self._privilege_pre_block_state[assignee].pop(privilege_slug, None)
        else:
            self._privilege_pre_block_state[assignee][privilege_slug] = state
        await self.async_save()

    # Chore auto-finalize tracking

    def get_chore_completed_at(self, entity_id: str) -> datetime | None:
        """Get when a chore sensor most recently became Complete, if tracked."""
        timestamp = self._chore_completed_at.get(entity_id)
        if timestamp:
            return datetime.fromisoformat(timestamp)
        return None

    async def set_chore_completed_at(
        self, entity_id: str, when: datetime | None
    ) -> None:
        """Set (or clear, if `when` is None) a chore sensor's completion time."""
        if when is None:
            self._chore_completed_at.pop(entity_id, None)
        else:
            self._chore_completed_at[entity_id] = when.isoformat()
        await self.async_save()

    async def clear_privilege_data(self, assignee: str, privilege_slug: str) -> None:
        """Clear all stored data for a privilege."""
        if assignee in self._privilege_states:
            self._privilege_states[assignee].pop(privilege_slug, None)
        if assignee in self._privilege_disable_until:
            self._privilege_disable_until[assignee].pop(privilege_slug, None)
        if assignee in self._privilege_pre_block_state:
            self._privilege_pre_block_state[assignee].pop(privilege_slug, None)
        await self.async_save()


class HistoryStorage:
    """
    Append-only audit log of chore completions, reversals and resets.

    Deliberately separate from PointsStorage (a different Store/file) so
    resetting the audit log - see async_clear, used by the reset_history
    service - can never touch live points/privilege state, and vice versa.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize history storage."""
        self._store = Store(hass, HISTORY_STORAGE_VERSION, HISTORY_STORAGE_KEY)
        self._entries: list[dict[str, Any]] = []

    async def async_load(self) -> None:
        """Load history entries from storage."""
        data = await self._store.async_load()
        if data:
            self._entries = data.get("entries", [])

    async def async_save(self) -> None:
        """Save history entries to storage."""
        await self._store.async_save({"entries": self._entries})

    def get_entries(self) -> list[dict[str, Any]]:
        """Return every stored entry, oldest first."""
        return list(self._entries)

    async def async_add_entry(
        self,
        *,
        action: str,
        chore_slug: str,
        chore_name: str,
        category: str | None,
        assignee: str,
        points_delta: int,
        points_total: int,
    ) -> dict[str, Any]:
        """Append a new entry, evicting the oldest past MAX_HISTORY_ENTRIES."""
        entry: dict[str, Any] = {
            "id": uuid4().hex,
            "timestamp": datetime.now(UTC).isoformat(),
            "action": action,
            "chore_slug": chore_slug,
            "chore_name": chore_name,
            "category": category,
            "assignee": assignee,
            "points_delta": points_delta,
            "points_total": points_total,
        }
        self._entries.append(entry)
        if len(self._entries) > MAX_HISTORY_ENTRIES:
            self._entries = self._entries[-MAX_HISTORY_ENTRIES:]
        await self.async_save()
        return entry

    async def async_clear(self) -> int:
        """Delete every stored entry, returning how many were removed."""
        count = len(self._entries)
        self._entries = []
        await self.async_save()
        return count

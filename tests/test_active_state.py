"""Tests for the Active chore state (mark_active service + sensor tracking)."""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.simple_chores.const import (
    ATTR_CATEGORY_SLUG,
    ATTR_CHORE_SLUG,
    ATTR_TIMER_ENTITY,
    ATTR_TIMER_MINUTES,
    ATTR_USER,
    DOMAIN,
    SERVICE_FINALIZE_BY_CATEGORY,
    SERVICE_MARK_ACTIVE,
    SERVICE_MARK_COMPLETE,
    SERVICE_MARK_PENDING,
    SERVICE_PAUSE_TIMER,
    SERVICE_RESUME_TIMER,
)
from custom_components.simple_chores.data import PointsStorage
from custom_components.simple_chores.models import (
    OUTSTANDING_CHORE_STATES,
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
)
from custom_components.simple_chores.sensor import ChoreSensor, ChoreSummarySensor
from custom_components.simple_chores.services import (
    _apply_frequency_reset,
    async_remove_timer_listener,
    async_setup_services,
    async_setup_timer_listener,
)


def _make_sensor(
    hass,
    *,
    slug: str = "dishes",
    assignee: str = "alice",
    frequency: ChoreFrequency = ChoreFrequency.DAILY,
    points: int = 10,
    category: str | None = None,
    state: ChoreState = ChoreState.NOT_REQUESTED,
) -> ChoreSensor:
    chore = ChoreConfig(
        name=slug.title(),
        slug=slug,
        frequency=frequency,
        assignees=[assignee],
        points=points,
        category=category,
    )
    with patch.object(ChoreSensor, "async_write_ha_state", Mock()):
        sensor = ChoreSensor(hass, chore, assignee)
        sensor.async_update_ha_state = AsyncMock()
        sensor.async_write_ha_state = Mock()
        sensor.set_state(state.value)
    return sensor


async def _setup(hass, sensors: dict, points_storage=None) -> None:
    hass.data[DOMAIN] = {"sensors": sensors}
    if points_storage is not None:
        hass.data[DOMAIN]["points_storage"] = points_storage
    await async_setup_services(hass)


def test_outstanding_states() -> None:
    """Pending and Active are outstanding; Complete/Not Requested aren't."""
    assert ChoreState.ACTIVE.is_outstanding
    assert ChoreState.PENDING.is_outstanding
    assert not ChoreState.COMPLETE.is_outstanding
    assert not ChoreState.NOT_REQUESTED.is_outstanding
    assert {"Pending", "Active"} == OUTSTANDING_CHORE_STATES


class TestChoreSensorActivity:
    """ChoreSensor tracking of active_since / timer_ends_at."""

    def test_start_activity_records_start_and_timer(self, hass) -> None:
        """Test start activity records start and timer."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        before = datetime.now(UTC)

        sensor.start_activity(15)

        assert sensor.get_state() == ChoreState.ACTIVE.value
        assert sensor.active_since >= before
        assert sensor.timer_ends_at == sensor.active_since + timedelta(minutes=15)
        attrs = sensor.extra_state_attributes
        assert attrs["active_since"] == sensor.active_since.isoformat()
        assert attrs["timer_ends_at"] == sensor.timer_ends_at.isoformat()

    def test_reactivating_keeps_start_and_timer(self, hass) -> None:
        """Test reactivating keeps start and timer."""
        sensor = _make_sensor(hass)
        sensor.start_activity(10)
        started, ends = sensor.active_since, sensor.timer_ends_at

        sensor.start_activity()

        assert sensor.active_since == started
        assert sensor.timer_ends_at == ends

    def test_reactivating_with_timer_restarts_timer_only(self, hass) -> None:
        """Test reactivating with timer restarts timer only."""
        sensor = _make_sensor(hass)
        sensor.start_activity()
        started = sensor.active_since
        assert sensor.timer_ends_at is None

        sensor.start_activity(5)

        assert sensor.active_since == started
        assert sensor.timer_ends_at is not None

    @pytest.mark.parametrize(
        "new_state",
        [ChoreState.PENDING, ChoreState.COMPLETE, ChoreState.NOT_REQUESTED],
    )
    def test_leaving_active_clears_tracking(self, hass, new_state) -> None:
        """Test leaving active clears tracking."""
        sensor = _make_sensor(hass)
        sensor.start_activity(10)

        sensor.set_state(new_state.value)

        assert sensor.active_since is None
        assert sensor.timer_ends_at is None
        attrs = sensor.extra_state_attributes
        assert attrs["active_since"] is None
        assert attrs["timer_ends_at"] is None

    @pytest.mark.asyncio
    async def test_restores_active_tracking(self, hass) -> None:
        """Test restores active tracking."""
        sensor = _make_sensor(hass)
        started = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
        ends = started + timedelta(minutes=20)
        last_state = MagicMock()
        last_state.state = ChoreState.ACTIVE.value
        last_state.attributes = {
            "active_since": started.isoformat(),
            "timer_ends_at": ends.isoformat(),
        }
        sensor.async_get_last_state = AsyncMock(return_value=last_state)

        await sensor.async_added_to_hass()

        assert sensor.get_state() == ChoreState.ACTIVE.value
        assert sensor.active_since == started
        assert sensor.timer_ends_at == ends

    @pytest.mark.asyncio
    async def test_restores_active_without_start_time(self, hass) -> None:
        """A restored Active state with no start time falls back to now."""
        sensor = _make_sensor(hass)
        last_state = MagicMock()
        last_state.state = ChoreState.ACTIVE.value
        last_state.attributes = {}
        sensor.async_get_last_state = AsyncMock(return_value=last_state)

        await sensor.async_added_to_hass()

        assert sensor.get_state() == ChoreState.ACTIVE.value
        assert sensor.active_since is not None
        assert sensor.timer_ends_at is None


class TestMarkActiveService:
    """The mark_active service."""

    @pytest.mark.asyncio
    async def test_marks_active_with_timer(self, hass) -> None:
        """Test marks active with timer."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        await _setup(hass, {"alice_dishes": sensor})

        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_ACTIVE,
            {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes", ATTR_TIMER_MINUTES: 15},
            blocking=True,
        )

        assert sensor.get_state() == ChoreState.ACTIVE.value
        assert sensor.timer_ends_at - sensor.active_since == timedelta(minutes=15)
        sensor.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_marks_all_assignees_without_timer(self, hass) -> None:
        """Test marks all assignees without timer."""
        alice = _make_sensor(hass, assignee="alice")
        bob = _make_sensor(hass, assignee="bob")
        await _setup(hass, {"alice_dishes": alice, "bob_dishes": bob})

        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_ACTIVE, {ATTR_CHORE_SLUG: "dishes"}, blocking=True
        )

        for sensor in (alice, bob):
            assert sensor.get_state() == ChoreState.ACTIVE.value
            assert sensor.timer_ends_at is None

    @pytest.mark.asyncio
    async def test_unknown_chore_raises(self, hass) -> None:
        """Test unknown chore raises."""
        from homeassistant.exceptions import ServiceValidationError

        await _setup(hass, {"alice_dishes": _make_sensor(hass)})

        with pytest.raises(ServiceValidationError):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_ACTIVE,
                {ATTR_CHORE_SLUG: "nope"},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_complete_to_active_deducts_points(self, hass) -> None:
        """Test complete to active deducts points."""
        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        await _setup(hass, {"alice_dishes": sensor}, points_storage)

        data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_COMPLETE, data, blocking=True
        )
        assert points_storage.get_points("alice") == 10

        await hass.services.async_call(DOMAIN, SERVICE_MARK_ACTIVE, data, blocking=True)

        assert sensor.get_state() == ChoreState.ACTIVE.value
        assert points_storage.get_points("alice") == 0
        assert points_storage.get_points_earned("alice") == 0

    @pytest.mark.asyncio
    async def test_pending_to_active_to_pending_leaves_points(self, hass) -> None:
        """Test pending to active to pending leaves points."""
        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        await _setup(hass, {"alice_dishes": sensor}, points_storage)

        data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}
        await hass.services.async_call(DOMAIN, SERVICE_MARK_ACTIVE, data, blocking=True)
        await hass.services.async_call(
            DOMAIN, SERVICE_MARK_PENDING, data, blocking=True
        )

        assert sensor.get_state() == ChoreState.PENDING.value
        assert sensor.active_since is None
        assert points_storage.get_points("alice") == 0


class TestActiveCountsAsOutstanding:
    """Active chores are treated like Pending by resets and summaries."""

    @pytest.mark.asyncio
    async def test_frequency_reset_misses_active_and_returns_it_to_pending(
        self, hass
    ) -> None:
        """Test frequency reset misses active and returns it to pending."""
        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        sensor = _make_sensor(hass)
        sensor.start_activity(10)
        await _setup(hass, {"alice_dishes": sensor}, points_storage)

        await _apply_frequency_reset(hass, ChoreFrequency.DAILY)

        assert points_storage.get_points_missed("alice") == 10
        assert sensor.get_state() == ChoreState.PENDING.value
        assert sensor.active_since is None
        sensor.async_update_ha_state.assert_called()

    @pytest.mark.asyncio
    async def test_finalize_by_category_misses_active(self, hass) -> None:
        """Test finalize by category misses active."""
        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        sensor = _make_sensor(hass, frequency=ChoreFrequency.MANUAL, category="kitchen")
        sensor.start_activity()
        await _setup(hass, {"alice_dishes": sensor}, points_storage)

        await hass.services.async_call(
            DOMAIN,
            SERVICE_FINALIZE_BY_CATEGORY,
            {ATTR_CATEGORY_SLUG: "kitchen"},
            blocking=True,
        )

        assert points_storage.get_points_missed("alice") == 10
        assert sensor.get_state() == ChoreState.NOT_REQUESTED.value

    @pytest.mark.asyncio
    async def test_summary_lists_active_chores(self, hass) -> None:
        """Test summary lists active chores."""
        active = _make_sensor(hass, slug="dishes", points=3)
        active.start_activity()
        pending = _make_sensor(hass, slug="laundry", points=4, state=ChoreState.PENDING)

        manager = MagicMock()
        manager.sensors = {"alice_dishes": active, "alice_laundry": pending}
        manager.privilege_sensors = {}
        manager.points_storage.get_points.return_value = 0
        manager.points_storage.get_points_earned.return_value = 0
        manager.points_storage.get_points_missed.return_value = 0

        summary = ChoreSummarySensor(hass, "alice", manager)
        await summary.async_update()
        attrs = summary.extra_state_attributes

        assert attrs["active_chores"] == ["sensor.simple_chore_alice_dishes"]
        assert attrs["total_active"] == 1
        # Active chores are still outstanding work.
        assert attrs["total_pending"] == 2
        assert "sensor.simple_chore_alice_dishes" in attrs["pending_chores"]
        assert attrs["points_possible"] == 7
        assert summary.native_value == 2


class TestTimerPause:
    """Pausing and resuming an Active chore's timer (sensor + services)."""

    def test_pause_and_resume_keep_remaining_time(self, hass) -> None:
        """Pausing saves the time left; resuming restarts from it."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        sensor.start_activity(10)
        start = sensor.timer_ends_at - timedelta(minutes=10)

        with patch("custom_components.simple_chores.sensor.datetime") as mock_dt:
            mock_dt.now.return_value = start + timedelta(minutes=4)
            assert sensor.pause_timer()
        assert sensor.timer_ends_at is None
        assert sensor.timer_paused_remaining == timedelta(minutes=6)
        assert sensor.extra_state_attributes["timer_paused_remaining"] == 360
        assert not sensor.pause_timer()  # already paused

        resumed_at = start + timedelta(hours=1)
        with patch("custom_components.simple_chores.sensor.datetime") as mock_dt:
            mock_dt.now.return_value = resumed_at
            assert sensor.resume_timer()
        assert sensor.timer_ends_at == resumed_at + timedelta(minutes=6)
        assert sensor.timer_paused_remaining is None
        assert not sensor.resume_timer()  # not paused
        assert sensor.get_state() == ChoreState.ACTIVE.value

    def test_pause_needs_a_running_timer(self, hass) -> None:
        """No timer, or not Active: nothing to pause."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        assert not sensor.pause_timer()
        sensor.start_activity()
        assert not sensor.pause_timer()

    def test_paused_time_clears_on_leaving_active_or_new_timer(self, hass) -> None:
        """A new timer or leaving Active discards the paused remainder."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        sensor.start_activity(10)
        sensor.pause_timer()
        sensor.start_activity(5)
        assert sensor.timer_paused_remaining is None
        assert sensor.timer_ends_at is not None

        sensor.pause_timer()
        sensor.set_state(ChoreState.PENDING.value)
        assert sensor.timer_paused_remaining is None
        assert sensor.extra_state_attributes["timer_paused_remaining"] is None

    @pytest.mark.asyncio
    async def test_restores_paused_timer(self, hass) -> None:
        """A paused timer survives a restart."""
        sensor = _make_sensor(hass)
        last_state = MagicMock()
        last_state.state = ChoreState.ACTIVE.value
        last_state.attributes = {
            "active_since": datetime(2026, 1, 1, tzinfo=UTC).isoformat(),
            "timer_ends_at": None,
            "timer_paused_remaining": 90,
        }
        sensor.async_get_last_state = AsyncMock(return_value=last_state)

        await sensor.async_added_to_hass()

        assert sensor.timer_paused_remaining == timedelta(seconds=90)

    @pytest.mark.asyncio
    async def test_pause_and_resume_services(self, hass) -> None:
        """The services pause/resume the matching sensor and push its state."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        sensor.start_activity(10)
        await _setup(hass, {"alice_dishes": sensor})
        data = {ATTR_USER: "alice", ATTR_CHORE_SLUG: "dishes"}

        await hass.services.async_call(DOMAIN, SERVICE_PAUSE_TIMER, data, blocking=True)
        assert sensor.timer_ends_at is None
        assert sensor.timer_paused_remaining is not None
        sensor.async_update_ha_state.assert_called()

        sensor.async_update_ha_state.reset_mock()
        await hass.services.async_call(DOMAIN, SERVICE_PAUSE_TIMER, data, blocking=True)
        sensor.async_update_ha_state.assert_not_called()  # no-op, no error

        await hass.services.async_call(
            DOMAIN, SERVICE_RESUME_TIMER, data, blocking=True
        )
        assert sensor.timer_ends_at is not None
        assert sensor.timer_paused_remaining is None

    @pytest.mark.asyncio
    async def test_pause_unknown_chore_raises(self, hass) -> None:
        """An unknown chore is a validation error."""
        await _setup(hass, {})
        with pytest.raises(ServiceValidationError):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_PAUSE_TIMER,
                {ATTR_CHORE_SLUG: "nope"},
                blocking=True,
            )


class TestLinkedTimerHelper:
    """A timer helper linked via mark_active's timer_entity."""

    async def _start(self, hass, sensors: dict, **data) -> None:
        await _setup(hass, sensors)
        async_setup_timer_listener(hass)
        await hass.services.async_call(
            DOMAIN,
            SERVICE_MARK_ACTIVE,
            {ATTR_CHORE_SLUG: "dishes", ATTR_TIMER_ENTITY: "timer.dishes", **data},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_mark_active_links_timer(self, hass) -> None:
        """mark_active records the timer helper and exposes it as an attribute."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        await self._start(hass, {"alice_dishes": sensor})

        assert sensor.timer_entity == "timer.dishes"
        assert sensor.extra_state_attributes["timer_entity"] == "timer.dishes"
        async_remove_timer_listener(hass)

    @pytest.mark.asyncio
    async def test_rejects_non_timer_entity(self, hass) -> None:
        """timer_entity must be a timer.* entity."""
        import voluptuous as vol

        await _setup(hass, {"alice_dishes": _make_sensor(hass)})
        with pytest.raises(vol.Invalid):
            await hass.services.async_call(
                DOMAIN,
                SERVICE_MARK_ACTIVE,
                {ATTR_CHORE_SLUG: "dishes", ATTR_TIMER_ENTITY: "light.kitchen"},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_cancelling_timer_moves_chore_to_pending(self, hass) -> None:
        """Stopping (cancelling) the linked timer sends the chore back to Pending."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        await self._start(hass, {"alice_dishes": sensor})

        hass.bus.async_fire("timer.cancelled", {"entity_id": "timer.dishes"})
        await hass.async_block_till_done()

        assert sensor.get_state() == ChoreState.PENDING.value
        assert sensor.timer_entity is None
        assert sensor.active_since is None
        async_remove_timer_listener(hass)

    @pytest.mark.asyncio
    @pytest.mark.parametrize("event", ["timer.paused", "timer.finished"])
    async def test_pausing_or_finishing_timer_keeps_chore_active(
        self, hass, event
    ) -> None:
        """Only cancellation counts as stopping the chore."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        await self._start(hass, {"alice_dishes": sensor})

        hass.bus.async_fire(event, {"entity_id": "timer.dishes"})
        await hass.async_block_till_done()

        assert sensor.get_state() == ChoreState.ACTIVE.value
        async_remove_timer_listener(hass)

    @pytest.mark.asyncio
    async def test_other_timers_and_unlinked_chores_are_ignored(self, hass) -> None:
        """Only Active chores linked to the cancelled timer are affected."""
        linked = _make_sensor(hass, state=ChoreState.PENDING)
        unlinked = _make_sensor(hass, slug="trash", state=ChoreState.PENDING)
        await self._start(hass, {"alice_dishes": linked, "alice_trash": unlinked})
        unlinked.start_activity()

        hass.bus.async_fire("timer.cancelled", {"entity_id": "timer.other"})
        await hass.async_block_till_done()
        assert linked.get_state() == ChoreState.ACTIVE.value

        hass.bus.async_fire("timer.cancelled", {"entity_id": "timer.dishes"})
        await hass.async_block_till_done()
        assert linked.get_state() == ChoreState.PENDING.value
        assert unlinked.get_state() == ChoreState.ACTIVE.value
        async_remove_timer_listener(hass)

    @pytest.mark.asyncio
    async def test_completed_chore_is_not_reopened(self, hass) -> None:
        """A chore completed before its timer is cancelled stays Complete."""
        sensor = _make_sensor(hass, state=ChoreState.PENDING)
        await self._start(hass, {"alice_dishes": sensor})
        sensor.set_state(ChoreState.COMPLETE.value)

        hass.bus.async_fire("timer.cancelled", {"entity_id": "timer.dishes"})
        await hass.async_block_till_done()

        assert sensor.get_state() == ChoreState.COMPLETE.value
        async_remove_timer_listener(hass)

    @pytest.mark.asyncio
    async def test_link_restored_after_restart(self, hass) -> None:
        """The linked timer survives a restore of an Active chore."""
        sensor = _make_sensor(hass)
        last_state = MagicMock()
        last_state.state = ChoreState.ACTIVE.value
        last_state.attributes = {"timer_entity": "timer.dishes"}
        sensor.async_get_last_state = AsyncMock(return_value=last_state)

        await sensor.async_added_to_hass()

        assert sensor.timer_entity == "timer.dishes"

    def test_restarting_without_timer_entity_keeps_link(self, hass) -> None:
        """Re-marking Active without timer_entity keeps the existing link."""
        sensor = _make_sensor(hass)
        sensor.start_activity(timer_entity="timer.dishes")
        sensor.start_activity()
        assert sensor.timer_entity == "timer.dishes"

"""
Tests for PrivilegeSensor's temporary-disable lifecycle.

Covers async_temporarily_disable, async_clear_temporary_disable, and the
async_adjust_temporary_disable/_check_and_update_state expiry path, for both
automatic (chore-driven) and manual (admin-toggled) privileges.
"""

from unittest.mock import MagicMock

import pytest

from custom_components.simple_chores.data import HistoryStorage, PointsStorage
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    PrivilegeBehavior,
    PrivilegeConfig,
    PrivilegeState,
)
from custom_components.simple_chores.sensor import ChoreSensor, PrivilegeSensor


@pytest.fixture
def mock_points_storage() -> MagicMock:
    """Build a PointsStorage double with every getter defaulting to "nothing stored"."""
    storage = MagicMock(spec=PointsStorage)
    storage.get_privilege_state.return_value = None
    storage.get_privilege_disable_until.return_value = None
    storage.get_privilege_pre_block_state.return_value = None
    return storage


@pytest.fixture
def mock_manager(mock_points_storage: MagicMock) -> MagicMock:
    """Build a ChoreSensorManager double exposing just what PrivilegeSensor reads."""
    manager = MagicMock()
    manager.points_storage = mock_points_storage
    manager.history_storage = MagicMock(spec=HistoryStorage)
    manager.sensors = {}
    return manager


@pytest.fixture
def manual_privilege() -> PrivilegeConfig:
    """Build a manually-toggled privilege assigned to alice."""
    return PrivilegeConfig(
        name="Extra Dessert",
        slug="extra_dessert",
        behavior=PrivilegeBehavior.MANUAL,
        assignees=["alice"],
    )


@pytest.fixture
def automatic_privilege() -> PrivilegeConfig:
    """Build a privilege automatically linked to alice's "dishes" chore."""
    return PrivilegeConfig(
        name="Screen Time",
        slug="screen_time",
        behavior=PrivilegeBehavior.AUTOMATIC,
        linked_chores=["dishes"],
        assignees=["alice"],
    )


def _link_chore(hass, manager: MagicMock, *, complete: bool) -> None:
    """Give the manager a "dishes" chore sensor for alice, in the given state."""
    chore = ChoreConfig(
        name="Dishes",
        slug="dishes",
        frequency=ChoreFrequency.DAILY,
        assignees=["alice"],
    )
    chore_sensor = ChoreSensor(hass, chore, "alice")
    chore_sensor.set_state(
        ChoreState.COMPLETE.value if complete else ChoreState.PENDING.value
    )
    manager.sensors["alice_dishes"] = chore_sensor


class TestTemporarilyDisable:
    """Tests for async_temporarily_disable."""

    @pytest.mark.asyncio
    async def test_saves_pre_block_state_on_first_block(
        self, hass, manual_privilege, mock_manager, mock_points_storage
    ) -> None:
        """Entering a block for the first time records the prior state."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_enable()  # currently Enabled
        mock_points_storage.reset_mock()

        await sensor.async_temporarily_disable(60)

        assert sensor.get_state() == PrivilegeState.TEMPORARILY_DISABLED.value
        mock_points_storage.set_privilege_pre_block_state.assert_called_once_with(
            "alice", "extra_dessert", PrivilegeState.ENABLED.value
        )

    @pytest.mark.asyncio
    async def test_extending_a_block_does_not_overwrite_pre_block_state(
        self, hass, manual_privilege, mock_manager, mock_points_storage
    ) -> None:
        """Blocking again while already blocked (extending) keeps the original."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_enable()
        await sensor.async_temporarily_disable(60)
        mock_points_storage.set_privilege_pre_block_state.reset_mock()

        await sensor.async_temporarily_disable(120)

        mock_points_storage.set_privilege_pre_block_state.assert_not_called()
        assert sensor._pre_block_state == PrivilegeState.ENABLED.value


class TestDisableReason:
    """Tests for the optional justification on a temporary disable."""

    @pytest.mark.asyncio
    async def test_reason_is_stored_and_exposed(
        self, hass, manual_privilege, mock_manager, mock_points_storage
    ) -> None:
        """A reason passed to async_temporarily_disable is persisted and exposed."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)

        await sensor.async_temporarily_disable(60, "Didn't finish homework")

        assert sensor.extra_state_attributes["disable_reason"] == (
            "Didn't finish homework"
        )
        mock_points_storage.set_privilege_disable_reason.assert_called_once_with(
            "alice", "extra_dessert", "Didn't finish homework"
        )

    @pytest.mark.asyncio
    async def test_omitting_reason_leaves_existing_one_untouched(
        self, hass, manual_privilege, mock_manager, mock_points_storage
    ) -> None:
        """Extending a block (e.g. via the UI's stepper) without a reason keeps it."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_temporarily_disable(60, "Didn't finish homework")
        mock_points_storage.set_privilege_disable_reason.reset_mock()

        await sensor.async_temporarily_disable(120)

        mock_points_storage.set_privilege_disable_reason.assert_not_called()
        assert sensor.extra_state_attributes["disable_reason"] == (
            "Didn't finish homework"
        )

    @pytest.mark.asyncio
    async def test_no_reason_attribute_when_none_given(
        self, hass, manual_privilege, mock_manager
    ) -> None:
        """The attribute is omitted entirely rather than present-but-empty."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)

        await sensor.async_temporarily_disable(60)

        assert "disable_reason" not in sensor.extra_state_attributes

    @pytest.mark.asyncio
    async def test_clearing_the_block_clears_the_reason(
        self, hass, manual_privilege, mock_manager
    ) -> None:
        """Ending a block (manually or via expiry) also clears its justification."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_temporarily_disable(60, "Didn't finish homework")

        await sensor.async_clear_temporary_disable()

        assert "disable_reason" not in sensor.extra_state_attributes

    @pytest.mark.asyncio
    async def test_enabling_clears_the_reason(
        self, hass, manual_privilege, mock_manager
    ) -> None:
        """A manual enable/disable supersedes any in-progress block and its reason."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_temporarily_disable(60, "Didn't finish homework")

        await sensor.async_enable()

        assert "disable_reason" not in sensor.extra_state_attributes

    @pytest.mark.asyncio
    async def test_adjust_with_reason_edits_it_in_place(
        self, hass, manual_privilege, mock_manager, mock_points_storage
    ) -> None:
        """A zero (or nonzero) adjustment carrying a reason overwrites the old one."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_temporarily_disable(60, "Didn't finish homework")

        await sensor.async_adjust_temporary_disable(0, "Actually, was rude to sister")

        assert sensor.extra_state_attributes["disable_reason"] == (
            "Actually, was rude to sister"
        )
        mock_points_storage.set_privilege_disable_reason.assert_called_with(
            "alice", "extra_dessert", "Actually, was rude to sister"
        )
        # Still blocked - editing the reason alone shouldn't end the block.
        assert sensor.get_state() == PrivilegeState.TEMPORARILY_DISABLED.value

    @pytest.mark.asyncio
    async def test_adjust_with_empty_reason_clears_it(
        self, hass, manual_privilege, mock_manager
    ) -> None:
        """Explicitly saving an empty reason clears it, same as never setting one."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_temporarily_disable(60, "Didn't finish homework")

        await sensor.async_adjust_temporary_disable(0, "")

        assert "disable_reason" not in sensor.extra_state_attributes

    @pytest.mark.asyncio
    async def test_adjust_without_reason_leaves_it_untouched(
        self, hass, manual_privilege, mock_manager, mock_points_storage
    ) -> None:
        """Adjusting duration alone (the existing stepper behavior) doesn't touch it."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_temporarily_disable(60, "Didn't finish homework")
        mock_points_storage.set_privilege_disable_reason.reset_mock()

        await sensor.async_adjust_temporary_disable(30)

        mock_points_storage.set_privilege_disable_reason.assert_not_called()
        assert sensor.extra_state_attributes["disable_reason"] == (
            "Didn't finish homework"
        )


class TestClearTemporaryDisable:
    """Tests for async_clear_temporary_disable."""

    @pytest.mark.asyncio
    async def test_noop_when_not_blocked(
        self, hass, manual_privilege, mock_manager, mock_points_storage
    ) -> None:
        """Clearing a privilege that isn't blocked warns and changes nothing."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)

        await sensor.async_clear_temporary_disable()

        assert sensor.get_state() == PrivilegeState.DISABLED.value
        mock_points_storage.set_privilege_state.assert_not_called()

    @pytest.mark.asyncio
    async def test_manual_privilege_restores_prior_state(
        self, hass, manual_privilege, mock_manager
    ) -> None:
        """Clearing a manual privilege's block restores what it was before."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_enable()
        await sensor.async_temporarily_disable(60)

        await sensor.async_clear_temporary_disable()

        assert sensor.get_state() == PrivilegeState.ENABLED.value
        assert sensor.disable_until is None

    @pytest.mark.asyncio
    async def test_manual_privilege_defaults_to_disabled_without_prior_state(
        self, hass, manual_privilege, mock_manager
    ) -> None:
        """With no recorded prior state, clearing falls back to Disabled."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        # Never enabled - starts Disabled - block it directly.
        await sensor.async_temporarily_disable(60)

        await sensor.async_clear_temporary_disable()

        assert sensor.get_state() == PrivilegeState.DISABLED.value

    @pytest.mark.asyncio
    async def test_automatic_privilege_reevaluates_from_chores_enabled(
        self, hass, automatic_privilege, mock_manager
    ) -> None:
        """Clearing an automatic privilege's block recomputes from linked chores."""
        _link_chore(hass, mock_manager, complete=True)
        sensor = PrivilegeSensor(hass, automatic_privilege, "alice", mock_manager)
        await sensor.async_temporarily_disable(60)

        await sensor.async_clear_temporary_disable()

        assert sensor.get_state() == PrivilegeState.ENABLED.value

    @pytest.mark.asyncio
    async def test_automatic_privilege_reevaluates_from_chores_disabled(
        self, hass, automatic_privilege, mock_manager
    ) -> None:
        """An automatic privilege whose chores aren't done reverts to Disabled."""
        _link_chore(hass, mock_manager, complete=False)
        sensor = PrivilegeSensor(hass, automatic_privilege, "alice", mock_manager)
        await sensor.async_temporarily_disable(60)

        await sensor.async_clear_temporary_disable()

        assert sensor.get_state() == PrivilegeState.DISABLED.value


class TestAdjustTemporaryDisableExpiry:
    """Pushing a temporary disable's end time into the past should also clear it."""

    @pytest.mark.asyncio
    async def test_manual_privilege_restores_on_expiry_via_adjustment(
        self, hass, manual_privilege, mock_manager
    ) -> None:
        """A large enough negative adjustment ends the block, same as clearing it."""
        sensor = PrivilegeSensor(hass, manual_privilege, "alice", mock_manager)
        await sensor.async_enable()
        await sensor.async_temporarily_disable(60)

        await sensor.async_adjust_temporary_disable(-120)

        assert sensor.get_state() == PrivilegeState.ENABLED.value
        assert sensor.disable_until is None


class TestCaseInsensitiveAssigneeMatching:
    """
    Assignee matching must not be case-sensitive.

    A privilege created with a titlecased assignee (e.g. via the GUI, which
    may autocapitalize) should still see chores created for the lowercase
    equivalent of the same person.
    """

    def test_all_chores_done_check_ignores_assignee_casing(
        self, hass, mock_manager
    ) -> None:
        """
        A no-linked-chores privilege for "Alice" should see "alice"'s chores.

        Regression test: _are_linked_chores_complete used to compare
        self._assignee against each chore sensor's assignee with a plain
        `!=`, so a privilege assigned to "Alice" would never see any chores
        created for "alice", even though they're the same person.
        """
        privilege = PrivilegeConfig(
            name="Screen Time",
            slug="screen_time",
            behavior=PrivilegeBehavior.AUTOMATIC,
            assignees=["Alice"],
        )
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        chore_sensor = ChoreSensor(hass, chore, "alice")
        chore_sensor.set_state(ChoreState.COMPLETE.value)
        mock_manager.sensors["alice_dishes"] = chore_sensor

        sensor = PrivilegeSensor(hass, privilege, "Alice", mock_manager)

        assert sensor._are_linked_chores_complete() is True


class TestLinkedChoreNotAssignedToPerson:
    """
    A linked chore not assigned to this person must not block the privilege.

    E.g. a privilege shared across siblings whose linked_chores list is the
    union of everyone's chores, or a stale slug left over from a chore that
    was reassigned away from this person.
    """

    def test_unassigned_linked_chore_is_skipped_not_treated_as_incomplete(
        self, hass, mock_manager
    ) -> None:
        """
        Only chores actually assigned to this person must be complete.

        A linked chore that was never assigned to them doesn't count against
        them.
        """
        privilege = PrivilegeConfig(
            name="Use Tablet",
            slug="tablet",
            behavior=PrivilegeBehavior.AUTOMATIC,
            linked_chores=["dishes", "take_out_recycling"],
            assignees=["alice"],
        )
        # alice has a sensor for "dishes" (complete) but none for
        # "take_out_recycling" - that chore belongs to a sibling.
        _link_chore(hass, mock_manager, complete=True)

        sensor = PrivilegeSensor(hass, privilege, "alice", mock_manager)

        assert sensor._are_linked_chores_complete() is True

    def test_still_blocks_on_an_assigned_but_incomplete_chore(
        self, hass, mock_manager
    ) -> None:
        """Skipping unassigned chores must not turn into skipping all checks."""
        privilege = PrivilegeConfig(
            name="Use Tablet",
            slug="tablet",
            behavior=PrivilegeBehavior.AUTOMATIC,
            linked_chores=["dishes", "take_out_recycling"],
            assignees=["alice"],
        )
        # alice's own linked chore ("dishes") is still pending.
        _link_chore(hass, mock_manager, complete=False)

        sensor = PrivilegeSensor(hass, privilege, "alice", mock_manager)

        assert sensor._are_linked_chores_complete() is False


class TestNoLinkedChoresNothingOutstanding:
    """
    A no-linked-chores privilege is Enabled whenever nothing is Pending.

    That's true both when this assignee finished everything requested of
    them, and when nothing has been requested at all (including after
    auto-finalize resets a completed chore back to Not Requested, which
    must not re-disable the privilege).
    """

    def test_enabled_when_nothing_has_ever_been_requested(
        self, hass, mock_manager
    ) -> None:
        """No chores exist for this assignee at all - nothing outstanding."""
        privilege = PrivilegeConfig(
            name="Watch TV",
            slug="watch_tv",
            behavior=PrivilegeBehavior.AUTOMATIC,
            assignees=["alice"],
        )
        sensor = PrivilegeSensor(hass, privilege, "alice", mock_manager)

        assert sensor._are_linked_chores_complete() is True

    def test_enabled_once_auto_finalize_resets_chore_to_not_requested(
        self, hass, mock_manager
    ) -> None:
        """
        Regression test: auto-finalize resetting a chore must not disable this.

        A completed chore auto-finalizing back to Not Requested must not
        flip this privilege back to Disabled - there's still nothing
        Pending, so it should stay Enabled.
        """
        privilege = PrivilegeConfig(
            name="Watch TV",
            slug="watch_tv",
            behavior=PrivilegeBehavior.AUTOMATIC,
            assignees=["alice"],
        )
        chore = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )
        chore_sensor = ChoreSensor(hass, chore, "alice")
        chore_sensor.set_state(ChoreState.NOT_REQUESTED.value)
        mock_manager.sensors["alice_dishes"] = chore_sensor

        sensor = PrivilegeSensor(hass, privilege, "alice", mock_manager)

        assert sensor._are_linked_chores_complete() is True

    def test_still_disabled_while_a_chore_is_pending(self, hass, mock_manager) -> None:
        """A genuinely outstanding chore still blocks the privilege."""
        privilege = PrivilegeConfig(
            name="Watch TV",
            slug="watch_tv",
            behavior=PrivilegeBehavior.AUTOMATIC,
            assignees=["alice"],
        )
        _link_chore(hass, mock_manager, complete=False)

        sensor = PrivilegeSensor(hass, privilege, "alice", mock_manager)

        assert sensor._are_linked_chores_complete() is False

"""
Tests for PrivilegeSensor's temporary-disable lifecycle.

Covers async_temporarily_disable, async_clear_temporary_disable, and the
async_adjust_temporary_disable/_check_and_update_state expiry path, for both
automatic (chore-driven) and manual (admin-toggled) privileges.
"""

from unittest.mock import MagicMock

import pytest

from custom_components.simple_chores.data import PointsStorage
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
    """A PointsStorage double with every getter defaulting to "nothing stored"."""
    storage = MagicMock(spec=PointsStorage)
    storage.get_privilege_state.return_value = None
    storage.get_privilege_disable_until.return_value = None
    storage.get_privilege_pre_block_state.return_value = None
    return storage


@pytest.fixture
def mock_manager(mock_points_storage: MagicMock) -> MagicMock:
    """A ChoreSensorManager double exposing just what PrivilegeSensor reads."""
    manager = MagicMock()
    manager.points_storage = mock_points_storage
    manager.sensors = {}
    return manager


@pytest.fixture
def manual_privilege() -> PrivilegeConfig:
    return PrivilegeConfig(
        name="Extra Dessert",
        slug="extra_dessert",
        behavior=PrivilegeBehavior.MANUAL,
        assignees=["alice"],
    )


@pytest.fixture
def automatic_privilege() -> PrivilegeConfig:
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

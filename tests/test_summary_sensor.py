"""Tests for the ChoreSummarySensor class."""

from unittest.mock import MagicMock, Mock

import pytest

from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    SimpleChoresConfig,
)
from custom_components.simple_chores.sensor import ChoreSensorManager


class TestChoreSummarySensor:
    """Tests for ChoreSummarySensor."""

    @pytest.fixture
    def sample_config(self) -> SimpleChoresConfig:
        """Create a sample config with multiple chores."""
        return SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice", "bob"],
                ),
                ChoreConfig(
                    name="Vacuum",
                    slug="vacuum",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
                ChoreConfig(
                    name="Laundry",
                    slug="laundry",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["bob"],
                ),
            ]
        )

    @pytest.mark.asyncio
    async def test_summary_sensor_creation(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor is created for each assignee."""
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        # Should have summary sensors for alice and bob
        assert len(manager.summary_sensors) == 2
        assert "alice" in manager.summary_sensors
        assert "bob" in manager.summary_sensors

        alice_summary = manager.summary_sensors["alice"]
        assert alice_summary.entity_id == "sensor.simple_chore_meta_alice_summary"
        assert alice_summary._attr_name == "Summary"

    @pytest.mark.asyncio
    async def test_summary_sensor_pending_count(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor counts pending chores correctly."""
        hass.data = {}
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        alice_summary = manager.summary_sensors["alice"]

        # Initially, no chores are pending
        assert alice_summary.native_value == 0

        # Set alice's dishes to pending (directly set state without calling async_write_ha_state)
        manager.sensors["alice_dishes"]._attr_native_value = ChoreState.PENDING.value
        assert alice_summary.native_value == 1

        # Set alice's vacuum to pending
        manager.sensors["alice_vacuum"]._attr_native_value = ChoreState.PENDING.value
        assert alice_summary.native_value == 2

        # Set dishes back to not requested
        manager.sensors[
            "alice_dishes"
        ]._attr_native_value = ChoreState.NOT_REQUESTED.value
        assert alice_summary.native_value == 1

    @pytest.mark.asyncio
    async def test_summary_sensor_attributes(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor attributes list chores by state."""
        hass.data = {}
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        alice_summary = manager.summary_sensors["alice"]

        # Set different states for alice's chores
        # alice has: alice_dishes, alice_vacuum (bob_dishes is bob's)
        manager.sensors["alice_dishes"]._attr_native_value = ChoreState.PENDING.value
        manager.sensors["alice_vacuum"]._attr_native_value = ChoreState.COMPLETE.value

        attrs = alice_summary.extra_state_attributes

        assert attrs["assignee"] == "alice"
        assert "sensor.simple_chore_alice_dishes" in attrs["pending_chores"]
        assert "sensor.simple_chore_alice_vacuum" in attrs["complete_chores"]
        # No not_requested chores since we set states for both of alice's chores
        assert len(attrs["pending_chores"]) == 1
        assert len(attrs["complete_chores"]) == 1
        assert len(attrs["not_requested_chores"]) == 0
        assert attrs["total_chores"] == 2
        # Test all_chores attribute
        assert "sensor.simple_chore_alice_dishes" in attrs["all_chores"]
        assert "sensor.simple_chore_alice_vacuum" in attrs["all_chores"]
        assert len(attrs["all_chores"]) == 2

        # Test with bob to verify not_requested_chores attribute exists
        bob_summary = manager.summary_sensors["bob"]
        bob_attrs = bob_summary.extra_state_attributes

        # bob has: bob_dishes, bob_laundry (both default to NOT_REQUESTED)
        assert bob_attrs["assignee"] == "bob"
        assert "sensor.simple_chore_bob_dishes" in bob_attrs["not_requested_chores"]
        assert "sensor.simple_chore_bob_laundry" in bob_attrs["not_requested_chores"]
        assert len(bob_attrs["not_requested_chores"]) == 2
        assert bob_attrs["total_chores"] == 2
        # Test all_chores attribute for bob
        assert "sensor.simple_chore_bob_dishes" in bob_attrs["all_chores"]
        assert "sensor.simple_chore_bob_laundry" in bob_attrs["all_chores"]
        assert len(bob_attrs["all_chores"]) == 2

    @pytest.mark.asyncio
    async def test_summary_sensor_only_counts_own_chores(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor only counts chores for its assignee."""
        hass.data = {}
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        alice_summary = manager.summary_sensors["alice"]
        bob_summary = manager.summary_sensors["bob"]

        # Set all chores to pending (directly set state)
        manager.sensors["alice_dishes"]._attr_native_value = ChoreState.PENDING.value
        manager.sensors["bob_dishes"]._attr_native_value = ChoreState.PENDING.value
        manager.sensors["alice_vacuum"]._attr_native_value = ChoreState.PENDING.value
        manager.sensors["bob_laundry"]._attr_native_value = ChoreState.PENDING.value

        # Alice has 2 pending chores (dishes and vacuum)
        assert alice_summary.native_value == 2

        # Bob has 2 pending chores (dishes and laundry)
        assert bob_summary.native_value == 2

    @pytest.mark.asyncio
    async def test_summary_sensor_device_info(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor shares device info with chore sensors."""
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        alice_summary = manager.summary_sensors["alice"]
        alice_chore = manager.sensors["alice_dishes"]

        # Should share the same device identifiers
        assert (
            alice_summary._attr_device_info["identifiers"]
            == alice_chore._attr_device_info["identifiers"]
        )

    @pytest.mark.asyncio
    async def test_summary_attributes_update_after_set_state(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor attributes update when chore state changes via set_state."""
        from custom_components.simple_chores.const import DOMAIN

        hass.data = {DOMAIN: {"states": {}, "summary_sensors": {}}}
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        # Store summary sensors in hass.data so set_state can find them
        hass.data[DOMAIN]["summary_sensors"] = manager.summary_sensors

        alice_summary = manager.summary_sensors["alice"]
        alice_dishes = manager.sensors["alice_dishes"]
        alice_vacuum = manager.sensors["alice_vacuum"]

        # Initial state - both chores should be NOT_REQUESTED
        initial_attrs = alice_summary.extra_state_attributes
        assert len(initial_attrs["not_requested_chores"]) == 2
        assert len(initial_attrs["pending_chores"]) == 0
        assert len(initial_attrs["complete_chores"]) == 0
        assert initial_attrs["total_chores"] == 2

        # Change dishes to PENDING using set_state
        await alice_dishes.set_state(ChoreState.PENDING)

        # Check summary sensor attributes reflect the change
        attrs_after_pending = alice_summary.extra_state_attributes
        assert (
            "sensor.simple_chore_alice_dishes" in attrs_after_pending["pending_chores"]
        )
        assert (
            "sensor.simple_chore_alice_vacuum"
            in attrs_after_pending["not_requested_chores"]
        )
        assert len(attrs_after_pending["pending_chores"]) == 1
        assert len(attrs_after_pending["not_requested_chores"]) == 1
        assert len(attrs_after_pending["complete_chores"]) == 0
        assert alice_summary.native_value == 1

        # Change vacuum to COMPLETE using set_state
        await alice_vacuum.set_state(ChoreState.COMPLETE)

        # Check summary sensor attributes reflect both changes
        attrs_after_complete = alice_summary.extra_state_attributes
        assert (
            "sensor.simple_chore_alice_dishes" in attrs_after_complete["pending_chores"]
        )
        assert (
            "sensor.simple_chore_alice_vacuum"
            in attrs_after_complete["complete_chores"]
        )
        assert len(attrs_after_complete["pending_chores"]) == 1
        assert len(attrs_after_complete["not_requested_chores"]) == 0
        assert len(attrs_after_complete["complete_chores"]) == 1
        assert alice_summary.native_value == 1

        # Change dishes to COMPLETE
        await alice_dishes.set_state(ChoreState.COMPLETE)

        # Check summary sensor shows all complete
        attrs_all_complete = alice_summary.extra_state_attributes
        assert len(attrs_all_complete["pending_chores"]) == 0
        assert len(attrs_all_complete["not_requested_chores"]) == 0
        assert len(attrs_all_complete["complete_chores"]) == 2
        assert (
            "sensor.simple_chore_alice_dishes" in attrs_all_complete["complete_chores"]
        )
        assert (
            "sensor.simple_chore_alice_vacuum" in attrs_all_complete["complete_chores"]
        )
        assert alice_summary.native_value == 0

    @pytest.mark.asyncio
    async def test_summary_sensor_points_attributes(
        self, hass, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor includes points_earned in attributes."""
        from custom_components.simple_chores.data import PointsStorage

        hass.data = {}
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)

        # Set up points storage
        points_storage = PointsStorage(hass)
        await points_storage.async_load()
        manager.points_storage = points_storage

        await manager.async_setup()

        alice_summary = manager.summary_sensors["alice"]

        # Set some points values
        await points_storage.set_points("alice", 100)
        await points_storage.set_points_earned("alice", 50)
        await points_storage.set_points_missed("alice", 10)

        attrs = alice_summary.extra_state_attributes

        # Verify all points attributes are present
        assert "total_points" in attrs
        assert "points_earned" in attrs
        assert "points_missed" in attrs
        assert "points_possible" in attrs

        # Verify values
        assert attrs["total_points"] == 100
        assert attrs["points_earned"] == 50
        assert attrs["points_missed"] == 10
        assert attrs["points_possible"] == 0  # No chores are pending/complete

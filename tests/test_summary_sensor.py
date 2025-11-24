"""Tests for the ChoreSummarySensor class."""

from unittest.mock import MagicMock, Mock, patch

import pytest

from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    SimpleChoresConfig,
)
from custom_components.simple_chores.sensor import ChoreSensor, ChoreSensorManager


class TestChoreSummarySensor:
    """Tests for ChoreSummarySensor."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create a mock Home Assistant instance."""
        hass = MagicMock()
        hass.data = {}
        return hass

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
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["alice"],
                ),
                ChoreConfig(
                    name="Laundry",
                    slug="laundry",
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["bob"],
                ),
            ]
        )

    @pytest.mark.asyncio
    async def test_summary_sensor_creation(
        self, mock_hass: MagicMock, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor is created for each assignee."""
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
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
        self, mock_hass: MagicMock, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor counts pending chores correctly."""
        mock_hass.data = {}
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
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
        self, mock_hass: MagicMock, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor attributes list chores by state."""
        mock_hass.data = {}
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        alice_summary = manager.summary_sensors["alice"]

        # Set different states (directly set state)
        manager.sensors["alice_dishes"]._attr_native_value = ChoreState.PENDING.value
        manager.sensors["alice_vacuum"]._attr_native_value = ChoreState.COMPLETE.value

        attrs = alice_summary.extra_state_attributes

        assert attrs["assignee"] == "alice"
        assert "sensor.simple_chore_alice_dishes" in attrs["pending_chores"]
        assert "sensor.simple_chore_alice_vacuum" in attrs["complete_chores"]
        assert attrs["total_chores"] == 2

    @pytest.mark.asyncio
    async def test_summary_sensor_only_counts_own_chores(
        self, mock_hass: MagicMock, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor only counts chores for its assignee."""
        mock_hass.data = {}
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
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
        self, mock_hass: MagicMock, sample_config: SimpleChoresConfig
    ) -> None:
        """Test summary sensor shares device info with chore sensors."""
        mock_config_loader = MagicMock()
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        alice_summary = manager.summary_sensors["alice"]
        alice_chore = manager.sensors["alice_dishes"]

        # Should share the same device identifiers
        assert (
            alice_summary._attr_device_info["identifiers"]
            == alice_chore._attr_device_info["identifiers"]
        )

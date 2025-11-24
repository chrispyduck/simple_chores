"""Tests for simple_chores sensor platform."""

from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from custom_components.simple_chores.config_loader import ConfigLoader
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    ChoreState,
    SimpleChoresConfig,
)
from custom_components.simple_chores.sensor import (
    ChoreSensor,
    ChoreSensorManager,
    async_setup_platform,
)


@pytest.fixture
def mock_hass():
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.async_add_executor_job = AsyncMock(side_effect=lambda func, *args: func(*args))
    # Mock the loop to avoid thread safety checks
    hass.loop = MagicMock()
    return hass


@pytest.fixture
def mock_config_loader(mock_hass):
    """Create a mock config loader."""
    loader = MagicMock(spec=ConfigLoader)
    loader.config = SimpleChoresConfig(chores=[])
    loader.register_callback = Mock()
    return loader


@pytest.fixture
def sample_chore():
    """Create a sample chore config."""
    return ChoreConfig(
        name="Dishes",
        slug="dishes",
        description="Do the dishes",
        frequency=ChoreFrequency.DAILY,
        assignees=["alice", "bob"],
    )


@pytest.fixture
def sample_config():
    """Create a sample configuration."""
    return SimpleChoresConfig(
        chores=[
            ChoreConfig(
                name="Dishes",
                slug="dishes",
                frequency=ChoreFrequency.DAILY,
                assignees=["alice"],
            ),
            ChoreConfig(
                name="Vacuum",
                slug="vacuum",
                frequency=ChoreFrequency.WEEKLY,
                assignees=["bob"],
            ),
        ]
    )


class TestAsyncSetupPlatform:
    """Tests for async_setup_platform."""

    @pytest.mark.asyncio
    async def test_setup_platform_success(self, mock_hass, mock_config_loader):
        """Test successful platform setup."""
        mock_hass.data["simple_chores"] = {"config_loader": mock_config_loader}
        async_add_entities = Mock()

        await async_setup_platform(
            mock_hass,
            {},
            async_add_entities,
            None,
        )

        # Should register callback with config loader
        mock_config_loader.register_callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_setup_platform_integration_not_loaded(self, mock_hass):
        """Test setup when integration is not loaded."""
        async_add_entities = Mock()

        # Should not raise exception, just log error
        await async_setup_platform(
            mock_hass,
            {},
            async_add_entities,
            None,
        )


class TestChoreSensorManager:
    """Tests for ChoreSensorManager."""

    @pytest.mark.asyncio
    async def test_manager_init(self, mock_hass, mock_config_loader):
        """Test manager initialization."""
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)

        assert manager.hass == mock_hass
        assert manager.async_add_entities == async_add_entities
        assert manager.config_loader == mock_config_loader
        assert manager.sensors == {}

    @pytest.mark.asyncio
    async def test_async_setup(self, mock_hass, mock_config_loader, sample_config):
        """Test manager setup with initial config."""
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        # Should create 2 sensors (one for each chore)
        assert len(manager.sensors) == 2
        assert "alice_dishes" in manager.sensors
        assert "bob_vacuum" in manager.sensors

        # Should add entities
        async_add_entities.assert_called_once()
        added_sensors = async_add_entities.call_args[0][0]
        assert len(added_sensors) == 2

    @pytest.mark.asyncio
    async def test_async_setup_multiple_assignees(self, mock_hass, mock_config_loader):
        """Test setup with chore having multiple assignees."""
        config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice", "bob", "charlie"],
                ),
            ]
        )
        mock_config_loader.config = config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        # Should create 3 sensors (one per assignee)
        assert len(manager.sensors) == 3
        assert "alice_dishes" in manager.sensors
        assert "bob_dishes" in manager.sensors
        assert "charlie_dishes" in manager.sensors

    @pytest.mark.asyncio
    @patch.object(ChoreSensor, "async_write_ha_state", Mock())
    async def test_config_changed_add_sensors(self, mock_hass, mock_config_loader):
        """Test adding sensors when config changes."""
        initial_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
            ]
        )
        mock_config_loader.config = initial_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        assert len(manager.sensors) == 1

        # Update config with new chore
        new_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
                ChoreConfig(
                    name="Vacuum",
                    slug="vacuum",
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["bob"],
                ),
            ]
        )

        await manager.async_config_changed(new_config)

        # Should now have 2 sensors
        assert len(manager.sensors) == 2
        assert "alice_dishes" in manager.sensors
        assert "bob_vacuum" in manager.sensors

        # async_add_entities should be called twice (initial + update)
        assert async_add_entities.call_count == 2

    @pytest.mark.asyncio
    @patch.object(ChoreSensor, "async_write_ha_state", Mock())
    async def test_config_changed_remove_sensors(
        self, mock_hass, mock_config_loader, sample_config
    ):
        """Test removing sensors when config changes."""
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        assert len(manager.sensors) == 2

        # Mock async_remove for sensors
        for sensor in manager.sensors.values():
            sensor.async_remove = AsyncMock()

        # Update config with only one chore
        new_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes",
                    slug="dishes",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
            ]
        )

        await manager.async_config_changed(new_config)

        # Should now have 1 sensor
        assert len(manager.sensors) == 1
        assert "alice_dishes" in manager.sensors
        assert "bob_vacuum" not in manager.sensors

    @pytest.mark.asyncio
    @patch.object(ChoreSensor, "async_write_ha_state", Mock())
    async def test_config_changed_update_existing_sensor(
        self, mock_hass, mock_config_loader, sample_config
    ):
        """Test updating existing sensor when config changes."""
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(mock_hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        original_sensor = manager.sensors["alice_dishes"]

        # Update config with modified chore
        new_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes (Updated)",
                    slug="dishes",
                    description="Updated description",
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["alice"],
                ),
                ChoreConfig(
                    name="Vacuum",
                    slug="vacuum",
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["bob"],
                ),
            ]
        )

        await manager.async_config_changed(new_config)

        # Should still have same sensor instance
        assert manager.sensors["alice_dishes"] is original_sensor
        # Sensor should be updated (we can check the internal chore reference)
        assert manager.sensors["alice_dishes"]._chore.name == "Dishes (Updated)"


class TestChoreSensor:
    """Tests for ChoreSensor."""

    def test_sensor_init(self, mock_hass, sample_chore):
        """Test sensor initialization."""
        with patch.object(ChoreSensor, "async_write_ha_state"):
            sensor = ChoreSensor(mock_hass, sample_chore, "alice")

        assert sensor.hass == mock_hass
        assert sensor._chore == sample_chore
        assert sensor._assignee == "alice"
        assert sensor.unique_id == "simple_chores_alice_dishes"
        assert sensor.name == "Dishes - alice"
        assert sensor.entity_id == "sensor.simple_chore_alice_dishes"
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value
        assert sensor.icon == "mdi:check-circle-outline"

    def test_sensor_extra_state_attributes(self, mock_hass, sample_chore):
        """Test sensor extra state attributes."""
        sensor = ChoreSensor(mock_hass, sample_chore, "alice")

        attrs = sensor.extra_state_attributes

        assert attrs["chore_name"] == "Dishes"
        assert attrs["chore_slug"] == "dishes"
        assert attrs["description"] == "Do the dishes"
        assert attrs["frequency"] == "daily"
        assert attrs["assignee"] == "alice"
        assert attrs["all_assignees"] == ["alice", "bob"]

    def test_update_chore_config(self, mock_hass, sample_chore):
        """Test updating chore configuration."""
        sensor = ChoreSensor(mock_hass, sample_chore, "alice")
        sensor.async_write_ha_state = Mock()

        new_chore = ChoreConfig(
            name="Dishes (Updated)",
            slug="dishes",
            description="New description",
            frequency=ChoreFrequency.WEEKLY,
            assignees=["alice"],
        )

        sensor.update_chore_config(new_chore)

        assert sensor._chore == new_chore
        assert sensor.name == "Dishes (Updated) - alice"
        sensor.async_write_ha_state.assert_called_once()

    def test_set_state_pending(self, mock_hass, sample_chore):
        """Test setting sensor state to pending."""
        sensor = ChoreSensor(mock_hass, sample_chore, "alice")
        sensor.async_write_ha_state = Mock()

        sensor.set_state(ChoreState.PENDING)

        assert sensor.native_value == ChoreState.PENDING.value
        assert sensor.icon == "mdi:clock-outline"
        sensor.async_write_ha_state.assert_called_once()

        # Check persistence
        state_key = "alice_dishes"
        assert (
            mock_hass.data["simple_chores"]["states"][state_key]
            == ChoreState.PENDING.value
        )

    def test_set_state_complete(self, mock_hass, sample_chore):
        """Test setting sensor state to complete."""
        sensor = ChoreSensor(mock_hass, sample_chore, "alice")
        sensor.async_write_ha_state = Mock()

        sensor.set_state(ChoreState.COMPLETE)

        assert sensor.native_value == ChoreState.COMPLETE.value
        assert sensor.icon == "mdi:check-circle"
        sensor.async_write_ha_state.assert_called_once()

    def test_set_state_not_requested(self, mock_hass, sample_chore):
        """Test setting sensor state to not requested."""
        sensor = ChoreSensor(mock_hass, sample_chore, "alice")
        sensor.async_write_ha_state = Mock()

        sensor.set_state(ChoreState.NOT_REQUESTED)

        assert sensor.native_value == ChoreState.NOT_REQUESTED.value
        assert sensor.icon == "mdi:check-circle-outline"
        sensor.async_write_ha_state.assert_called_once()

    def test_state_persistence_on_init(self, mock_hass, sample_chore):
        """Test that sensor restores previous state on init."""
        # Pre-populate state
        mock_hass.data["simple_chores"] = {
            "states": {
                "alice_dishes": ChoreState.COMPLETE.value,
            }
        }

        sensor = ChoreSensor(mock_hass, sample_chore, "alice")

        assert sensor.native_value == ChoreState.COMPLETE.value

    def test_multiple_sensors_same_chore(self, mock_hass, sample_chore):
        """Test creating multiple sensors for same chore with different assignees."""
        sensor1 = ChoreSensor(mock_hass, sample_chore, "alice")
        sensor2 = ChoreSensor(mock_hass, sample_chore, "bob")

        assert sensor1.unique_id != sensor2.unique_id
        assert sensor1.entity_id != sensor2.entity_id
        assert sensor1._assignee == "alice"
        assert sensor2._assignee == "bob"
        assert sensor1.name == "Dishes - alice"
        assert sensor2.name == "Dishes - bob"

    def test_sensor_should_not_poll(self, mock_hass, sample_chore):
        """Test that sensor has polling disabled."""
        sensor = ChoreSensor(mock_hass, sample_chore, "alice")

        assert sensor.should_poll is False

    def test_sensor_has_no_entity_name(self, mock_hass, sample_chore):
        """Test that sensor has entity name disabled."""
        sensor = ChoreSensor(mock_hass, sample_chore, "alice")

        assert sensor.has_entity_name is False

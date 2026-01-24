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
def mock_config_loader() -> MagicMock:
    """Create a mock config loader."""
    loader = MagicMock(spec=ConfigLoader)
    loader.config = SimpleChoresConfig(chores=[])
    loader.register_callback = Mock()
    return loader


@pytest.fixture
def sample_chore() -> ChoreConfig:
    """Create a sample chore config."""
    return ChoreConfig(
        name="Dishes",
        slug="dishes",
        description="Do the dishes",
        frequency=ChoreFrequency.DAILY,
        assignees=["alice", "bob"],
    )


@pytest.fixture
def sample_config() -> SimpleChoresConfig:
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
                frequency=ChoreFrequency.DAILY,
                assignees=["bob"],
            ),
        ]
    )


class TestAsyncSetupPlatform:
    """Tests for async_setup_platform."""

    @pytest.mark.asyncio
    async def test_setup_platform_success(
        self, hass, mock_config_loader: MagicMock
    ) -> None:
        """Test successful platform setup."""
        hass.data["simple_chores"] = {"config_loader": mock_config_loader}
        async_add_entities = Mock()

        await async_setup_platform(
            hass,
            {},
            async_add_entities,
            None,
        )

        # Should register callback with config loader
        mock_config_loader.register_callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_setup_platform_integration_not_loaded(self, hass) -> None:
        """Test setup when integration not loaded."""
        async_add_entities = Mock()

        # Should not raise exception, just log error
        await async_setup_platform(
            hass,
            {},
            async_add_entities,
            None,
        )


class TestChoreSensorManager:
    """Tests for ChoreSensorManager."""

    @pytest.mark.asyncio
    async def test_manager_init(self, hass, mock_config_loader: MagicMock) -> None:
        """Test manager initialization."""
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)

        assert manager.hass == hass
        assert manager.async_add_entities == async_add_entities
        assert manager.config_loader == mock_config_loader
        assert manager.sensors == {}

    @pytest.mark.asyncio
    async def test_async_setup(
        self,
        hass,
        mock_config_loader: MagicMock,
        sample_config: SimpleChoresConfig,
    ) -> None:
        """Test manager setup with initial config."""
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        # Should create 2 sensors (one for each chore)
        assert len(manager.sensors) == 2
        assert "alice_dishes" in manager.sensors
        assert "bob_vacuum" in manager.sensors

        # Should create 2 summary sensors (one for each assignee)
        assert len(manager.summary_sensors) == 2
        assert "alice" in manager.summary_sensors
        assert "bob" in manager.summary_sensors

        # Should add entities twice (once for chore sensors, once for summary sensors)
        assert async_add_entities.call_count == 2

    @pytest.mark.asyncio
    async def test_async_setup_multiple_assignees(
        self, hass, mock_config_loader: MagicMock
    ) -> None:
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

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        # Should create 3 sensors (one per assignee)
        assert len(manager.sensors) == 3
        assert "alice_dishes" in manager.sensors
        assert "bob_dishes" in manager.sensors
        assert "charlie_dishes" in manager.sensors

        # Should create 3 summary sensors (one per assignee)
        assert len(manager.summary_sensors) == 3
        assert "alice" in manager.summary_sensors
        assert "bob" in manager.summary_sensors
        assert "charlie" in manager.summary_sensors

    @pytest.mark.asyncio
    @patch.object(ChoreSensor, "async_write_ha_state", Mock())
    async def test_config_changed_add_sensors(
        self, hass, mock_config_loader: MagicMock
    ) -> None:
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

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
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
                    frequency=ChoreFrequency.DAILY,
                    assignees=["bob"],
                ),
            ]
        )

        await manager.async_config_changed(new_config)

        # Should now have 2 sensors
        assert len(manager.sensors) == 2
        assert "alice_dishes" in manager.sensors
        assert "bob_vacuum" in manager.sensors

        # Should now have 2 summary sensors
        assert len(manager.summary_sensors) == 2
        assert "alice" in manager.summary_sensors
        assert "bob" in manager.summary_sensors

        # async_add_entities called 4 times:
        # 1. Initial chore sensors (1)
        # 2. Initial summary sensors (1)
        # 3. New chore sensor (1)
        # 4. New summary sensor (1)
        assert async_add_entities.call_count == 4

    @pytest.mark.asyncio
    @patch.object(ChoreSensor, "async_write_ha_state", Mock())
    async def test_config_changed_remove_sensors(
        self,
        hass,
        mock_config_loader: MagicMock,
        sample_config: SimpleChoresConfig,
    ) -> None:
        """Test removing sensors when config changes."""
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
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
        self,
        hass,
        mock_config_loader: MagicMock,
        sample_config: SimpleChoresConfig,
    ) -> None:
        """Test updating existing sensor when chore config changes."""
        mock_config_loader.config = sample_config
        async_add_entities = Mock()

        manager = ChoreSensorManager(hass, async_add_entities, mock_config_loader)
        await manager.async_setup()

        original_sensor = manager.sensors["alice_dishes"]

        # Update config with modified chore
        new_config = SimpleChoresConfig(
            chores=[
                ChoreConfig(
                    name="Dishes (Updated)",
                    slug="dishes",
                    description="Updated description",
                    frequency=ChoreFrequency.DAILY,
                    assignees=["alice"],
                ),
                ChoreConfig(
                    name="Vacuum",
                    slug="vacuum",
                    frequency=ChoreFrequency.DAILY,
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

    def test_sensor_init(self, hass, sample_chore: ChoreConfig) -> None:
        """Test sensor initialization."""
        with patch.object(ChoreSensor, "async_write_ha_state"):
            sensor = ChoreSensor(hass, sample_chore, "alice")

        assert sensor.hass == hass
        assert sensor._chore == sample_chore
        assert sensor._assignee == "alice"
        assert sensor.unique_id == "simple_chores_alice_dishes"
        assert sensor.name == "Dishes - alice"
        assert sensor.entity_id == "sensor.simple_chore_alice_dishes"
        assert sensor.native_value == ChoreState.NOT_REQUESTED.value
        assert sensor.icon == "mdi:clipboard-list-outline"

    def test_sensor_extra_state_attributes(
        self, hass, sample_chore: ChoreConfig
    ) -> None:
        """Test sensor extra state attributes."""
        sensor = ChoreSensor(hass, sample_chore, "alice")

        attrs = sensor.extra_state_attributes

        assert attrs["chore_name"] == "Dishes"
        assert attrs["chore_slug"] == "dishes"
        assert attrs["description"] == "Do the dishes"
        assert attrs["frequency"] == "daily"
        assert attrs["assignee"] == "alice"
        assert attrs["all_assignees"] == ["alice", "bob"]
        assert attrs["icon"] == "mdi:clipboard-list-outline"

    def test_sensor_custom_icon(self, hass) -> None:
        """Test sensor with custom icon."""
        chore = ChoreConfig(
            name="Clean Kitchen",
            slug="clean_kitchen",
            description="Clean the kitchen",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            icon="mdi:broom",
        )
        sensor = ChoreSensor(hass, chore, "alice")

        assert sensor.icon == "mdi:broom"
        assert sensor.extra_state_attributes["icon"] == "mdi:broom"

    def test_update_chore_config(self, hass, sample_chore: ChoreConfig) -> None:
        """Test updating chore configuration."""
        sensor = ChoreSensor(hass, sample_chore, "alice")
        sensor.async_write_ha_state = Mock()

        new_chore = ChoreConfig(
            name="Dishes (Updated)",
            slug="dishes",
            description="Updated description",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            icon="mdi:dishwasher",
        )

        sensor.update_chore_config(new_chore)

        assert sensor._chore == new_chore
        assert sensor.name == "Dishes (Updated) - alice"
        assert sensor.icon == "mdi:dishwasher"
        sensor.async_write_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_state_pending(self, hass, sample_chore: ChoreConfig) -> None:
        """Test setting sensor state to pending."""
        sensor = ChoreSensor(hass, sample_chore, "alice")
        sensor.async_update_ha_state = AsyncMock()

        sensor.set_state(ChoreState.PENDING.value)
        await sensor.async_update_ha_state(force_refresh=True)

        assert sensor.native_value == ChoreState.PENDING.value
        # Icon should remain as configured in chore, not change with state
        assert sensor.icon == "mdi:clipboard-list-outline"
        sensor.async_update_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_state_complete(self, hass, sample_chore: ChoreConfig) -> None:
        """Test setting sensor state to complete."""
        sensor = ChoreSensor(hass, sample_chore, "alice")
        sensor.async_update_ha_state = AsyncMock()

        sensor.set_state(ChoreState.COMPLETE.value)
        await sensor.async_update_ha_state(force_refresh=True)

        assert sensor.native_value == ChoreState.COMPLETE.value
        # Icon should remain as configured in chore, not change with state
        assert sensor.icon == "mdi:clipboard-list-outline"
        sensor.async_update_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_state_not_requested(
        self, hass, sample_chore: ChoreConfig
    ) -> None:
        """Test setting sensor state to not requested."""
        sensor = ChoreSensor(hass, sample_chore, "alice")
        sensor.async_update_ha_state = AsyncMock()

        sensor.set_state(ChoreState.NOT_REQUESTED.value)
        await sensor.async_update_ha_state(force_refresh=True)

        assert sensor.native_value == ChoreState.NOT_REQUESTED.value
        assert sensor.icon == "mdi:clipboard-list-outline"
        sensor.async_update_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_state_persistence_on_init(
        self, hass, sample_chore: ChoreConfig
    ) -> None:
        """Test that sensor restores previous state on init."""
        # Create a mock last state
        mock_last_state = MagicMock()
        mock_last_state.state = ChoreState.COMPLETE.value

        sensor = ChoreSensor(hass, sample_chore, "alice")

        # Mock async_get_last_state to return our mock state
        sensor.async_get_last_state = AsyncMock(return_value=mock_last_state)

        # Trigger state restoration
        await sensor.async_added_to_hass()

        assert sensor.native_value == ChoreState.COMPLETE.value

    def test_multiple_sensors_same_chore(self, hass, sample_chore: ChoreConfig) -> None:
        """Test creating multiple sensors for same chore with different assignees."""
        sensor1 = ChoreSensor(hass, sample_chore, "alice")
        sensor2 = ChoreSensor(hass, sample_chore, "bob")

        assert sensor1.unique_id != sensor2.unique_id
        assert sensor1.entity_id != sensor2.entity_id
        assert sensor1._assignee == "alice"

    @pytest.mark.asyncio
    async def test_state_can_be_set_directly(
        self, hass, sample_chore: ChoreConfig
    ) -> None:
        """Test that chore state can be set using set_state method."""
        sensor = ChoreSensor(hass, sample_chore, "alice")
        sensor.async_update_ha_state = AsyncMock()

        # Set state using public method (like service handlers do)
        sensor.set_state(ChoreState.COMPLETE.value)
        await sensor.async_update_ha_state(force_refresh=True)

        # Verify state was set
        assert sensor.get_state() == ChoreState.COMPLETE.value
        sensor.async_update_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_icon_preserved_with_custom_icon(self, hass) -> None:
        """Test that custom icon is preserved when state changes."""
        chore = ChoreConfig(
            name="Clean Kitchen",
            slug="clean_kitchen",
            description="Clean the kitchen",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            icon="mdi:broom",
        )
        sensor = ChoreSensor(hass, chore, "alice")
        sensor.async_update_ha_state = AsyncMock()

        # Icon should start as configured
        assert sensor.icon == "mdi:broom"

        # Change state to PENDING
        sensor.set_state(ChoreState.PENDING.value)
        await sensor.async_update_ha_state(force_refresh=True)
        assert sensor.icon == "mdi:broom"  # Icon should NOT change

        # Change state to COMPLETE
        sensor.set_state(ChoreState.COMPLETE.value)
        await sensor.async_update_ha_state(force_refresh=True)
        assert sensor.icon == "mdi:broom"  # Icon should still NOT change

        # Change state back to NOT_REQUESTED
        sensor.set_state(ChoreState.NOT_REQUESTED.value)
        await sensor.async_update_ha_state(force_refresh=True)
        assert sensor.icon == "mdi:broom"  # Icon should remain custom icon

    def test_sensor_should_not_poll(self, hass, sample_chore: ChoreConfig) -> None:
        """Test that sensor has polling disabled."""
        sensor = ChoreSensor(hass, sample_chore, "alice")

        assert sensor.should_poll is False

    def test_sensor_has_no_entity_name(self, hass, sample_chore: ChoreConfig) -> None:
        """Test that sensor has entity name disabled."""
        sensor = ChoreSensor(hass, sample_chore, "alice")

        assert sensor.has_entity_name is False

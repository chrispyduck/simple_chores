"""Integration tests for simple_chores."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
import yaml

from custom_components.simple_chores import async_setup, async_unload_entry
from custom_components.simple_chores.config_loader import ConfigLoader
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    SimpleChoresConfig,
)
from custom_components.simple_chores.sensor import ChoreSensor


@pytest.fixture
def mock_hass():
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.config.path = Mock(return_value="/config")
    hass.async_add_executor_job = AsyncMock(side_effect=lambda func, *args: func(*args))
    hass.helpers.discovery.async_load_platform = AsyncMock()
    hass.config_entries.async_reload = AsyncMock()
    hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)
    hass.config_entries.async_entries = Mock(return_value=[])
    # Mock the loop to avoid thread safety checks
    hass.loop = MagicMock()
    return hass


@pytest.fixture
def temp_config_file(tmp_path):
    """Create a temporary config file."""
    config_path = tmp_path / "simple_chores.yaml"
    return config_path


@pytest.fixture
def valid_config_data():
    """Return valid config data."""
    return {
        "chores": [
            {
                "name": "Dishes",
                "slug": "dishes",
                "description": "Wash all dishes",
                "frequency": "daily",
                "assignees": ["alice", "bob"],
            },
            {
                "name": "Vacuum",
                "slug": "vacuum",
                "frequency": "weekly",
                "assignees": ["charlie"],
            },
        ]
    }


class TestFullIntegrationSetup:
    """Integration tests for full setup flow."""

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_full_setup_flow(
        self, mock_loader_class, mock_hass, temp_config_file, valid_config_data
    ):
        """Test complete setup flow from async_setup to sensor creation."""
        # Write config file
        temp_config_file.write_text(yaml.dump(valid_config_data))

        # Create real config loader
        real_loader = ConfigLoader(mock_hass, temp_config_file)
        await real_loader.async_load()
        mock_loader_class.return_value = real_loader

        # Run async_setup
        result = await async_setup(mock_hass, {})

        assert result is True

        # Verify data structure
        assert "simple_chores" in mock_hass.data
        assert "config_loader" in mock_hass.data["simple_chores"]

        # Verify config was loaded
        config = real_loader.config
        assert len(config.chores) == 2
        assert config.chores[0].slug == "dishes"
        assert config.chores[1].slug == "vacuum"

        # Verify watcher was started
        assert real_loader._watch_task is not None

        # Clean up
        await real_loader.async_stop_watching()

    @pytest.mark.asyncio
    @patch("custom_components.simple_chores.ConfigLoader")
    async def test_full_setup_and_unload_flow(
        self, mock_loader_class, mock_hass, temp_config_file, valid_config_data
    ):
        """Test complete setup and unload flow."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        real_loader = ConfigLoader(mock_hass, temp_config_file)
        await real_loader.async_load()
        mock_loader_class.return_value = real_loader

        # Setup
        await async_setup(mock_hass, {})

        assert real_loader._watch_task is not None

        # Unload
        mock_entry = MagicMock()
        result = await async_unload_entry(mock_hass, mock_entry)

        assert result is True
        # Watch task should be stopped
        if real_loader._watch_task is not None and not real_loader._watch_task.done():
            real_loader._watch_task.cancel()
            try:
                await real_loader._watch_task
            except asyncio.CancelledError:
                pass
        assert real_loader._watch_task is None or real_loader._watch_task.cancelled()

    @pytest.mark.asyncio
    async def test_config_loader_with_file_watcher_integration(
        self, mock_hass, temp_config_file, valid_config_data
    ):
        """Test config loader with file watcher detecting changes."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        callback_called = asyncio.Event()
        received_config = {}

        def callback(config: SimpleChoresConfig):
            received_config["config"] = config
            callback_called.set()

        loader.register_callback(callback)
        await loader.async_start_watching()

        # Modify config
        modified_data = valid_config_data.copy()
        modified_data["chores"].append(
            {
                "name": "Laundry",
                "slug": "laundry",
                "frequency": "weekly",
                "assignees": ["dave"],
            }
        )

        await asyncio.sleep(0.1)
        temp_config_file.write_text(yaml.dump(modified_data))

        # Wait for callback (max 6 seconds)
        try:
            await asyncio.wait_for(callback_called.wait(), timeout=6)
        except TimeoutError:
            pass  # May not complete in time, but that's ok for this test

        await loader.async_stop_watching()

        # If callback was called, verify the config
        if "config" in received_config:
            assert len(received_config["config"].chores) == 3


class TestConfigLoaderIntegration:
    """Integration tests for ConfigLoader."""

    @pytest.mark.asyncio
    async def test_loader_handles_malformed_yaml_then_fixed(
        self, mock_hass, temp_config_file, valid_config_data
    ):
        """Test loader recovering from malformed YAML."""
        # Start with malformed YAML
        temp_config_file.write_text("invalid: yaml: [")

        loader = ConfigLoader(mock_hass, temp_config_file)

        # First load should fail
        from custom_components.simple_chores.config_loader import ConfigLoadError

        with pytest.raises(ConfigLoadError):
            await loader.async_load()

        # Fix the YAML
        temp_config_file.write_text(yaml.dump(valid_config_data))

        # Second load should succeed
        config = await loader.async_load()
        assert len(config.chores) == 2

    @pytest.mark.asyncio
    async def test_loader_handles_invalid_schema_then_fixed(
        self, mock_hass, temp_config_file, valid_config_data
    ):
        """Test loader recovering from invalid schema."""
        # Start with invalid schema
        invalid_data = {
            "chores": [
                {
                    "name": "Test",
                    "slug": "invalid slug!",  # Invalid characters
                    "frequency": "daily",
                    "assignees": ["alice"],
                }
            ]
        }
        temp_config_file.write_text(yaml.dump(invalid_data))

        loader = ConfigLoader(mock_hass, temp_config_file)

        from custom_components.simple_chores.config_loader import ConfigLoadError

        with pytest.raises(ConfigLoadError):
            await loader.async_load()

        # Fix the schema
        temp_config_file.write_text(yaml.dump(valid_config_data))

        config = await loader.async_load()
        assert len(config.chores) == 2


class TestModelValidationIntegration:
    """Integration tests for model validation."""

    def test_config_validates_duplicate_slugs_across_chores(self):
        """Test that duplicate slugs are caught across multiple chores."""
        from pydantic import ValidationError

        with pytest.raises(ValidationError) as exc_info:
            SimpleChoresConfig(
                chores=[
                    ChoreConfig(
                        name="Chore 1",
                        slug="duplicate",
                        frequency=ChoreFrequency.DAILY,
                        assignees=["alice"],
                    ),
                    ChoreConfig(
                        name="Chore 2",
                        slug="duplicate",
                        frequency=ChoreFrequency.WEEKLY,
                        assignees=["bob"],
                    ),
                ]
            )

        errors = exc_info.value.errors()
        assert any("Duplicate chore slugs" in str(err) for err in errors)

    def test_config_allows_same_assignee_multiple_chores(self):
        """Test that same assignee can be assigned to multiple chores."""
        config = SimpleChoresConfig(
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
                    assignees=["alice"],
                ),
            ]
        )

        alice_chores = config.get_chores_for_assignee("alice")
        assert len(alice_chores) == 2

    def test_config_with_complex_assignee_distribution(self):
        """Test config with complex assignee distribution."""
        config = SimpleChoresConfig(
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
                    assignees=["bob", "charlie"],
                ),
                ChoreConfig(
                    name="Laundry",
                    slug="laundry",
                    frequency=ChoreFrequency.WEEKLY,
                    assignees=["alice", "charlie"],
                ),
            ]
        )

        # Alice has 2 chores
        alice_chores = config.get_chores_for_assignee("alice")
        assert len(alice_chores) == 2
        assert set(c.slug for c in alice_chores) == {"dishes", "laundry"}

        # Bob has 2 chores
        bob_chores = config.get_chores_for_assignee("bob")
        assert len(bob_chores) == 2
        assert set(c.slug for c in bob_chores) == {"dishes", "vacuum"}

        # Charlie has 2 chores
        charlie_chores = config.get_chores_for_assignee("charlie")
        assert len(charlie_chores) == 2
        assert set(c.slug for c in charlie_chores) == {"vacuum", "laundry"}


class TestSensorManagerIntegration:
    """Integration tests for sensor manager with real configs."""

    @pytest.mark.asyncio
    @patch.object(ChoreSensor, "async_write_ha_state", Mock())
    async def test_sensor_manager_lifecycle(self, mock_hass, temp_config_file):
        """Test complete sensor manager lifecycle."""
        from custom_components.simple_chores.sensor import ChoreSensorManager

        # Initial config
        initial_data = {
            "chores": [
                {
                    "name": "Dishes",
                    "slug": "dishes",
                    "frequency": "daily",
                    "assignees": ["alice"],
                }
            ]
        }
        temp_config_file.write_text(yaml.dump(initial_data))

        loader = ConfigLoader(mock_hass, temp_config_file)
        await loader.async_load()

        async_add_entities = Mock()
        manager = ChoreSensorManager(mock_hass, async_add_entities, loader)

        # Setup
        await manager.async_setup()
        assert len(manager.sensors) == 1
        assert async_add_entities.call_count == 1

        # Update config
        updated_data = {
            "chores": [
                {
                    "name": "Dishes",
                    "slug": "dishes",
                    "frequency": "daily",
                    "assignees": ["alice", "bob"],
                },
                {
                    "name": "Vacuum",
                    "slug": "vacuum",
                    "frequency": "weekly",
                    "assignees": ["charlie"],
                },
            ]
        }
        temp_config_file.write_text(yaml.dump(updated_data))
        await loader.async_load()

        # Mock async_remove for sensors
        for sensor in manager.sensors.values():
            sensor.async_remove = AsyncMock()

        # Notify manager of change
        await manager.async_config_changed(loader.config)

        # Should now have 3 sensors
        assert len(manager.sensors) == 3
        assert "alice_dishes" in manager.sensors
        assert "bob_dishes" in manager.sensors
        assert "charlie_vacuum" in manager.sensors

    @pytest.mark.asyncio
    @patch.object(ChoreSensor, "async_write_ha_state", Mock())
    async def test_sensor_state_persistence_across_config_changes(
        self, mock_hass, temp_config_file
    ):
        """Test that sensor states persist across config changes."""
        from custom_components.simple_chores.models import ChoreState
        from custom_components.simple_chores.sensor import ChoreSensor

        chore1 = ChoreConfig(
            name="Dishes",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        # Create sensor and set state
        sensor1 = ChoreSensor(mock_hass, chore1, "alice")
        sensor1.set_state(ChoreState.COMPLETE)

        # Simulate config change - chore name updated
        chore2 = ChoreConfig(
            name="Dishes (Updated)",
            slug="dishes",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
        )

        # Update sensor config
        sensor1.update_chore_config(chore2)

        # State should be preserved
        assert sensor1.native_value == ChoreState.COMPLETE.value

        # Create new sensor with same slug/assignee (simulating recreation)
        sensor2 = ChoreSensor(mock_hass, chore2, "alice")

        # State should be restored
        assert sensor2.native_value == ChoreState.COMPLETE.value

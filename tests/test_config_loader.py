"""Tests for simple_chores config_loader."""

import asyncio
from typing import TYPE_CHECKING, Any
from unittest.mock import AsyncMock, MagicMock, Mock

import pytest
import yaml

from custom_components.simple_chores.config_loader import (
    ConfigLoader,
    ConfigLoadError,
)
from custom_components.simple_chores.models import (
    ChoreConfig,
    ChoreFrequency,
    SimpleChoresConfig,
)

if TYPE_CHECKING:
    from pathlib import Path


@pytest.fixture
def hass() -> MagicMock:
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.async_add_executor_job = AsyncMock(side_effect=lambda func, *args: func(*args))
    return hass


@pytest.fixture
def temp_config_file(tmp_path: Path) -> Path:
    """Create a temporary config file."""
    return tmp_path / "simple_chores.yaml"


@pytest.fixture
def valid_config_data() -> dict[str, Any]:
    """Return valid config data."""
    return {
        "chores": [
            {
                "name": "Dishes",
                "slug": "dishes",
                "frequency": "daily",
                "assignees": ["alice"],
            },
            {
                "name": "Vacuum",
                "slug": "vacuum",
                "frequency": "daily",
                "assignees": ["bob"],
            },
        ]
    }


class TestConfigLoaderInit:
    """Tests for ConfigLoader initialization."""

    def test_init(self, hass, temp_config_file: Path) -> None:
        """Test ConfigLoader initialization."""
        loader = ConfigLoader(hass, temp_config_file)

        assert loader.hass == hass
        assert loader.config_path == temp_config_file
        assert loader._config is None
        assert loader._callbacks == []
        assert loader._watch_task is None
        assert loader._last_mtime is None


class TestConfigLoaderLoad:
    """Tests for ConfigLoader.async_load."""

    @pytest.mark.asyncio
    async def test_load_valid_config(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test loading a valid config file."""
        # Write config file
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        config = await loader.async_load()

        assert config is not None
        assert len(config.chores) == 2
        assert config.chores[0].slug == "dishes"
        assert config.chores[1].slug == "vacuum"
        assert loader._config == config
        assert loader._last_mtime is not None

    @pytest.mark.asyncio
    async def test_load_missing_file(self, hass, temp_config_file: Path) -> None:
        """Test loading when config file doesn't exist."""
        loader = ConfigLoader(hass, temp_config_file)
        config = await loader.async_load()

        assert config is not None
        assert len(config.chores) == 0
        assert loader._last_mtime is None

    @pytest.mark.asyncio
    async def test_load_invalid_yaml(self, hass, temp_config_file: Path) -> None:
        """Test loading invalid YAML."""
        temp_config_file.write_text("invalid: yaml: content: [")

        loader = ConfigLoader(hass, temp_config_file)

        with pytest.raises(ConfigLoadError) as exc_info:
            await loader.async_load()

        assert "Invalid YAML" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_load_config_with_sanitized_slug(
        self, hass, temp_config_file: Path
    ) -> None:
        """Test loading config where slug gets sanitized."""
        data = {
            "chores": [
                {
                    "name": "Test",
                    "slug": "invalid slug!",  # Will be sanitized to "invalidslug"
                    "frequency": "daily",
                    "assignees": ["alice"],
                }
            ]
        }
        temp_config_file.write_text(yaml.dump(data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Verify slug was sanitized
        assert loader.config.chores[0].slug == "invalidslug"

    @pytest.mark.asyncio
    async def test_load_empty_yaml(self, hass, temp_config_file: Path) -> None:
        """Test loading empty YAML file."""
        temp_config_file.write_text("")

        loader = ConfigLoader(hass, temp_config_file)
        config = await loader.async_load()

        assert config is not None
        assert len(config.chores) == 0

    @pytest.mark.asyncio
    async def test_config_property_before_load(
        self, hass, temp_config_file: Path
    ) -> None:
        """Test accessing config property before loading."""
        loader = ConfigLoader(hass, temp_config_file)

        with pytest.raises(ConfigLoadError) as exc_info:
            _ = loader.config

        assert "Configuration not loaded" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_config_property_after_load(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test accessing config property after loading."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        config = loader.config
        assert config is not None
        assert len(config.chores) == 2


class TestConfigLoaderCallbacks:
    """Tests for ConfigLoader callback functionality."""

    @pytest.mark.asyncio
    async def test_register_callback(self, hass, temp_config_file: Path) -> None:
        """Test registering a callback."""
        loader = ConfigLoader(hass, temp_config_file)
        callback = Mock()

        loader.register_callback(callback)

        assert callback in loader._callbacks

    @pytest.mark.asyncio
    async def test_notify_callbacks_sync(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test notifying synchronous callbacks."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        callback = Mock()
        loader.register_callback(callback)

        await loader._notify_callbacks()

        callback.assert_called_once()
        assert isinstance(callback.call_args[0][0], SimpleChoresConfig)

    @pytest.mark.asyncio
    async def test_notify_callbacks_async(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test notifying asynchronous callbacks."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        callback = AsyncMock()
        loader.register_callback(callback)

        await loader._notify_callbacks()

        callback.assert_called_once()
        assert isinstance(callback.call_args[0][0], SimpleChoresConfig)

    @pytest.mark.asyncio
    async def test_notify_callbacks_with_exception(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test that callback exceptions are caught and logged."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        failing_callback = Mock(side_effect=Exception("Test error"))
        successful_callback = Mock()

        loader.register_callback(failing_callback)
        loader.register_callback(successful_callback)

        # Should not raise exception
        await loader._notify_callbacks()

        # Both callbacks should be called
        failing_callback.assert_called_once()
        successful_callback.assert_called_once()

    @pytest.mark.asyncio
    async def test_notify_callbacks_before_load(
        self, hass, temp_config_file: Path
    ) -> None:
        """Test notifying callbacks before config is loaded."""
        loader = ConfigLoader(hass, temp_config_file)
        callback = Mock()
        loader.register_callback(callback)

        await loader._notify_callbacks()

        # Callback should not be called if config is None
        callback.assert_not_called()


class TestConfigLoaderFileWatching:
    """Tests for ConfigLoader file watching functionality."""

    @pytest.mark.asyncio
    async def test_check_for_changes_file_modified(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test detecting file changes."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Modify file
        await asyncio.sleep(0.01)  # Ensure mtime is different
        temp_config_file.write_text(yaml.dump(valid_config_data))

        has_changes = await loader._check_for_changes()

        assert has_changes is True

        # Clean up
        await loader.async_stop_watching()

    @pytest.mark.asyncio
    async def test_check_for_changes_no_modification(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test when file hasn't changed."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        has_changes = await loader._check_for_changes()

        assert has_changes is False

    @pytest.mark.asyncio
    async def test_check_for_changes_file_missing(
        self, hass, temp_config_file: Path
    ) -> None:
        """Test checking for changes when file doesn't exist."""
        loader = ConfigLoader(hass, temp_config_file)

        has_changes = await loader._check_for_changes()

        assert has_changes is False

    @pytest.mark.asyncio
    async def test_start_watching(self, hass, temp_config_file: Path) -> None:
        """Test starting file watcher."""
        loader = ConfigLoader(hass, temp_config_file)

        await loader.async_start_watching()

        assert loader._watch_task is not None
        assert not loader._watch_task.done()

        # Clean up
        await loader.async_stop_watching()

    @pytest.mark.asyncio
    async def test_start_watching_already_running(
        self, hass, temp_config_file: Path
    ) -> None:
        """Test starting watcher when already running."""
        loader = ConfigLoader(hass, temp_config_file)

        await loader.async_start_watching()
        original_task = loader._watch_task

        await loader.async_start_watching()

        # Should not create a new task
        assert loader._watch_task == original_task

        # Clean up
        await loader.async_stop_watching()

    @pytest.mark.asyncio
    async def test_stop_watching(self, hass, temp_config_file: Path) -> None:
        """Test stopping file watcher."""
        loader = ConfigLoader(hass, temp_config_file)

        await loader.async_start_watching()
        assert loader._watch_task is not None

        await loader.async_stop_watching()

        assert loader._watch_task is None

    @pytest.mark.asyncio
    async def test_stop_watching_not_running(
        self, hass, temp_config_file: Path
    ) -> None:
        """Test stopping watcher when not running."""
        loader = ConfigLoader(hass, temp_config_file)

        # Should not raise exception
        await loader.async_stop_watching()

        assert loader._watch_task is None

    @pytest.mark.asyncio
    async def test_watch_file_detects_changes(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test that file watcher detects and processes changes."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        callback = Mock()
        loader.register_callback(callback)

        await loader.async_start_watching()

        # Modify config
        modified_data = valid_config_data.copy()
        modified_data["chores"].append(
            {
                "name": "Laundry",
                "slug": "laundry",
                "frequency": "daily",
                "assignees": ["charlie"],
            }
        )

        await asyncio.sleep(0.1)
        temp_config_file.write_text(yaml.dump(modified_data))

        # Wait for watcher to detect change (max 6 seconds)
        try:
            for _ in range(12):
                await asyncio.sleep(0.5)
                if callback.called:
                    break

            # Callback should have been called with updated config
            assert callback.called
            if callback.called:
                updated_config = callback.call_args[0][0]
                assert len(updated_config.chores) == 3
        finally:
            await loader.async_stop_watching()

    @pytest.mark.asyncio
    async def test_watch_file_no_notify_if_config_unchanged(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test that callbacks aren't notified if config content is same."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        callback = Mock()
        loader.register_callback(callback)

        await loader.async_start_watching()

        # Write same content (different mtime but same data)
        await asyncio.sleep(0.1)
        temp_config_file.write_text(yaml.dump(valid_config_data))

        # Wait a bit
        await asyncio.sleep(6)

        try:
            # Callback should not be called since config didn't actually change
            assert not callback.called
        finally:
            await loader.async_stop_watching()


class TestConfigLoaderCreateChore:
    """Tests for creating chores via ConfigLoader."""

    @pytest.mark.asyncio
    async def test_create_chore_success(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test creating a new chore successfully."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Create new chore with enum frequency
        new_chore = ChoreConfig(
            name="Take Out Trash",
            slug="take_out_trash",
            description="Take the trash to the curb",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice", "bob"],
        )

        await loader.async_create_chore(new_chore)

        # Verify file was saved correctly
        saved_data = yaml.safe_load(temp_config_file.read_text())
        assert len(saved_data["chores"]) == 3

        # Find the new chore
        trash_chore = next(
            c for c in saved_data["chores"] if c["slug"] == "take_out_trash"
        )
        assert trash_chore["name"] == "Take Out Trash"
        assert trash_chore["frequency"] == "daily"  # Should be serialized as string
        assert trash_chore["assignees"] == ["alice", "bob"]

    @pytest.mark.asyncio
    async def test_create_chore_with_manual_frequency(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test creating a chore with manual frequency (the problematic enum value)."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Create chore with MANUAL frequency (this was failing before)
        new_chore = ChoreConfig(
            name="Seasonal Task",
            slug="seasonal_task",
            frequency=ChoreFrequency.MANUAL,
            assignees=["charlie"],
        )

        # This should not raise an error
        await loader.async_create_chore(new_chore)

        # Verify file was saved correctly with string value
        saved_data = yaml.safe_load(temp_config_file.read_text())
        seasonal = next(c for c in saved_data["chores"] if c["slug"] == "seasonal_task")
        assert seasonal["frequency"] == "manual"  # Must be string, not enum object

    @pytest.mark.asyncio
    async def test_create_chore_duplicate_slug(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test creating a chore with duplicate slug fails."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Try to create chore with existing slug
        duplicate_chore = ChoreConfig(
            name="Another Dishes",
            slug="dishes",  # This already exists
            frequency=ChoreFrequency.DAILY,
            assignees=["charlie"],
        )

        with pytest.raises(ConfigLoadError, match="already exists"):
            await loader.async_create_chore(duplicate_chore)

    @pytest.mark.asyncio
    async def test_create_chore_with_custom_icon(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test creating a chore with custom icon."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Create chore with custom icon
        new_chore = ChoreConfig(
            name="Clean Kitchen",
            slug="clean_kitchen",
            frequency=ChoreFrequency.DAILY,
            assignees=["alice"],
            icon="mdi:broom",
        )

        await loader.async_create_chore(new_chore)

        # Verify icon was saved correctly
        saved_data = yaml.safe_load(temp_config_file.read_text())
        kitchen_chore = next(
            c for c in saved_data["chores"] if c["slug"] == "clean_kitchen"
        )
        assert kitchen_chore["icon"] == "mdi:broom"

        # Verify it loads back correctly
        await loader.async_load()
        chore = loader.config.get_chore_by_slug("clean_kitchen")
        assert chore is not None
        assert chore.icon == "mdi:broom"


class TestConfigLoaderUpdateChore:
    """Tests for the async_update_chore method."""

    @pytest.mark.asyncio
    async def test_update_chore_name(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test updating a chore's name."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Update chore name
        await loader.async_update_chore(slug="dishes", name="Do The Dishes")

        # Verify name was updated
        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.name == "Do The Dishes"

        # Verify it was saved
        saved_data = yaml.safe_load(temp_config_file.read_text())
        dishes_chore = next(c for c in saved_data["chores"] if c["slug"] == "dishes")
        assert dishes_chore["name"] == "Do The Dishes"

    @pytest.mark.asyncio
    async def test_update_chore_icon(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test updating a chore's icon."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Update chore icon
        await loader.async_update_chore(slug="dishes", icon="mdi:dishwasher")

        # Verify icon was updated
        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.icon == "mdi:dishwasher"

        # Verify it was saved
        saved_data = yaml.safe_load(temp_config_file.read_text())
        dishes_chore = next(c for c in saved_data["chores"] if c["slug"] == "dishes")
        assert dishes_chore["icon"] == "mdi:dishwasher"

    @pytest.mark.asyncio
    async def test_update_chore_points_by_assignee(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test setting and clearing per-assignee point overrides."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        await loader.async_update_chore(slug="dishes", points_by_assignee={"alice": 5})

        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.points_by_assignee == {"alice": 5}
        assert chore.points_for("alice") == 5

        # An empty dict explicitly clears existing overrides.
        await loader.async_update_chore(slug="dishes", points_by_assignee={})

        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.points_by_assignee == {}

    @pytest.mark.asyncio
    async def test_update_chore_multiple_fields(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test updating multiple chore fields at once."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # Update multiple fields
        await loader.async_update_chore(
            slug="dishes",
            name="Clean Dishes",
            description="Wash all dishes and put them away",
            icon="mdi:dishwasher",
        )

        # Verify all fields were updated
        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.name == "Clean Dishes"
        assert chore.description == "Wash all dishes and put them away"
        assert chore.icon == "mdi:dishwasher"

    @pytest.mark.asyncio
    async def test_update_chore_not_found(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Test updating a non-existent chore fails."""
        temp_config_file.write_text(yaml.dump(valid_config_data))

        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        with pytest.raises(ConfigLoadError, match="not found"):
            await loader.async_update_chore(slug="nonexistent", name="New Name")


class TestConfigLoaderRenameSlug:
    """Tests for renaming chores/privileges/categories via `new_slug`."""

    @pytest.mark.asyncio
    async def test_rename_chore_updates_slug_and_persists(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Renaming a chore changes its slug and survives a reload."""
        temp_config_file.write_text(yaml.dump(valid_config_data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        await loader.async_update_chore(slug="dishes", new_slug="wash-dishes")

        assert loader.config.get_chore_by_slug("dishes") is None
        renamed = loader.config.get_chore_by_slug("wash_dishes")
        assert renamed is not None
        assert renamed.name == "Dishes"

        saved_data = yaml.safe_load(temp_config_file.read_text())
        assert {c["slug"] for c in saved_data["chores"]} == {"wash_dishes", "vacuum"}

    @pytest.mark.asyncio
    async def test_rename_chore_cascades_to_privilege_linked_chores(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Renaming a chore updates any privilege that links to it by slug."""
        data = {
            **valid_config_data,
            "privileges": [
                {
                    "name": "Screen Time",
                    "slug": "screen_time",
                    "linked_chores": ["dishes"],
                    "assignees": ["alice"],
                }
            ],
        }
        temp_config_file.write_text(yaml.dump(data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        await loader.async_update_chore(slug="dishes", new_slug="wash_dishes")

        privilege = loader.config.get_privilege_by_slug("screen_time")
        assert privilege is not None
        assert privilege.linked_chores == ["wash_dishes"]

    @pytest.mark.asyncio
    async def test_rename_chore_to_existing_slug_raises(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Renaming a chore to a slug already in use is rejected."""
        temp_config_file.write_text(yaml.dump(valid_config_data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        with pytest.raises(ConfigLoadError, match="already in use"):
            await loader.async_update_chore(slug="dishes", new_slug="vacuum")

        # Unchanged
        assert loader.config.get_chore_by_slug("dishes") is not None

    @pytest.mark.asyncio
    async def test_rename_category_cascades_to_chores(
        self,
        hass,
        temp_config_file: Path,
    ) -> None:
        """Renaming a category updates every chore that references it."""
        data = {
            "chores": [
                {
                    "name": "Dishes",
                    "slug": "dishes",
                    "frequency": "daily",
                    "assignees": ["alice"],
                    "category": "kitchen",
                }
            ],
            "categories": [{"name": "Kitchen", "slug": "kitchen"}],
        }
        temp_config_file.write_text(yaml.dump(data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        await loader.async_update_category(slug="kitchen", new_slug="cleaning")

        assert loader.config.get_category_by_slug("kitchen") is None
        assert loader.config.get_category_by_slug("cleaning") is not None
        chore = loader.config.get_chore_by_slug("dishes")
        assert chore is not None
        assert chore.category == "cleaning"

    @pytest.mark.asyncio
    async def test_rename_privilege_slug(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """Renaming a privilege changes its slug."""
        data = {
            **valid_config_data,
            "privileges": [
                {
                    "name": "Screen Time",
                    "slug": "screen_time",
                    "assignees": ["alice"],
                }
            ],
        }
        temp_config_file.write_text(yaml.dump(data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        await loader.async_update_privilege(slug="screen_time", new_slug="tv_time")

        assert loader.config.get_privilege_by_slug("screen_time") is None
        assert loader.config.get_privilege_by_slug("tv_time") is not None

    @pytest.mark.asyncio
    async def test_rename_to_same_slug_is_a_noop_rename(
        self,
        hass,
        temp_config_file: Path,
        valid_config_data: dict[str, Any],
    ) -> None:
        """A new_slug that sanitizes to the current slug isn't treated as a conflict."""
        temp_config_file.write_text(yaml.dump(valid_config_data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        # "Dishes" sanitizes to "dishes" - the chore's own current slug.
        await loader.async_update_chore(slug="dishes", new_slug="Dishes")

        assert loader.config.get_chore_by_slug("dishes") is not None


class TestConfigLoaderSettings:
    """Tests for async_update_settings and get_settings."""

    @pytest.mark.asyncio
    async def test_get_settings_defaults(
        self, hass, temp_config_file: Path, valid_config_data: dict[str, Any]
    ) -> None:
        """A config file with no settings section gets sensible defaults."""
        temp_config_file.write_text(yaml.dump(valid_config_data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        settings = loader.get_settings()
        assert settings.auto_finalize_enabled is True
        assert settings.auto_finalize_delay_minutes == 60

    @pytest.mark.asyncio
    async def test_update_settings_persists(
        self, hass, temp_config_file: Path, valid_config_data: dict[str, Any]
    ) -> None:
        """Updated settings are reflected immediately and saved to YAML."""
        temp_config_file.write_text(yaml.dump(valid_config_data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        await loader.async_update_settings(
            auto_finalize_enabled=False, auto_finalize_delay_minutes=15
        )

        settings = loader.get_settings()
        assert settings.auto_finalize_enabled is False
        assert settings.auto_finalize_delay_minutes == 15

        saved_data = yaml.safe_load(temp_config_file.read_text())
        assert saved_data["settings"]["auto_finalize_enabled"] is False
        assert saved_data["settings"]["auto_finalize_delay_minutes"] == 15

    @pytest.mark.asyncio
    async def test_update_settings_partial_keeps_other_field(
        self, hass, temp_config_file: Path, valid_config_data: dict[str, Any]
    ) -> None:
        """Updating only one settings field leaves the other untouched."""
        temp_config_file.write_text(yaml.dump(valid_config_data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        await loader.async_update_settings(auto_finalize_delay_minutes=5)
        assert loader.get_settings().auto_finalize_delay_minutes == 5
        assert loader.get_settings().auto_finalize_enabled is True

    @pytest.mark.asyncio
    async def test_unrelated_update_does_not_reset_settings(
        self, hass, temp_config_file: Path, valid_config_data: dict[str, Any]
    ) -> None:
        """
        Updating a chore must not silently reset settings to defaults.

        Every SimpleChoresConfig(...) reconstruction in config_loader.py must
        carry the existing settings forward explicitly.
        """
        temp_config_file.write_text(yaml.dump(valid_config_data))
        loader = ConfigLoader(hass, temp_config_file)
        await loader.async_load()

        await loader.async_update_settings(auto_finalize_delay_minutes=5)
        await loader.async_update_chore(slug="dishes", name="Do The Dishes")

        assert loader.get_settings().auto_finalize_delay_minutes == 5

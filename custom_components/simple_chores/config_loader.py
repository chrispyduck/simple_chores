"""Configuration loader for simple_chores with file watching."""

from __future__ import annotations

import asyncio
import contextlib
import inspect
from typing import TYPE_CHECKING

import yaml
from pydantic import ValidationError

from .const import LOGGER, sanitize_entity_id
from .models import (
    CategoryConfig,
    ChoreConfig,
    PrivilegeConfig,
    SettingsConfig,
    SimpleChoresConfig,
)

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable
    from pathlib import Path

    from homeassistant.core import HomeAssistant


class ConfigLoadError(Exception):
    """Error loading configuration."""


def _resolve_renamed_slug(
    new_slug: str | None, current_slug: str, slug_taken: Callable[[str], bool]
) -> str | None:
    """
    Validate a requested slug rename.

    Args:
        new_slug: The requested new slug, or None if no rename was requested
        current_slug: The item's current slug
        slug_taken: Called with the sanitized new slug to check whether
            another item already uses it

    Returns:
        The sanitized new slug, or None if no rename is actually needed
        (either none was requested, or it sanitizes to the current slug)

    Raises:
        ConfigLoadError: If the sanitized slug is empty, or already taken

    """
    if new_slug is None:
        return None
    sanitized = sanitize_entity_id(new_slug)
    if not sanitized:
        msg = f"New slug '{new_slug}' must contain at least one alphanumeric character"
        raise ConfigLoadError(msg)
    if sanitized == current_slug:
        return None
    if slug_taken(sanitized):
        msg = f"Slug '{sanitized}' is already in use"
        raise ConfigLoadError(msg)
    return sanitized


class ConfigLoader:
    """Loads and watches the simple_chores configuration file."""

    def __init__(self, hass: HomeAssistant, config_path: Path) -> None:
        """
        Initialize the config loader.

        Args:
            hass: Home Assistant instance
            config_path: Path to the configuration file

        """
        self.hass = hass
        self.config_path = config_path
        self._config: SimpleChoresConfig | None = None
        self._callbacks: list[
            Callable[[SimpleChoresConfig], None]
            | Callable[[SimpleChoresConfig], Awaitable[None]]
        ] = []
        self._watch_task: asyncio.Task | None = None
        self._last_mtime: float | None = None

    @property
    def config(self) -> SimpleChoresConfig:
        """
        Get the current configuration.

        Returns:
            Current configuration

        Raises:
            ConfigLoadError: If config hasn't been loaded yet

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)
        return self._config

    async def async_load(self) -> SimpleChoresConfig:
        """
        Load the configuration file.

        Returns:
            Loaded configuration

        Raises:
            ConfigLoadError: If the file cannot be loaded or parsed

        """
        try:
            if not self.config_path.exists():
                LOGGER.warning(
                    "Config file not found at %s, using empty configuration",
                    self.config_path,
                )
                self._config = SimpleChoresConfig(chores=[])
                self._last_mtime = None
                return self._config

            LOGGER.debug("Loading config from %s", self.config_path)
            content = await self.hass.async_add_executor_job(
                self.config_path.read_text,
                "utf-8",
            )

            data = yaml.safe_load(content) or {}
            self._config = SimpleChoresConfig(**data)
            self._last_mtime = self.config_path.stat().st_mtime

            LOGGER.info(
                "Loaded configuration with %d chore(s)",
                len(self._config.chores),
            )

        except yaml.YAMLError as err:
            msg = f"Invalid YAML in config file: {err}"
            LOGGER.error(msg)
            raise ConfigLoadError(msg) from err
        except ValidationError as err:
            msg = f"Invalid configuration: {err}"
            LOGGER.error(msg)
            raise ConfigLoadError(msg) from err
        except Exception as err:
            msg = f"Unexpected error loading config: {err}"
            LOGGER.exception(msg)
            raise ConfigLoadError(msg) from err
        else:
            return self._config

    def register_callback(
        self,
        callback: Callable[[SimpleChoresConfig], None]
        | Callable[[SimpleChoresConfig], Awaitable[None]],
    ) -> None:
        """
        Register a callback to be called when config changes.

        Args:
            callback: Callback function to call with new config (can be sync or async)

        """
        self._callbacks.append(callback)

    async def _notify_callbacks(self) -> None:
        """Notify all registered callbacks of config change."""
        if self._config is None:
            return

        for callback in self._callbacks:
            try:
                if inspect.iscoroutinefunction(callback):
                    await callback(self._config)
                else:
                    await self.hass.async_add_executor_job(callback, self._config)
            except Exception:  # noqa: BLE001 - a bad callback must not stop the rest
                LOGGER.exception("Error in config change callback")

    async def _check_for_changes(self) -> bool:
        """
        Check if the config file has changed.

        Returns:
            True if the file has changed, False otherwise

        """
        try:
            if not self.config_path.exists():
                return False

            current_mtime = await self.hass.async_add_executor_job(
                lambda: self.config_path.stat().st_mtime,
            )

            if self._last_mtime is None or current_mtime > self._last_mtime:
                return True

        except Exception:  # noqa: BLE001 - a bad stat() must not crash the watcher
            LOGGER.exception("Error checking for config file changes")

        return False

    async def _watch_file(self) -> None:
        """Watch the config file for changes."""
        LOGGER.debug("Starting config file watcher")

        while True:
            try:
                await asyncio.sleep(5)  # Check every 5 seconds

                if await self._check_for_changes():
                    LOGGER.info("Config file changed, reloading")
                    try:
                        old_config = self._config
                        await self.async_load()

                        # Only notify if config actually changed
                        if old_config != self._config:
                            await self._notify_callbacks()
                    except ConfigLoadError:
                        LOGGER.error("Failed to reload config after file change")

            except asyncio.CancelledError:
                LOGGER.debug("Config file watcher stopped")
                break
            except Exception:  # noqa: BLE001 - keep the watcher loop alive
                LOGGER.exception("Error in config file watcher")

    async def async_start_watching(self) -> None:
        """Start watching the config file for changes."""
        if self._watch_task is not None:
            LOGGER.warning("Config file watcher already running")
            return

        self._watch_task = asyncio.create_task(self._watch_file())
        LOGGER.info("Config file watcher started")

    async def async_stop_watching(self) -> None:
        """Stop watching the config file for changes."""
        if self._watch_task is None:
            return

        self._watch_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await self._watch_task

        self._watch_task = None
        LOGGER.info("Config file watcher stopped")

    async def async_save(self, config: SimpleChoresConfig | None = None) -> None:
        """
        Save the configuration to the YAML file.

        Args:
            config: Configuration to save (uses current config if None)

        Raises:
            ConfigLoadError: If the configuration cannot be saved

        """
        if config is None:
            config = self._config

        if config is None:
            msg = "No configuration to save"
            raise ConfigLoadError(msg)

        try:
            # Convert config to dict, using json mode to serialize enums as strings
            data = config.model_dump(mode="json")

            # Write to file
            yaml_content = yaml.safe_dump(
                data,
                default_flow_style=False,
                sort_keys=False,
                allow_unicode=True,
            )

            await self.hass.async_add_executor_job(
                self.config_path.write_text,
                yaml_content,
                "utf-8",
            )

            # Update internal state
            self._config = config
            self._last_mtime = await self.hass.async_add_executor_job(
                lambda: self.config_path.stat().st_mtime,
            )

            LOGGER.info("Configuration saved to %s", self.config_path)

        except Exception as err:
            msg = f"Failed to save configuration: {err}"
            LOGGER.exception(msg)
            raise ConfigLoadError(msg) from err

    async def async_create_chore(self, chore: ChoreConfig) -> None:
        """
        Create a new chore and save to YAML.

        Args:
            chore: Chore configuration to create

        Raises:
            ConfigLoadError: If chore already exists or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Check if chore with this slug already exists
        if self._config.get_chore_by_slug(chore.slug):
            msg = f"Chore with slug '{chore.slug}' already exists"
            raise ConfigLoadError(msg)

        # Add chore to config
        new_chores = [*list(self._config.chores), chore]
        new_config = SimpleChoresConfig(
            chores=new_chores,
            privileges=self._config.privileges,
            categories=self._config.categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Created chore '%s'", chore.slug)

    async def async_update_chore(  # noqa: PLR0913 - one optional kwarg per updatable field
        self,
        slug: str,
        *,
        name: str | None = None,
        description: str | None = None,
        frequency: str | None = None,
        assignees: list[str] | None = None,
        icon: str | None = None,
        points: int | None = None,
        category: str | None = None,
        new_slug: str | None = None,
    ) -> None:
        """
        Update an existing chore and save to YAML.

        Args:
            slug: Slug of the chore to update
            name: New name (None to keep current)
            description: New description (None to keep current)
            frequency: New frequency (None to keep current)
            assignees: New assignees list (None to keep current)
            icon: New icon (None to keep current)
            points: New points value (None to keep current)
            category: New category slug, or "" to uncategorize (None to keep current)
            new_slug: Rename the chore to this slug (None to keep current slug)

        Raises:
            ConfigLoadError: If chore not found, the new slug is taken, or
                save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Find the chore
        chore = self._config.get_chore_by_slug(slug)
        if not chore:
            msg = f"Chore with slug '{slug}' not found"
            raise ConfigLoadError(msg)

        renamed_slug = _resolve_renamed_slug(
            new_slug, slug, lambda s: self._config.get_chore_by_slug(s) is not None
        )

        # Create updated chore
        updated_data = chore.model_dump()
        if name is not None:
            updated_data["name"] = name
        if description is not None:
            updated_data["description"] = description
        if frequency is not None:
            updated_data["frequency"] = frequency
        if assignees is not None:
            updated_data["assignees"] = assignees
        if icon is not None:
            updated_data["icon"] = icon
        if points is not None:
            updated_data["points"] = points
        if category is not None:
            updated_data["category"] = category
        if renamed_slug is not None:
            updated_data["slug"] = renamed_slug

        updated_chore = ChoreConfig(**updated_data)

        # Replace in config
        new_chores = [
            updated_chore if c.slug == slug else c for c in self._config.chores
        ]

        # A rename must also be reflected wherever privileges reference the
        # chore by its old slug.
        new_privileges = self._config.privileges
        if renamed_slug is not None:
            new_privileges = [
                p.model_copy(
                    update={
                        "linked_chores": [
                            renamed_slug if lc == slug else lc for lc in p.linked_chores
                        ]
                    }
                )
                if slug in p.linked_chores
                else p
                for p in self._config.privileges
            ]

        new_config = SimpleChoresConfig(
            chores=new_chores,
            privileges=new_privileges,
            categories=self._config.categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        if renamed_slug is not None:
            LOGGER.info("Updated chore '%s' (renamed to '%s')", slug, renamed_slug)
        else:
            LOGGER.info("Updated chore '%s'", slug)

    async def async_delete_chore(self, slug: str) -> None:
        """
        Delete a chore and save to YAML.

        Args:
            slug: Slug of the chore to delete

        Raises:
            ConfigLoadError: If chore not found or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Check if chore exists
        if not self._config.get_chore_by_slug(slug):
            msg = f"Chore with slug '{slug}' not found"
            raise ConfigLoadError(msg)

        # Remove from config
        new_chores = [c for c in self._config.chores if c.slug != slug]
        new_config = SimpleChoresConfig(
            chores=new_chores,
            privileges=self._config.privileges,
            categories=self._config.categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Deleted chore '%s'", slug)

    async def async_create_privilege(self, privilege: PrivilegeConfig) -> None:
        """
        Create a new privilege and save to YAML.

        Args:
            privilege: Privilege configuration to create

        Raises:
            ConfigLoadError: If privilege already exists or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Check if privilege with this slug already exists
        if self._config.get_privilege_by_slug(privilege.slug):
            msg = f"Privilege with slug '{privilege.slug}' already exists"
            raise ConfigLoadError(msg)

        # Add privilege to config
        new_privileges = [*list(self._config.privileges), privilege]
        new_config = SimpleChoresConfig(
            chores=self._config.chores,
            privileges=new_privileges,
            categories=self._config.categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Created privilege '%s'", privilege.slug)

    async def async_update_privilege(
        self,
        slug: str,
        name: str | None = None,
        icon: str | None = None,
        behavior: str | None = None,
        linked_chores: list[str] | None = None,
        assignees: list[str] | None = None,
        new_slug: str | None = None,
    ) -> None:
        """
        Update an existing privilege and save to YAML.

        Args:
            slug: Slug of the privilege to update
            name: New name (None to keep current)
            icon: New icon (None to keep current)
            behavior: New behavior (None to keep current)
            linked_chores: New linked chores list (None to keep current)
            assignees: New assignees list (None to keep current)
            new_slug: Rename the privilege to this slug (None to keep current)

        Raises:
            ConfigLoadError: If privilege not found, the new slug is taken,
                or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Find the privilege
        privilege = self._config.get_privilege_by_slug(slug)
        if not privilege:
            msg = f"Privilege with slug '{slug}' not found"
            raise ConfigLoadError(msg)

        renamed_slug = _resolve_renamed_slug(
            new_slug, slug, lambda s: self._config.get_privilege_by_slug(s) is not None
        )

        # Create updated privilege
        updated_data = privilege.model_dump()
        if name is not None:
            updated_data["name"] = name
        if icon is not None:
            updated_data["icon"] = icon
        if behavior is not None:
            updated_data["behavior"] = behavior
        if linked_chores is not None:
            updated_data["linked_chores"] = linked_chores
        if assignees is not None:
            updated_data["assignees"] = assignees
        if renamed_slug is not None:
            updated_data["slug"] = renamed_slug

        updated_privilege = PrivilegeConfig(**updated_data)

        # Replace in config. Nothing else references a privilege by slug, so
        # unlike chores/categories a rename needs no further cascading.
        new_privileges = [
            updated_privilege if p.slug == slug else p for p in self._config.privileges
        ]
        new_config = SimpleChoresConfig(
            chores=self._config.chores,
            privileges=new_privileges,
            categories=self._config.categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        if renamed_slug is not None:
            LOGGER.info("Updated privilege '%s' (renamed to '%s')", slug, renamed_slug)
        else:
            LOGGER.info("Updated privilege '%s'", slug)

    async def async_delete_privilege(self, slug: str) -> None:
        """
        Delete a privilege and save to YAML.

        Args:
            slug: Slug of the privilege to delete

        Raises:
            ConfigLoadError: If privilege not found or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Check if privilege exists
        if not self._config.get_privilege_by_slug(slug):
            msg = f"Privilege with slug '{slug}' not found"
            raise ConfigLoadError(msg)

        # Remove from config
        new_privileges = [p for p in self._config.privileges if p.slug != slug]
        new_config = SimpleChoresConfig(
            chores=self._config.chores,
            privileges=new_privileges,
            categories=self._config.categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Deleted privilege '%s'", slug)

    async def async_create_category(self, category: CategoryConfig) -> None:
        """
        Create a new category and save to YAML.

        Args:
            category: Category configuration to create

        Raises:
            ConfigLoadError: If category already exists or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Check if category with this slug already exists
        if self._config.get_category_by_slug(category.slug):
            msg = f"Category with slug '{category.slug}' already exists"
            raise ConfigLoadError(msg)

        # Add category to config
        new_categories = [*list(self._config.categories), category]
        new_config = SimpleChoresConfig(
            chores=self._config.chores,
            privileges=self._config.privileges,
            categories=new_categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Created category '%s'", category.slug)

    async def async_update_category(
        self,
        slug: str,
        name: str | None = None,
        icon: str | None = None,
        new_slug: str | None = None,
    ) -> None:
        """
        Update an existing category and save to YAML.

        Args:
            slug: Slug of the category to update
            name: New name (None to keep current)
            icon: New icon (None to keep current)
            new_slug: Rename the category to this slug (None to keep current)

        Raises:
            ConfigLoadError: If category not found, the new slug is taken,
                or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Find the category
        category = self._config.get_category_by_slug(slug)
        if not category:
            msg = f"Category with slug '{slug}' not found"
            raise ConfigLoadError(msg)

        renamed_slug = _resolve_renamed_slug(
            new_slug, slug, lambda s: self._config.get_category_by_slug(s) is not None
        )

        # Create updated category
        updated_data = category.model_dump()
        if name is not None:
            updated_data["name"] = name
        if icon is not None:
            updated_data["icon"] = icon
        if renamed_slug is not None:
            updated_data["slug"] = renamed_slug

        updated_category = CategoryConfig(**updated_data)

        # Replace in config
        new_categories = [
            updated_category if c.slug == slug else c for c in self._config.categories
        ]

        # A rename must also be reflected on every chore currently assigned
        # to this category.
        new_chores = self._config.chores
        if renamed_slug is not None:
            new_chores = [
                c.model_copy(update={"category": renamed_slug})
                if c.category == slug
                else c
                for c in self._config.chores
            ]

        new_config = SimpleChoresConfig(
            chores=new_chores,
            privileges=self._config.privileges,
            categories=new_categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        if renamed_slug is not None:
            LOGGER.info("Updated category '%s' (renamed to '%s')", slug, renamed_slug)
        else:
            LOGGER.info("Updated category '%s'", slug)

    async def async_delete_category(self, slug: str) -> None:
        """
        Delete a category and save to YAML.

        Args:
            slug: Slug of the category to delete

        Raises:
            ConfigLoadError: If category not found, still in use by a chore,
                or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Check if category exists
        if not self._config.get_category_by_slug(slug):
            msg = f"Category with slug '{slug}' not found"
            raise ConfigLoadError(msg)

        # Remove from config. If any chore still references this category,
        # SimpleChoresConfig's validator rejects the construction below (the
        # same guard rail as deleting a chore still linked to a privilege).
        new_categories = [c for c in self._config.categories if c.slug != slug]
        new_config = SimpleChoresConfig(
            chores=self._config.chores,
            privileges=self._config.privileges,
            categories=new_categories,
            settings=self._config.settings,
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Deleted category '%s'", slug)

    def get_settings(self) -> SettingsConfig:
        """Return the current integration-wide settings (defaults if unloaded)."""
        if self._config is None:
            return SettingsConfig()
        return self._config.settings

    async def async_update_settings(
        self,
        *,
        auto_finalize_enabled: bool | None = None,
        auto_finalize_delay_minutes: int | None = None,
    ) -> None:
        """
        Update integration-wide settings and save to YAML.

        Args:
            auto_finalize_enabled: New value (None to keep current)
            auto_finalize_delay_minutes: New value (None to keep current)

        Raises:
            ConfigLoadError: If save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        updated_data = self._config.settings.model_dump()
        if auto_finalize_enabled is not None:
            updated_data["auto_finalize_enabled"] = auto_finalize_enabled
        if auto_finalize_delay_minutes is not None:
            updated_data["auto_finalize_delay_minutes"] = auto_finalize_delay_minutes

        new_config = SimpleChoresConfig(
            chores=self._config.chores,
            privileges=self._config.privileges,
            categories=self._config.categories,
            settings=SettingsConfig(**updated_data),
        )

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Updated settings: %s", new_config.settings.model_dump())

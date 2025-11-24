"""Configuration loader for simple_chores with file watching."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import TYPE_CHECKING

import yaml
from pydantic import ValidationError

from .const import LOGGER
from .models import SimpleChoresConfig

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant


class ConfigLoadError(Exception):
    """Error loading configuration."""


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
            return self._config

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
                if asyncio.iscoroutinefunction(callback):
                    await callback(self._config)
                else:
                    await self.hass.async_add_executor_job(callback, self._config)
            except Exception:
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

        except Exception:
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
            except Exception:
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
        try:
            await self._watch_task
        except asyncio.CancelledError:
            pass

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
        new_chores = list(self._config.chores) + [chore]
        new_config = SimpleChoresConfig(chores=new_chores)

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Created chore '%s'", chore.slug)

    async def async_update_chore(
        self,
        slug: str,
        name: str | None = None,
        description: str | None = None,
        frequency: str | None = None,
        assignees: list[str] | None = None,
        icon: str | None = None,
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

        Raises:
            ConfigLoadError: If chore not found or save fails

        """
        if self._config is None:
            msg = "Configuration not loaded"
            raise ConfigLoadError(msg)

        # Find the chore
        chore = self._config.get_chore_by_slug(slug)
        if not chore:
            msg = f"Chore with slug '{slug}' not found"
            raise ConfigLoadError(msg)

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

        updated_chore = ChoreConfig(**updated_data)

        # Replace in config
        new_chores = [
            updated_chore if c.slug == slug else c for c in self._config.chores
        ]
        new_config = SimpleChoresConfig(chores=new_chores)

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

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
        new_config = SimpleChoresConfig(chores=new_chores)

        # Save and notify
        await self.async_save(new_config)
        await self._notify_callbacks()

        LOGGER.info("Deleted chore '%s'", slug)

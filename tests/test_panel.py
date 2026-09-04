"""Tests for simple_chores panel.py (sidebar panel registration)."""

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.simple_chores import panel
from custom_components.simple_chores.const import DOMAIN, PANEL_URL

if TYPE_CHECKING:
    from pathlib import Path


@pytest.fixture
def hass() -> MagicMock:
    """Create a mock Home Assistant instance."""
    hass = MagicMock()
    hass.data = {}
    hass.http.async_register_static_paths = AsyncMock()
    return hass


class _FakePath:
    """
    Stand-in for `Path(__file__).parent / PANEL_FILENAME` that resolves to `target`.

    Used instead of monkeypatching `pathlib.Path` itself, which would affect
    every other consumer of Path during the test.
    """

    def __init__(self, target: Path) -> None:
        self._target = target

    @property
    def parent(self) -> _FakePath:
        return self

    def __truediv__(self, _other: str) -> Path:
        return self._target


class _RaisingStatPath:
    """Wraps a real Path, but its `stat()` always raises `OSError`."""

    def __init__(self, real: Path) -> None:
        self._real = real

    def exists(self) -> bool:
        return self._real.exists()

    def stat(self) -> None:
        msg = "boom"
        raise OSError(msg)

    def __str__(self) -> str:
        return str(self._real)


class TestAsyncRegisterPanel:
    """Tests for async_register_panel."""

    @pytest.mark.asyncio
    async def test_missing_bundle_skips_registration(
        self, hass: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """When the built JS bundle is absent, registration is skipped."""
        monkeypatch.setattr(panel, "PANEL_FILENAME", "frontend/dist/does-not-exist.js")

        with (
            patch.object(panel.frontend, "async_remove_panel") as mock_remove,
            patch.object(
                panel.panel_custom, "async_register_panel", new=AsyncMock()
            ) as mock_register,
        ):
            await panel.async_register_panel(hass)

        hass.http.async_register_static_paths.assert_not_called()
        mock_remove.assert_not_called()
        mock_register.assert_not_called()

    @pytest.mark.asyncio
    async def test_registers_static_path_and_panel(
        self, hass: MagicMock, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A present bundle is served statically and added to the sidebar."""
        bundle = tmp_path / "simple-chores-panel.js"
        bundle.write_text("export {};")
        monkeypatch.setattr(panel, "Path", lambda _file: _FakePath(bundle))

        with (
            patch.object(panel.frontend, "async_remove_panel") as mock_remove,
            patch.object(
                panel.panel_custom, "async_register_panel", new=AsyncMock()
            ) as mock_register,
        ):
            await panel.async_register_panel(hass)

        hass.http.async_register_static_paths.assert_called_once()
        static_configs = hass.http.async_register_static_paths.call_args[0][0]
        assert static_configs[0].url_path == PANEL_URL
        assert static_configs[0].path == str(bundle)

        # Any prior registration is cleared before re-registering.
        mock_remove.assert_called_once_with(hass, DOMAIN, warn_if_unknown=False)

        mock_register.assert_called_once()
        kwargs = mock_register.call_args.kwargs
        assert kwargs["webcomponent_name"] == "simple-chores-panel"
        assert kwargs["frontend_url_path"] == DOMAIN
        assert kwargs["module_url"].startswith(f"{PANEL_URL}?m=")
        assert kwargs["sidebar_title"] == "Chores"
        assert kwargs["require_admin"] is True
        assert kwargs["config_panel_domain"] == DOMAIN

        assert hass.data[panel._STATIC_REGISTERED] is True

    @pytest.mark.asyncio
    async def test_does_not_reregister_static_path_twice(
        self, hass: MagicMock, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A second call (e.g. reload) must not re-register the static path."""
        bundle = tmp_path / "simple-chores-panel.js"
        bundle.write_text("export {};")
        monkeypatch.setattr(panel, "Path", lambda _file: _FakePath(bundle))
        hass.data[panel._STATIC_REGISTERED] = True

        with (
            patch.object(panel.frontend, "async_remove_panel"),
            patch.object(panel.panel_custom, "async_register_panel", new=AsyncMock()),
        ):
            await panel.async_register_panel(hass)

        hass.http.async_register_static_paths.assert_not_called()

    @pytest.mark.asyncio
    async def test_cache_bust_falls_back_when_mtime_unavailable(
        self, hass: MagicMock, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """If the mtime can't be read, the module URL still gets a cache-bust value."""
        bundle = tmp_path / "simple-chores-panel.js"
        bundle.write_text("export {};")
        broken_stat_bundle = _RaisingStatPath(bundle)
        monkeypatch.setattr(panel, "Path", lambda _file: _FakePath(broken_stat_bundle))

        with (
            patch.object(panel.frontend, "async_remove_panel"),
            patch.object(
                panel.panel_custom, "async_register_panel", new=AsyncMock()
            ) as mock_register,
        ):
            await panel.async_register_panel(hass)

        kwargs = mock_register.call_args.kwargs
        assert kwargs["module_url"] == f"{PANEL_URL}?m=0"


class TestAsyncUnregisterPanel:
    """Tests for async_unregister_panel."""

    def test_removes_panel(self, hass: MagicMock) -> None:
        """Unregistering removes the sidebar panel."""
        with patch.object(panel.frontend, "async_remove_panel") as mock_remove:
            panel.async_unregister_panel(hass)

        mock_remove.assert_called_once_with(hass, DOMAIN, warn_if_unknown=False)

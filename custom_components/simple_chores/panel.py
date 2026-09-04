"""Sidebar panel registration for the Simple Chores admin UI."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig

from .const import (
    DOMAIN,
    LOGGER,
    PANEL_FILENAME,
    PANEL_ICON,
    PANEL_NAME,
    PANEL_TITLE,
    PANEL_URL,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

_STATIC_REGISTERED = f"{DOMAIN}_panel_static_registered"


async def async_register_panel(hass: HomeAssistant) -> None:
    """
    Serve the panel bundle and add Simple Chores to the sidebar.

    The panel is registered with require_admin=True, so it only appears in
    the sidebar - and is only reachable - for administrators. Chore/privilege
    definitions are edited through Home Assistant's services, which any
    non-admin could otherwise call directly, so gating the panel is what
    actually keeps this feature admin-only in practice.

    Args:
        hass: Home Assistant instance

    """
    view_path = Path(__file__).parent / PANEL_FILENAME

    if not view_path.exists():
        LOGGER.error(
            "Panel bundle missing at %s - the Chores sidebar panel will not "
            "be available. Run 'npm run build' in frontend/ before "
            "deploying this integration",
            view_path,
        )
        return

    try:
        cache_bust = int(view_path.stat().st_mtime)
    except OSError:
        cache_bust = 0

    if not hass.data.get(_STATIC_REGISTERED):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(PANEL_URL, str(view_path), cache_headers=False)]
        )
        hass.data[_STATIC_REGISTERED] = True

    # Registering twice raises, so always clear any prior registration first
    # (a config entry reload, or the YAML and config-entry setup paths both
    # running, would otherwise hit that).
    frontend.async_remove_panel(hass, DOMAIN, warn_if_unknown=False)

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_NAME,
        frontend_url_path=DOMAIN,
        module_url=f"{PANEL_URL}?m={cache_bust}",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        require_admin=True,
        config={},
        config_panel_domain=DOMAIN,
    )
    LOGGER.debug("Registered Simple Chores panel at /%s", DOMAIN)


def async_unregister_panel(hass: HomeAssistant) -> None:
    """
    Remove the Simple Chores sidebar panel.

    Args:
        hass: Home Assistant instance

    """
    frontend.async_remove_panel(hass, DOMAIN, warn_if_unknown=False)

# Simple Chores admin panel

Source for the "Chores" sidebar panel that Home Assistant admins see (see
[custom_components/simple_chores/panel.py](../custom_components/simple_chores/panel.py)).
It's a small [Lit](https://lit.dev/) custom element with no dedicated backend
API: it reconstructs chore/privilege definitions from the
`sensor.simple_chore_*` entities the integration already publishes, and every
mutation is a plain `hass.callService` call to the same services the YAML
dashboards and automations use (see [src/types.ts](src/types.ts) and
[src/simple-chores-panel.ts](src/simple-chores-panel.ts)).

## Building

```sh
npm install
npm run build
```

This writes `simple-chores-panel.js` to
`custom_components/simple_chores/frontend/dist/`. That output **is
committed to the repo** (see `.gitignore`) so the integration works without a
Node toolchain when installed via HACS or copied manually - the same way
most HACS-distributed integrations ship pre-built frontend assets. Whenever
you change anything under `src/`, rebuild and commit the updated bundle
alongside your change.

## Developing

```sh
npm run watch
```

Rebuilds on every save. Point a local Home Assistant instance (e.g. via
`scripts/develop` at the repo root) at this checkout to see changes; reload
the panel's frontend URL to pick up a new build (the integration cache-busts
the module URL by the bundle's mtime, so a normal browser refresh is enough -
no need to restart Home Assistant).

## Type checking

```sh
npx tsc --noEmit
```

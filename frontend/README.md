# Simple Chores frontend

Source for two bundles, both [Lit](https://lit.dev/) custom elements with no
dedicated backend API beyond the integration's existing services:

- The "Chores" admin sidebar panel (see
  [custom_components/simple_chores/panel.py](../custom_components/simple_chores/panel.py)),
  which reconstructs chore/privilege definitions from the
  `sensor.simple_chore_*` entities the integration already publishes, and
  makes every mutation a plain `hass.callService` call to the same services
  the YAML dashboards and automations use (see [src/types.ts](src/types.ts)
  and [src/simple-chores-panel.ts](src/simple-chores-panel.ts)).
- A small read-only `simple-chores-history-card` for regular Lovelace
  dashboards (`type: custom:simple-chores-history-card`), showing one
  assignee's recent chore activity - e.g. a "how you're doing" card on a
  kid's own dashboard. Unlike the panel, it needs no admin access and is
  injected into every frontend page load rather than lazily loaded (see
  [src/simple-chores-history-card.ts](src/simple-chores-history-card.ts)).

## Building

```sh
npm install
npm run build
```

This writes `simple-chores-panel.js` and `simple-chores-history-card.js` to
`custom_components/simple_chores/frontend/dist/` (two separate Vite configs -
see `vite.config.ts` and `vite.card.config.ts` - so the card stays a small,
independent bundle rather than shipping the panel's much larger admin CRUD
code to every dashboard). That output **is committed to the repo** (see
`.gitignore`) so the integration works without a Node toolchain when
installed via HACS or copied manually - the same way most HACS-distributed
integrations ship pre-built frontend assets. Whenever you change anything
under `src/`, rebuild and commit the updated bundle(s) alongside your change.

## Developing

```sh
npm run watch
```

Rebuilds the panel on every save (the card isn't included in watch mode -
rerun `npm run build` after editing it). Point a local Home Assistant
instance (e.g. via `scripts/develop` at the repo root) at this checkout to
see changes. Both bundles are served with no HTTP caching, but each is only
re-registered - which is what actually picks up a new build - when Home
Assistant (re)starts or the integration's config entry reloads: the panel's
module URL embeds the bundle's mtime as a cache-bust value computed once at
registration, and the card's URL is injected into the frontend once via
`frontend.add_extra_js_url`. A browser refresh alone is **not** enough after
rebuilding - restart Home Assistant (or reload the integration from Settings
-> Devices & Services) first, then refresh the browser.

## Type checking

```sh
npx tsc --noEmit
```

## Testing

```sh
npm test        # run once
npm run test:watch   # re-run on save
```

Tests run under [Vitest](https://vitest.dev/) with a jsdom environment (see
`vitest.config.ts`). `src/types.test.ts` covers the pure parsing/mapping
functions in `src/types.ts` (rebuilding chore/privilege/category/settings/
summary definitions from `hass.states`, drafts, slugs, display names).
`src/simple-chores-panel.test.ts` mounts the actual `<simple-chores-panel>`
custom element against a stubbed `hass` object and asserts on its rendered
shadow DOM (tabs, the admin gate, chore cards, the Settings danger zone,
the Users tab). `src/simple-chores-history-card.test.ts` does the same for
`<simple-chores-history-card>` (config validation, assignee/action-type
filtering, the points delta, the row limit). CI runs type checking, tests,
and the build on every push and PR (see `.github/workflows/lint.yml`).

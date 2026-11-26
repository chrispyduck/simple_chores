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
  It ships its own GUI config editor
  (`simple-chores-history-card-editor`, see
  [src/simple-chores-history-card-editor.ts](src/simple-chores-history-card-editor.ts)),
  so Lovelace's "Add Card" flow doesn't force hand-written YAML - pick the
  assignee from a suggestion list built from live chore sensors (no admin
  API needed) and toggle everything else with checkboxes/number inputs.
  Editing a card's YAML directly still works exactly the same.
- A `simple-chores-chore-card` (`type: custom:simple-chores-chore-card`,
  `entity: sensor.simple_chore_<assignee>_<chore>`) showing one assignee's
  chore as a large tile: icon, name, description and a points badge in the
  top-right. Complete chores are dimmed with a check over the icon;
  Not Requested chores get the same dimmed look with the whole card at 50%
  opacity (full strength while their options panel is open); Active
  (in progress) chores are tinted and ringed in the theme's
  `--accent-color`, with a pulsing in-progress marker on the icon and a
  short bounce/ripple when they become Active (skipped under
  `prefers-reduced-motion`). `show_description` / `show_points`
  default to true; `show_duration` (off by default) adds the chore's
  suggested duration, when it has one, under the description. `tap_action`, `hold_action` and `double_tap_action` take
  either a chore action or a standard Lovelace action config (run by HA
  via `hass-action`). Chore actions (see
  [src/chore-actions.ts](src/chore-actions.ts)) are handled by the card:
  `complete-chore`, `start-chore` (`mark_active` - in progress),
  `start-or-complete-chore` (first use starts, second completes) and
  `reopen-chore` (`mark_pending` on a complete or in-progress chore).
  `chore-menu` slides an options panel in from the card's right edge with
  the options that fit the chore's state; a press outside it or Escape
  closes it. Without a `timer_entity` it only offers Complete (or Mark
  incomplete once done). With `timer_entity: timer.<helper>` it adds the
  timer options: Start (`mark_active` + `timer.start` for the chore's
  `suggested_duration`, or the helper's own duration without one), and
  while in progress Pause / Resume (`timer.pause` / `timer.start`) and Stop
  (`mark_pending` + `timer.cancel`); Complete also cancels a running
  timer, and `start-chore` gestures start it too. Not Requested chores
  ignore every gesture. Left unset, tap is `chore-menu`, hold is
  `reopen-chore`, and double tap does nothing. Active chores show a live
  countdown (or "paused", or "Time's up!") from the timer helper, or - with
  none configured - from the chore's own built-in timer, if it has one.
  Optional
  `color_by_points` (off by default) colors the points badge on a blend
  from `low_points_color` at 0 points to `high_points_color` at
  `high_points` (default 5) and above; colors are `[r, g, b]` or `"#rrggbb"`
  (see [src/chore-card-colors.ts](src/chore-card-colors.ts)). Its GUI editor
  ([src/simple-chores-chore-card-editor.ts](src/simple-chores-chore-card-editor.ts))
  uses HA's native `ha-form` - an entity picker limited to chore sensors,
  toggles, and a per-gesture dropdown naming the chore actions (HA's own
  action picker appears under "Other Home Assistant action…", since it
  can't list custom actions) - falling back to plain inputs (only
  chore actions editable there) if `ha-form` can't load. It ships in the same bundle as the
  history card (see [src/history-card-main.ts](src/history-card-main.ts)),
  so it needs no extra registration.
- A `simple-chores-chore-list-card` (`type: custom:simple-chores-chore-list-card`,
  `assignee: <username>`) showing every chore for one assignee, sorted by
  name, each rendered by a real `simple-chores-chore-card` - so it takes all
  of that card's options (`show_*`, `color_by_points` and its colors,
  `tap_action` / `hold_action` / `double_tap_action`) and applies them to
  every chore. It has no background of its own; the chores read as a stack
  of individual cards spaced like HA's `vertical-stack`. Not Requested
  chores are hidden unless `show_not_requested: true`. Completed chores
  fade out `hide_completed_after` seconds (default 30) after completion -
  timed from the entity's `last_changed`, so a reload doesn't restart the
  clock - unless `hide_completed: false`; "All done!" shows once everything
  is hidden. `completed_last: true` sorts completed chores after
  outstanding ones. Cards that move (reordering, or closing the gap a
  hidden chore leaves) slide into place; animations are skipped under
  `prefers-reduced-motion`. Its GUI editor
  ([src/simple-chores-chore-list-card-editor.ts](src/simple-chores-chore-list-card-editor.ts))
  subclasses the chore card's editor, swapping the entity picker for an
  assignee picker. Ships in the same bundle (see
  [src/simple-chores-chore-list-card.ts](src/simple-chores-chore-list-card.ts)).

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
filtering, the points delta, the day-range cutoff), and
`src/simple-chores-history-card-editor.test.ts` covers its GUI config
editor (assignee suggestions from live sensors, and that every field emits
a `config-changed` event with the right shape). CI runs type checking,
tests, and the build on every push and PR (see `.github/workflows/lint.yml`).

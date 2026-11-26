import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { customElementOnce } from "./define-once";

import { HomeAssistant } from "./types";
import {
  CHORE_ACTIONS,
  DEFAULT_GESTURE_ACTIONS,
  choreAction,
  type ActionKind,
} from "./chore-actions";
import {
  isChoreEntity,
  type ChoreCardConfig,
  type ChoreCardOptions,
} from "./simple-chores-chore-card";
import {
  DEFAULT_HIGH_POINTS,
  DEFAULT_HIGH_POINTS_COLOR,
  DEFAULT_LOW_POINTS_COLOR,
  parseColor,
  type RgbColor,
} from "./chore-card-colors";

const DATALIST_ID = "simple-chores-chore-card-editor-entities";

const LABELS: Record<string, string> = {
  entity: "Chore",
  show_description: "Show description",
  show_points: "Show points",
  show_duration: "Show suggested duration",
  color_by_points: "Color points badge by value",
  high_points: "High value threshold (points)",
  low_points_color: "Low value color",
  high_points_color: "High value color",
  interactions: "Interactions",
  tap_behavior: "Tap behavior",
  hold_behavior: "Hold behavior",
  double_tap_behavior: "Double tap behavior",
  tap_action: "Tap action",
  hold_action: "Hold action",
  double_tap_action: "Double tap action",
  timer_entity: "Timer",
};

const GESTURES: ActionKind[] = ["tap", "hold", "double_tap"];

/** Dropdown value meaning "a standard HA action, picked with HA's editor". */
const OTHER_ACTION = "other";

/** Options for each gesture's behavior dropdown. */
const BEHAVIOR_OPTIONS = [
  ...CHORE_ACTIONS.map((a) => ({ value: a.id, label: a.label })),
  { value: "none", label: "Do nothing" },
  { value: OTHER_ACTION, label: "Other Home Assistant action…" },
];

/** HA actions offered under "Other" ("none" already has its own option). */
const HA_ACTIONS = ["more-info", "toggle", "navigate", "url", "perform-action", "assist"];

/** The behavior dropdown value for a gesture's stored action config. */
function behaviorFor(kind: ActionKind, action: { action?: string } | undefined): string {
  const id = action?.action ?? DEFAULT_GESTURE_ACTIONS[kind];
  return id === "none" || choreAction(id) ? id : OTHER_ACTION;
}

const HELPERS: Record<string, string> = {
  timer_entity:
    "A timer helper to run while a chore is in progress, for its suggested duration. Without one, the options panel has no start/pause/stop.",
  color_by_points:
    "Blends from the low color at 0 points to the high color at the threshold and above.",
};

const COLOR_KEYS = ["low_points_color", "high_points_color"] as const;
const COLOR_DEFAULTS: Record<(typeof COLOR_KEYS)[number], RgbColor> = {
  low_points_color: DEFAULT_LOW_POINTS_COLOR,
  high_points_color: DEFAULT_HIGH_POINTS_COLOR,
};

function rgbToHex(rgb: RgbColor): string {
  return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
}

function sameColor(a: RgbColor, b: RgbColor): boolean {
  return a.every((v, i) => v === b[i]);
}

/** The show_* toggles default to on, so absent means true. */
const SHOW_DEFAULTS = { show_description: true, show_points: true } as const;

/**
 * Config shape the editor works on: the chore card's display/action options
 * plus whatever field picks the card's target (`entity` here, `assignee` in
 * the chore list card's subclass).
 */
export type ChoreOptionsEditorConfig = ChoreCardOptions & {
  type: string;
  [key: string]: unknown;
};

/** An ha-form schema entry - left loose since HA owns the format. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormSchema = Record<string, any>;

declare global {
  interface Window {
    loadCardHelpers?: () => Promise<{
      createCardElement: (config: Record<string, unknown>) => HTMLElement;
    }>;
  }
}

/**
 * Make sure HA's <ha-form> is defined. The Lovelace editor dialog doesn't
 * guarantee it's loaded yet when a custom editor first renders; asking a
 * built-in card for its own editor forces HA to lazy-load the form
 * components - the usual pattern for custom card editors.
 */
async function ensureHaForm(): Promise<boolean> {
  if (customElements.get("ha-form")) return true;
  try {
    const helpers = await window.loadCardHelpers?.();
    const card = helpers?.createCardElement({ type: "entities", entities: [] });
    const ctor = card?.constructor as
      | { getConfigElement?: () => Promise<unknown> }
      | undefined;
    await ctor?.getConfigElement?.();
  } catch {
    // Fall through - the plain-input fallback below still works.
  }
  return Boolean(customElements.get("ha-form"));
}

/**
 * Visual config editor for simple-chores-chore-card, returned from
 * SimpleChoresChoreCard.getConfigElement(). Lovelace sets `.hass`, calls
 * `setConfig()`, and listens for `config-changed`.
 *
 * Renders HA's native <ha-form> - a searchable entity picker limited to
 * chore sensors (not the privilege/summary/category sensors sharing their
 * prefix), show toggles, and HA's standard tap/hold/double-tap action
 * pickers - so it looks like any built-in card's editor. If <ha-form> can't
 * be loaded, falls back to plain inputs (actions are then YAML-only).
 */
@customElementOnce("simple-chores-chore-card-editor")
export class SimpleChoresChoreCardEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() protected _config: ChoreOptionsEditorConfig = {
    type: "custom:simple-chores-chore-card",
    entity: "",
  };

  /** null until ensureHaForm() settles; then whether <ha-form> is usable. */
  @state() private _haForm: boolean | null = null;

  setConfig(config: ChoreOptionsEditorConfig | ChoreCardConfig): void {
    this._config = config as ChoreOptionsEditorConfig;
  }

  // --- Hooks for subclasses (see simple-chores-chore-list-card-editor) ----

  /** The ha-form field(s) choosing what the card shows. */
  protected _targetSchema(): FormSchema[] {
    return [
      {
        name: "entity",
        required: true,
        selector: { entity: { include_entities: this._choreEntityIds() } },
      },
    ];
  }

  /** Plain-input fallback for _targetSchema(). */
  protected _renderFallbackTarget() {
    const chores = this._choreEntityIds().map((id) => {
      const attrs = this.hass.states[id].attributes;
      return { id, label: `${attrs.chore_name ?? id} (${attrs.assignee ?? "?"})` };
    });
    return html`
      <label>
        Chore entity
        <input
          type="text"
          list=${DATALIST_ID}
          placeholder="sensor.simple_chore_..."
          .value=${(this._config.entity as string | undefined) ?? ""}
          @input=${(e: Event) =>
            this._update({ entity: (e.target as HTMLInputElement).value })}
        />
      </label>
      <datalist id=${DATALIST_ID}>
        ${chores.map((c) => html`<option value=${c.id}>${c.label}</option>`)}
      </datalist>
    `;
  }

  /** Extra boolean options (default false) shown after the show_* toggles. */
  protected _extraToggles(): string[] {
    return [];
  }

  /** Extra ha-form fields, shown after the points-color fields. */
  protected _extraSchema(): FormSchema[] {
    return [];
  }

  /** Plain-input fallback for _extraSchema(). */
  protected _renderFallbackExtras(): unknown {
    return nothing;
  }

  /** Defaults for _extraSchema() fields, so the form shows what the card uses. */
  protected _extraDefaults(): Record<string, unknown> {
    return {};
  }

  /** Helper text under a field, if any. */
  protected _helper(name: string): string | undefined {
    return HELPERS[name];
  }

  protected _label(name: string): string {
    return LABELS[name] ?? name;
  }

  protected _choreEntityIds(): string[] {
    return Object.entries(this.hass.states)
      .filter(([id, entity]) => isChoreEntity(id, entity))
      .map(([id]) => id)
      .sort();
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this._haForm === null) {
      void ensureHaForm().then((ok) => (this._haForm = ok));
    }
  }

  protected render() {
    if (!this.hass || this._haForm === null) return nothing;
    return this._haForm ? this._renderHaForm() : this._renderFallback();
  }

  /** Config with defaults filled in, so the form shows what the card uses. */
  private _formData(): Record<string, unknown> {
    const c = this._config;
    return {
      ...SHOW_DEFAULTS,
      ...this._extraDefaults(),
      ...c,
      high_points: c.high_points ?? DEFAULT_HIGH_POINTS,
      low_points_color: parseColor(c.low_points_color, DEFAULT_LOW_POINTS_COLOR),
      high_points_color: parseColor(c.high_points_color, DEFAULT_HIGH_POINTS_COLOR),
      ...Object.fromEntries(
        GESTURES.map((kind) => [`${kind}_behavior`, behaviorFor(kind, c[`${kind}_action`])])
      ),
    };
  }

  private _renderHaForm() {
    const colorFields = this._config.color_by_points
      ? [
          {
            name: "high_points",
            selector: { number: { min: 1, step: 1, mode: "box" } },
          },
          {
            type: "grid",
            name: "",
            schema: [
              { name: "low_points_color", selector: { color_rgb: {} } },
              { name: "high_points_color", selector: { color_rgb: {} } },
            ],
          },
        ]
      : [];

    const schema = [
      ...this._targetSchema(),
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_description", selector: { boolean: {} } },
          { name: "show_points", selector: { boolean: {} } },
          { name: "show_duration", selector: { boolean: {} } },
          ...this._extraToggles().map((name) => ({ name, selector: { boolean: {} } })),
        ],
      },
      { name: "color_by_points", selector: { boolean: {} } },
      ...colorFields,
      ...this._extraSchema(),
      {
        type: "expandable",
        name: "interactions",
        flatten: true,
        icon: "mdi:gesture-tap",
        schema: GESTURES.flatMap<FormSchema>((kind) => [
          {
            name: `${kind}_behavior`,
            selector: { select: { mode: "dropdown", options: BEHAVIOR_OPTIONS } },
          },
          ...(behaviorFor(kind, this._config[`${kind}_action`]) === OTHER_ACTION
            ? [{ name: `${kind}_action`, selector: { ui_action: { actions: HA_ACTIONS } } }]
            : []),
        ]).concat([{ name: "timer_entity", selector: { entity: { domain: "timer" } } }]),
      },
    ];

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._formData()}
        .schema=${schema}
        .computeLabel=${(s: { name: string }) => this._label(s.name)}
        .computeHelper=${(s: { name: string }) => this._helper(s.name)}
        @value-changed=${(e: CustomEvent<{ value: Partial<ChoreOptionsEditorConfig> }>) =>
          this._update(e.detail.value)}
      ></ha-form>
    `;
  }

  private _renderFallback() {
    const config = this._config;

    return html`
      <div class="form">
        ${this._renderFallbackTarget()}

        <label class="checkbox-item">
          <input
            type="checkbox"
            .checked=${config.show_description ?? true}
            @change=${(e: Event) =>
              this._update({ show_description: (e.target as HTMLInputElement).checked })}
          />
          Show description
        </label>
        <label class="checkbox-item">
          <input
            type="checkbox"
            .checked=${config.show_points ?? true}
            @change=${(e: Event) =>
              this._update({ show_points: (e.target as HTMLInputElement).checked })}
          />
          Show points
        </label>
        <label class="checkbox-item">
          <input
            type="checkbox"
            .checked=${config.show_duration ?? false}
            @change=${(e: Event) =>
              this._update({ show_duration: (e.target as HTMLInputElement).checked })}
          />
          Show suggested duration
        </label>
        ${this._extraToggles().map(
          (name) => html`
            <label class="checkbox-item">
              <input
                type="checkbox"
                .checked=${Boolean(config[name])}
                @change=${(e: Event) =>
                  this._update({ [name]: (e.target as HTMLInputElement).checked })}
              />
              ${this._label(name)}
            </label>
          `
        )}
        <label class="checkbox-item">
          <input
            type="checkbox"
            .checked=${config.color_by_points ?? false}
            @change=${(e: Event) =>
              this._update({ color_by_points: (e.target as HTMLInputElement).checked })}
          />
          Color points badge by value
        </label>
        ${config.color_by_points ? this._renderFallbackColorFields() : nothing}
        ${this._renderFallbackExtras()}
        ${GESTURES.map((kind) => {
          const behavior = behaviorFor(kind, config[`${kind}_action`]);
          return html`
            <label>
              ${LABELS[`${kind}_behavior`]}
              <select
                class="behavior"
                @change=${(e: Event) =>
                  this._update({
                    [`${kind}_behavior`]: (e.target as HTMLSelectElement).value,
                  })}
              >
                ${BEHAVIOR_OPTIONS.map(
                  (o) =>
                    html`<option value=${o.value} ?selected=${o.value === behavior}>
                      ${o.label}
                    </option>`
                )}
              </select>
              ${behavior === OTHER_ACTION
                ? html`<span class="hint">Edit this action in YAML.</span>`
                : nothing}
            </label>
          `;
        })}
        <label>
          Timer helper
          <input
            type="text"
            class="timer-entity"
            list="${DATALIST_ID}-timers"
            placeholder="timer.chores"
            .value=${config.timer_entity ?? ""}
            @input=${(e: Event) =>
              this._update({ timer_entity: (e.target as HTMLInputElement).value.trim() })}
          />
        </label>
        <datalist id="${DATALIST_ID}-timers">
          ${Object.keys(this.hass.states)
            .filter((id) => id.startsWith("timer."))
            .sort()
            .map((id) => html`<option value=${id}></option>`)}
        </datalist>
      </div>
    `;
  }

  private _renderFallbackColorFields() {
    const data = this._formData();
    return html`
      <label>
        High value threshold (points)
        <input
          type="number"
          min="1"
          .value=${String(data.high_points)}
          @input=${(e: Event) => {
            const value = Number((e.target as HTMLInputElement).value);
            if (Number.isFinite(value) && value > 0) this._update({ high_points: value });
          }}
        />
      </label>
      <div class="colors">
        ${COLOR_KEYS.map(
          (key) => html`
            <label class="color-item">
              <input
                type="color"
                .value=${rgbToHex(data[key] as RgbColor)}
                @input=${(e: Event) =>
                  this._update({
                    [key]: parseColor(
                      (e.target as HTMLInputElement).value,
                      COLOR_DEFAULTS[key]
                    ),
                  })}
              />
              ${LABELS[key]}
            </label>
          `
        )}
      </div>
    `;
  }

  /**
   * Merge `changes` into the config, drop values equal to their defaults
   * (show_description/show_points true, show_duration and color_by_points false, default threshold/colors, unset
   * actions) so the YAML stays minimal, then notify Lovelace. The color
   * settings are kept while color_by_points is off, so toggling it back on
   * restores them.
   */
  protected _update(changes: Partial<ChoreOptionsEditorConfig>): void {
    const next: ChoreOptionsEditorConfig = { ...this._config, ...changes };
    for (const kind of GESTURES) {
      const behaviorKey = `${kind}_behavior`;
      const actionKey = `${kind}_action` as const;
      const behavior = next[behaviorKey] as string | undefined;
      delete next[behaviorKey];
      if (behavior === undefined) continue;
      if (behavior !== OTHER_ACTION) {
        next[actionKey] = { action: behavior };
      } else if (behaviorFor(kind, next[actionKey]) !== OTHER_ACTION) {
        // Just switched to "Other": start from a standard HA action so its
        // own editor appears.
        next[actionKey] = { action: "more-info" };
      }
    }
    for (const key of this._extraToggles()) {
      if (!next[key]) delete next[key];
    }
    // Extra fields equal to their defaults are dropped too.
    for (const [key, value] of Object.entries(this._extraDefaults())) {
      if (next[key] === undefined || next[key] === value) delete next[key];
    }
    if (next.show_description !== false) delete next.show_description;
    if (next.show_points !== false) delete next.show_points;
    if (!next.show_duration) delete next.show_duration;
    if (!next.timer_entity) delete next.timer_entity;
    if (!next.color_by_points) delete next.color_by_points;
    if (next.high_points === undefined || next.high_points === DEFAULT_HIGH_POINTS) {
      delete next.high_points;
    }
    for (const key of COLOR_KEYS) {
      const value = next[key];
      if (value === undefined || sameColor(parseColor(value, COLOR_DEFAULTS[key]), COLOR_DEFAULTS[key])) {
        delete next[key];
      }
    }
    for (const kind of GESTURES) {
      const key = `${kind}_action` as const;
      const value = next[key];
      // A bare default action is the same as leaving it unset.
      const isDefault =
        value?.action === DEFAULT_GESTURE_ACTIONS[kind] && Object.keys(value).length === 1;
      if (!value || isDefault) delete next[key];
    }
    this._config = next;

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: next },
        bubbles: true,
        composed: true,
      })
    );
  }

  static styles = css`
    .form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 8px 0;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
    }
    .hint {
      font-size: 12px;
    }
    input[type="text"],
    input[type="number"],
    select {
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .colors {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
    }
    .color-item {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }
    .checkbox-item {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-chores-chore-card-editor": SimpleChoresChoreCardEditor;
  }
}

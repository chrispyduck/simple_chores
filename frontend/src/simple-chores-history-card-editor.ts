import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { HomeAssistant, knownAssignees, parseChores } from "./types";
import type { HistoryCardConfig } from "./simple-chores-history-card";

const DEFAULT_DAYS = 7;

const DATALIST_ID = "simple-chores-history-card-editor-assignees";

/**
 * Visual (GUI) config editor for simple-chores-history-card, wired up via
 * SimpleChoresHistoryCard.getConfigElement(). Lovelace's card editor dialog
 * creates one of these, sets `.hass` and calls `setConfig()`, then listens
 * for the `config-changed` event this fires on every edit - the same
 * contract every built-in Lovelace card editor follows.
 *
 * The assignee suggestions come from live chore sensors (parseChores),
 * not the admin-only user list the panel uses elsewhere, since this card -
 * and its editor - needs to work for non-admin dashboard editors too.
 */
@customElement("simple-chores-history-card-editor")
export class SimpleChoresHistoryCardEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config: HistoryCardConfig = {
    type: "custom:simple-chores-history-card",
    assignee: "",
  };

  setConfig(config: HistoryCardConfig): void {
    this._config = config;
  }

  protected render() {
    if (!this.hass) return nothing;

    const config = this._config;
    const assignees = knownAssignees(parseChores(this.hass.states), []);

    return html`
      <div class="form">
        <label>
          Assignee
          <input
            type="text"
            list=${DATALIST_ID}
            placeholder="e.g. alice"
            .value=${config.assignee ?? ""}
            @input=${(e: Event) =>
              this._update({ assignee: (e.target as HTMLInputElement).value })}
          />
        </label>
        <datalist id=${DATALIST_ID}>
          ${assignees.map((a) => html`<option value=${a}></option>`)}
        </datalist>

        <label>
          Title (optional)
          <input
            type="text"
            placeholder="No header"
            .value=${config.title ?? ""}
            @input=${(e: Event) =>
              this._update({ title: (e.target as HTMLInputElement).value })}
          />
        </label>

        <label>
          Days to show
          <input
            type="number"
            min="1"
            .value=${String(config.days ?? DEFAULT_DAYS)}
            @input=${(e: Event) => {
              const value = Number((e.target as HTMLInputElement).value);
              if (Number.isFinite(value) && value > 0) this._update({ days: value });
            }}
          />
        </label>

        <div class="hint">Event types to show</div>
        <div class="checkboxes">
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${config.show_completed ?? true}
              @change=${(e: Event) =>
                this._update({
                  show_completed: (e.target as HTMLInputElement).checked,
                })}
            />
            Completed
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${config.show_uncompleted ?? true}
              @change=${(e: Event) =>
                this._update({
                  show_uncompleted: (e.target as HTMLInputElement).checked,
                })}
            />
            Uncompleted
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${config.show_missed ?? true}
              @change=${(e: Event) =>
                this._update({ show_missed: (e.target as HTMLInputElement).checked })}
            />
            Missed
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              .checked=${config.show_reset ?? false}
              @change=${(e: Event) =>
                this._update({ show_reset: (e.target as HTMLInputElement).checked })}
            />
            Reset
          </label>
        </div>
      </div>
    `;
  }

  /** Merge `changes` into the config, drop an empty title, then notify Lovelace. */
  private _update(changes: Partial<HistoryCardConfig>): void {
    const next: HistoryCardConfig = { ...this._config, ...changes };
    if (!next.title) delete next.title;
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
    input[type="text"],
    input[type="number"] {
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .hint {
      font-size: 12px;
      color: var(--secondary-text-color, #727272);
    }
    .checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
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
    "simple-chores-history-card-editor": SimpleChoresHistoryCardEditor;
  }
}

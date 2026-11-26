import { html, nothing } from "lit";
import { state } from "lit/decorators.js";
import { customElementOnce } from "./define-once";

import { knownAssignees, parseChores } from "./types";
import {
  SimpleChoresChoreCardEditor,
  type ChoreOptionsEditorConfig,
  type FormSchema,
} from "./simple-chores-chore-card-editor";
import { DEFAULT_HIDE_COMPLETED_AFTER } from "./simple-chores-chore-list-card";

const DATALIST_ID = "simple-chores-chore-list-card-editor-assignees";

const LABELS: Record<string, string> = {
  assignee: "Assignee",
  show_not_requested: "Show not requested chores",
  completed_last: "Move completed chores to the end",
  hide_completed: "Hide completed chores",
  hide_completed_after: "Hide completed chores after (seconds)",
};

const HELPERS: Record<string, string> = {
  hide_completed_after: "How long a completed chore stays visible before it fades out.",
};

/**
 * Visual config editor for simple-chores-chore-list-card. Identical to the
 * chore card's editor - every display and action option carries over to each
 * chore in the list - except the target is an assignee instead of a single
 * chore entity, plus list-only options: not-requested chores, moving
 * completed chores to the end, and hiding them after a delay.
 *
 * Assignee suggestions come from live chore sensors (no admin API needed),
 * like the history card's editor.
 */
@customElementOnce("simple-chores-chore-list-card-editor")
export class SimpleChoresChoreListCardEditor extends SimpleChoresChoreCardEditor {
  @state() protected _config: ChoreOptionsEditorConfig = {
    type: "custom:simple-chores-chore-list-card",
    assignee: "",
  };

  private _assignees(): string[] {
    return knownAssignees(parseChores(this.hass.states), []);
  }

  protected _targetSchema(): FormSchema[] {
    return [
      {
        name: "assignee",
        required: true,
        selector: {
          select: {
            options: this._assignees(),
            custom_value: true,
            mode: "dropdown",
          },
        },
      },
    ];
  }

  protected _renderFallbackTarget() {
    return html`
      <label>
        Assignee
        <input
          type="text"
          list=${DATALIST_ID}
          placeholder="username"
          .value=${(this._config.assignee as string | undefined) ?? ""}
          @input=${(e: Event) =>
            this._update({ assignee: (e.target as HTMLInputElement).value })}
        />
      </label>
      <datalist id=${DATALIST_ID}>
        ${this._assignees().map((a) => html`<option value=${a}></option>`)}
      </datalist>
    `;
  }

  protected _extraToggles(): string[] {
    return ["show_not_requested", "completed_last"];
  }

  protected _extraDefaults(): Record<string, unknown> {
    return { hide_completed: true, hide_completed_after: DEFAULT_HIDE_COMPLETED_AFTER };
  }

  private _hideCompleted(): boolean {
    return (this._config.hide_completed as boolean | undefined) ?? true;
  }

  protected _extraSchema(): FormSchema[] {
    return [
      { name: "hide_completed", selector: { boolean: {} } },
      ...(this._hideCompleted()
        ? [
            {
              name: "hide_completed_after",
              selector: {
                number: { min: 0, step: 1, mode: "box", unit_of_measurement: "s" },
              },
            },
          ]
        : []),
    ];
  }

  protected _renderFallbackExtras() {
    const after =
      (this._config.hide_completed_after as number | undefined) ?? DEFAULT_HIDE_COMPLETED_AFTER;
    return html`
      <label class="checkbox-item">
        <input
          type="checkbox"
          .checked=${this._hideCompleted()}
          @change=${(e: Event) =>
            this._update({ hide_completed: (e.target as HTMLInputElement).checked })}
        />
        ${LABELS.hide_completed}
      </label>
      ${this._hideCompleted()
        ? html`<label>
            ${LABELS.hide_completed_after}
            <input
              type="number"
              min="0"
              class="hide-after"
              .value=${String(after)}
              @input=${(e: Event) => {
                const value = Number((e.target as HTMLInputElement).value);
                if (Number.isFinite(value) && value >= 0) {
                  this._update({ hide_completed_after: value });
                }
              }}
            />
          </label>`
        : nothing}
    `;
  }

  protected _helper(name: string): string | undefined {
    return HELPERS[name] ?? super._helper(name);
  }

  protected _label(name: string): string {
    return LABELS[name] ?? super._label(name);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-chores-chore-list-card-editor": SimpleChoresChoreListCardEditor;
  }
}

import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  DOMAIN as SERVICE_DOMAIN,
  HistoryAction,
  HistoryEntry,
  HomeAssistant,
  historyActionClass,
  historyActionLabel,
  parseHistoryEntries,
} from "./types";
// Registers <simple-chores-history-card-editor>, returned below by
// getConfigElement() - imported for its side effect of defining the
// custom element, not used directly in this file.
import "./simple-chores-history-card-editor";

export interface HistoryCardConfig {
  type: string;
  assignee: string;
  title?: string;
  days?: number;
  show_completed?: boolean;
  show_uncompleted?: boolean;
  show_missed?: boolean;
  show_reset?: boolean;
}

const DEFAULT_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Read-only Lovelace card showing one assignee's recent chore-history
 * entries - a "how you're doing" view for a kid's own dashboard, distinct
 * from the admin panel's full History tab (which needs admin access and
 * lets you edit chores/privileges). Fetches once when the card is added to
 * the page, the same fetch-on-load pattern the admin panel's History tab
 * uses, rather than polling or subscribing to live updates.
 */
@customElement("simple-chores-history-card")
export class SimpleChoresHistoryCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config!: HistoryCardConfig;
  @state() private _entries: HistoryEntry[] | null = null;
  @state() private _error: string | null = null;
  @state() private _loading = false;

  setConfig(config: HistoryCardConfig): void {
    if (!config.assignee) {
      throw new Error("simple-chores-history-card: 'assignee' is required");
    }
    this._config = config;
  }

  protected updated(_changed: PropertyValues): void {
    // Fetch once both `hass` and `setConfig` have landed - Lovelace (and
    // this card's own tests) don't guarantee which one is set first, or
    // that either is set before the element connects to the DOM.
    if (this.hass && this._config && this._entries === null && !this._loading) {
      void this._loadHistory();
    }
  }

  getCardSize(): number {
    return 1 + Math.min(this._config?.days ?? DEFAULT_DAYS, 10);
  }

  static getStubConfig(): Partial<HistoryCardConfig> {
    return { assignee: "" };
  }

  static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement("simple-chores-history-card-editor");
  }

  private async _loadHistory(): Promise<void> {
    this._loading = true;
    try {
      const result = await this.hass.callWS<{
        response?: { entries?: unknown[] };
      }>({
        type: "call_service",
        domain: SERVICE_DOMAIN,
        service: "get_history",
        service_data: {},
        return_response: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._entries = parseHistoryEntries(result?.response?.entries as any[]);
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
    } finally {
      this._loading = false;
    }
  }

  private _actionEnabled(action: HistoryAction): boolean {
    switch (action) {
      case "completed":
        return this._config.show_completed ?? true;
      case "uncompleted":
        return this._config.show_uncompleted ?? true;
      case "missed":
        return this._config.show_missed ?? true;
      case "reset":
        return this._config.show_reset ?? false;
      default:
        return true;
    }
  }

  protected render() {
    if (!this._config) return nothing;

    const days = this._config.days ?? DEFAULT_DAYS;
    const cutoff = Date.now() - days * MS_PER_DAY;

    const entries = (this._entries ?? [])
      .filter(
        (e) =>
          e.assignee === this._config.assignee &&
          this._actionEnabled(e.action) &&
          new Date(e.timestamp).getTime() >= cutoff
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return html`
      <ha-card header=${this._config.title ?? nothing}>
        <div class="card-content">
          ${this._error
            ? html`<p class="error">${this._error}</p>`
            : this._entries === null
              ? html`<p class="empty">Loading&hellip;</p>`
              : entries.length === 0
                ? html`<p class="empty">Nothing to show yet.</p>`
                : this._renderTable(entries)}
        </div>
      </ha-card>
    `;
  }

  private _renderTable(entries: HistoryEntry[]) {
    const rows = [];
    let lastDateKey: string | null = null;
    for (const entry of entries) {
      const dateKey = this._dateKey(entry.timestamp);
      if (dateKey !== lastDateKey) {
        rows.push(
          html`<div class="date-header">${this._formatDate(entry.timestamp)}</div>`
        );
        lastDateKey = dateKey;
      }
      rows.push(this._renderRow(entry));
    }

    return html`
      <div class="table">
        <div class="row col-header">
          <div class="cell time">Time</div>
          <div class="cell event">Event</div>
          <div class="cell chore">Chore</div>
          <div class="cell col-span-header">Earned</div>
          <div class="cell col-span-header">Missed</div>
        </div>
        ${rows}
      </div>
    `;
  }

  private _renderRow(entry: HistoryEntry) {
    const pointsClass =
      entry.pointsDelta > 0
        ? "points-positive"
        : entry.pointsDelta < 0
          ? "points-negative"
          : "";
    const pointsLabel = entry.pointsDelta > 0 ? `+${entry.pointsDelta}` : entry.pointsDelta;

    return html`
      <div class="row">
        <div class="cell time">${this._formatTime(entry.timestamp)}</div>
        <div class="cell event">
          <span class="state-chip ${historyActionClass(entry.action)}">
            ${historyActionLabel(entry.action)}
          </span>
        </div>
        <div class="cell chore">${entry.choreName}</div>
        <div class="cell delta ${pointsClass}">
          ${entry.pointsDelta !== 0 ? pointsLabel : nothing}
        </div>
        <div class="cell earned">${entry.pointsTotal}</div>
        <div class="cell delta points-negative">
          ${entry.pointsMissed > 0 ? `+${entry.pointsMissed}` : nothing}
        </div>
        <div class="cell missed">${entry.missedTotal ?? "—"}</div>
      </div>
    `;
  }

  /** Grouping key only - not for display, so locale/format changes can't split a day. */
  private _dateKey(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : date.toDateString();
  }

  private _formatDate(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
  }

  private _formatTime(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  static styles = css`
    .card-content {
      padding: 4px 16px 16px;
    }
    .empty,
    .error {
      padding: 8px 0;
      color: var(--secondary-text-color, #727272);
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .table {
      overflow-x: auto;
    }
    .date-header {
      padding: 12px 0 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
    }
    .date-header:first-of-type {
      padding-top: 0;
    }
    .row {
      display: grid;
      grid-template-columns: 0.6fr 0.9fr 1.6fr 0.35fr 0.25fr 0.35fr 0.25fr;
      gap: 6px;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      font-size: 13px;
      min-width: 460px;
    }
    /* Each .row is its own grid, so fr-tracks only line up across rows if
       no cell's content can force its track wider than its fr share - the
       default min-width:auto on grid items sizes to content otherwise
       (most visibly .chore, where a long name ignores its white-space:
       nowrap + ellipsis and just widens the track instead of truncating). */
    .cell {
      min-width: 0;
    }
    .row:last-child {
      border-bottom: none;
    }
    .col-header {
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    /* Covers its delta+total column pair, so those two can be narrower
       individually while the label still reads clearly across both. */
    .col-span-header {
      grid-column: span 2;
      text-align: center;
    }
    .cell.chore {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--primary-text-color, #212121);
    }
    .cell.earned,
    .cell.missed,
    .cell.delta {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .cell.delta {
      font-size: 11px;
    }
    .points-positive {
      color: #2e7d32;
    }
    .points-negative {
      color: var(--error-color, #db4437);
    }
    .state-chip {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .state-good {
      background: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
    }
    .state-warn {
      background: rgba(255, 152, 0, 0.15);
      color: #ef6c00;
    }
    .state-bad {
      background: rgba(219, 68, 55, 0.12);
      color: var(--error-color, #db4437);
    }
    .state-neutral {
      background: rgba(0, 0, 0, 0.06);
      color: var(--secondary-text-color, #727272);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-chores-history-card": SimpleChoresHistoryCard;
  }
  interface Window {
    customCards?: {
      type: string;
      name: string;
      description: string;
      preview?: boolean;
    }[];
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "simple-chores-history-card",
  name: "Chore History",
  description: "Shows one assignee's recent Simple Chores activity.",
  preview: false,
});

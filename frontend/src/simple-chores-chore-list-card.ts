import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { customElementOnce } from "./define-once";

import { HassEntity, HomeAssistant, knownAssignees, parseChores } from "./types";
import {
  isChoreEntity,
  type ChoreCardConfig,
  type ChoreCardOptions,
  type SimpleChoresChoreCard,
} from "./simple-chores-chore-card";
// Registers <simple-chores-chore-card> (which renders each chore) and
// <simple-chores-chore-list-card-editor> - imported for side effects.
import "./simple-chores-chore-card";
import "./simple-chores-chore-list-card-editor";

export interface ChoreListCardConfig extends ChoreCardOptions {
  type: string;
  /** Assignee (HA username) whose chores to show. */
  assignee: string;
  /** Also show chores that aren't requested right now. Defaults to false. */
  show_not_requested?: boolean;
  /** Fade out completed chores after hide_completed_after. Defaults to true. */
  hide_completed?: boolean;
  /** Seconds a completed chore stays visible before it's hidden. Default 30. */
  hide_completed_after?: number;
  /** Sort completed chores after outstanding ones. Defaults to false. */
  completed_last?: boolean;
}

export const DEFAULT_HIDE_COMPLETED_AFTER = 30;
/** Fade-out duration for a chore being hidden. */
export const HIDE_ANIMATION_MS = 300;
/** Slide duration for chores moving to a new position in the list. */
export const MOVE_ANIMATION_MS = 250;

/** Config keys that belong to the list, not to each chore card. */
const LIST_ONLY_KEYS = [
  "type",
  "assignee",
  "show_not_requested",
  "hide_completed",
  "hide_completed_after",
  "completed_last",
] as const;

/**
 * The assignee's chore sensors to show, sorted by chore name. Order is
 * otherwise independent of state so a tile doesn't jump around under a
 * kid's finger the moment they complete it (unless completed_last asks
 * for exactly that).
 */
export function assigneeChoreEntityIds(
  states: Record<string, HassEntity>,
  assignee: string,
  showNotRequested = false
): string[] {
  const wanted = assignee.toLowerCase();
  return Object.entries(states)
    .filter(
      ([id, entity]) =>
        isChoreEntity(id, entity) &&
        String(entity.attributes.assignee ?? "").toLowerCase() === wanted &&
        (showNotRequested || entity.state !== "Not Requested")
    )
    .map(([id, entity]) => ({
      id,
      name: String(entity.attributes.chore_name ?? id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    .map((c) => c.id);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Lovelace card listing every chore for one assignee. Each chore is drawn by
 * a real <simple-chores-chore-card> configured with this card's options, so
 * the two always look and behave the same. The list itself has no
 * background - it reads as a stack of individual chore cards.
 *
 * Completed chores fade out hide_completed_after seconds after they were
 * completed (timed from the entity's last_changed, so a reload doesn't
 * restart the clock - chores completed long ago simply aren't shown).
 * Cards that change position slide to their new spot.
 */
@customElementOnce("simple-chores-chore-list-card")
export class SimpleChoresChoreListCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config!: ChoreListCardConfig;

  /** Visible chore entity ids, in display order. */
  @state() private _entityIds: string[] = [];

  /** Bumped by timers/animations to force the visible list to be recomputed. */
  @state() private _tick = 0;

  /** Child cards by entity id, reused across renders to keep their state. */
  private _cards = new Map<string, SimpleChoresChoreCard>();

  /** Chores mid fade-out, with their animation (null if not animated). */
  private _hiding = new Map<string, Animation | null>();

  /** Chores whose fade-out finished; they stay out until reopened. */
  private _hidden = new Set<string>();

  /** True when the assignee has chores but every one is hidden as done. */
  @state() private _allDone = false;

  /** Fallback completion time for entities without last_changed. */
  private _firstSeenComplete = new Map<string, number>();

  /** Card positions before a reorder, for the slide animation in updated(). */
  private _prevRects: Map<string, DOMRect> | null = null;

  private _hideTimer?: ReturnType<typeof setTimeout>;

  setConfig(config: ChoreListCardConfig): void {
    if (!config.assignee) {
      throw new Error("simple-chores-chore-list-card: 'assignee' is required");
    }
    this._config = config;
  }

  getCardSize(): number {
    return Math.max(1, this._entityIds.length * 2);
  }

  static getStubConfig(hass?: HomeAssistant): Partial<ChoreListCardConfig> {
    const assignees = hass ? knownAssignees(parseChores(hass.states), []) : [];
    return { assignee: assignees[0] ?? "" };
  }

  static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement("simple-chores-chore-list-card-editor");
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Re-arm the hide timer cleared on disconnect.
    if (this._config) this._tick++;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this._hideTimer);
  }

  /** When a completed chore should be hidden, or null if it shouldn't be. */
  private _hideAt(id: string, now: number): number | null {
    const entity = this.hass.states[id];
    if (!entity || entity.state !== "Complete") {
      this._firstSeenComplete.delete(id);
      return null;
    }
    if (!(this._config.hide_completed ?? true)) return null;

    let since = entity.last_changed ? Date.parse(entity.last_changed) : NaN;
    if (Number.isNaN(since)) {
      if (!this._firstSeenComplete.has(id)) this._firstSeenComplete.set(id, now);
      since = this._firstSeenComplete.get(id)!;
    }
    const after = Math.max(0, this._config.hide_completed_after ?? DEFAULT_HIDE_COMPLETED_AFTER);
    return since + after * 1000;
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    if (!this._config || !this.hass) return;
    if (changed.has("_config")) {
      for (const [id, card] of this._cards) card.setConfig(this._childConfig(id));
    }
    if (changed.has("hass") || changed.has("_config") || changed.has("_tick")) {
      this._refreshEntityIds();
    }
    for (const id of [...this._cards.keys()]) {
      if (!this._entityIds.includes(id)) this._cards.delete(id);
    }
    for (const id of this._entityIds) {
      let card = this._cards.get(id);
      if (!card) {
        card = document.createElement("simple-chores-chore-card");
        card.setConfig(this._childConfig(id));
        this._cards.set(id, card);
      }
      // The child's own shouldUpdate skips re-rendering unless its entity changed.
      card.hass = this.hass;
    }
  }

  private _refreshEntityIds(): void {
    const now = Date.now();
    const displayed = new Set(this._entityIds);
    let nextHide = Infinity;

    const candidates = assigneeChoreEntityIds(
      this.hass.states,
      this._config.assignee,
      this._config.show_not_requested ?? false
    );
    const ids = candidates.filter((id) => {
      const at = this._hideAt(id, now);
      if (at === null || at > now) {
        // Reopened, re-completed or hiding turned off: bring it back.
        if (this._hiding.has(id)) this._cancelHide(id);
        this._hidden.delete(id);
        if (at !== null) nextHide = Math.min(nextHide, at);
        return true;
      }
      if (this._hiding.has(id)) return true;
      if (this._hidden.has(id)) return false;
      // Due now. Fade it out if it's on screen; otherwise (e.g. completed
      // long before the page loaded) just leave it out.
      if (displayed.has(id) && this._cards.get(id)?.isConnected) {
        this._startHide(id);
        return true;
      }
      return false;
    });

    if (this._config.completed_last) {
      // Array.sort is stable, so name order holds within each group.
      const done = (id: string) => (this.hass.states[id]?.state === "Complete" ? 1 : 0);
      ids.sort((a, b) => done(a) - done(b));
    }

    this._allDone = ids.length === 0 && candidates.length > 0;

    clearTimeout(this._hideTimer);
    if (nextHide !== Infinity && this.isConnected) {
      // setTimeout overflows past ~24.8 days and fires immediately; cap it
      // and just re-check then.
      const delay = Math.min(nextHide - now, 2 ** 31 - 1);
      this._hideTimer = setTimeout(() => this._tick++, delay);
    }

    if (ids.join("|") !== this._entityIds.join("|")) {
      this._prevRects = this._captureRects();
      this._entityIds = ids;
    }
  }

  private _startHide(id: string): void {
    const card = this._cards.get(id)!;
    card.style.pointerEvents = "none";
    const done = () => {
      if (!this._hiding.has(id)) return;
      this._hiding.delete(id);
      this._hidden.add(id);
      this._tick++;
    };
    if (typeof card.animate !== "function" || prefersReducedMotion()) {
      this._hiding.set(id, null);
      queueMicrotask(done);
      return;
    }
    const animation = card.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.96)" },
      ],
      { duration: HIDE_ANIMATION_MS, easing: "ease-in", fill: "forwards" }
    );
    this._hiding.set(id, animation);
    animation.onfinish = done;
  }

  private _cancelHide(id: string): void {
    this._hiding.get(id)?.cancel();
    this._hiding.delete(id);
    const card = this._cards.get(id);
    if (card) card.style.pointerEvents = "";
  }

  private _captureRects(): Map<string, DOMRect> | null {
    if (prefersReducedMotion()) return null;
    const rects = new Map<string, DOMRect>();
    for (const [id, card] of this._cards) {
      if (card.isConnected) rects.set(id, card.getBoundingClientRect());
    }
    return rects;
  }

  protected updated(): void {
    // FLIP: slide cards that moved from their old position to the new one -
    // covers both completed_last reordering and the gap a hidden chore leaves.
    const prev = this._prevRects;
    this._prevRects = null;
    if (!prev) return;
    for (const [id, card] of this._cards) {
      const before = prev.get(id);
      if (!before || typeof card.animate !== "function" || this._hiding.has(id)) continue;
      const dy = before.top - card.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;
      card.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
        { duration: MOVE_ANIMATION_MS, easing: "ease-out" }
      );
    }
  }

  private _childConfig(entity: string): ChoreCardConfig {
    const options: Record<string, unknown> = { ...this._config };
    for (const key of LIST_ONLY_KEYS) delete options[key];
    return { ...options, type: "custom:simple-chores-chore-card", entity };
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;
    if (this._entityIds.length === 0) {
      return html`<ha-card class="empty">
        ${this._allDone ? "All done!" : `No chores for ${this._config.assignee}`}
      </ha-card>`;
    }
    return html`${this._entityIds.map((id) => this._cards.get(id))}`;
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      /* Same spacing HA's own vertical-stack card uses between cards. */
      gap: var(--vertical-stack-card-gap, var(--stack-card-gap, 8px));
      background: none;
    }
    .empty {
      padding: 16px;
      color: var(--secondary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-chores-chore-list-card": SimpleChoresChoreListCard;
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "simple-chores-chore-list-card",
  name: "Chore list",
  description: "Shows every Simple Chores chore for one assignee as a list of chore cards.",
  preview: true,
});

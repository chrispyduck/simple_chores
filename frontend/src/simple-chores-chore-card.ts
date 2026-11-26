import { LitElement, html, css, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { customElementOnce } from "./define-once";

import {
  CATEGORY_ENTITY_PREFIX,
  CHORE_ENTITY_PREFIX,
  ChoreStateValue,
  DEFAULT_CHORE_ICON,
  DOMAIN,
  HassEntity,
  HomeAssistant,
  PRIVILEGE_ENTITY_PREFIX,
  SUMMARY_ENTITY_PREFIX,
  formatDuration,
} from "./types";
import {
  DEFAULT_HIGH_POINTS,
  DEFAULT_HIGH_POINTS_COLOR,
  DEFAULT_LOW_POINTS_COLOR,
  RgbColor,
  parseColor,
  pointsColor,
} from "./chore-card-colors";
// Re-exported for callers that already import them from the card.
export {
  DEFAULT_HIGH_POINTS,
  DEFAULT_HIGH_POINTS_COLOR,
  DEFAULT_LOW_POINTS_COLOR,
  parseColor,
  pointsColor,
};
export type { RgbColor };
import {
  type ActionKind,
  type ChoreOperation,
  CHORE_MENU_ACTION,
  DEFAULT_GESTURE_ACTIONS,
  choreAction,
  choreMenuItems,
  formatClock,
  timerDuration,
  timerStatus,
} from "./chore-actions";
// Registers <simple-chores-chore-card-editor>, returned below by
// getConfigElement() - imported for its side effect only.
import "./simple-chores-chore-card-editor";

/**
 * A standard Lovelace action config (`action: more-info`, `navigate`,
 * `perform-action`, `none`, ...). Executed by HA itself via the
 * `hass-action` event, so every action HA supports works here.
 */
export interface ActionConfig {
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type { ActionKind };

export interface ChoreCardConfig {
  type: string;
  entity: string;
  /** Show the chore's description line. Defaults to true. */
  show_description?: boolean;
  /** Show the points badge. Defaults to true. */
  show_points?: boolean;
  /** Show the chore's suggested duration, if it has one. Defaults to false. */
  show_duration?: boolean;
  /**
   * Any HA action, or a chore action (see chore-actions.ts): complete-chore,
   * chore-menu, complete-chore, start-chore, start-or-complete-chore,
   * reopen-chore. Unset = chore-menu (slide-in panel of options).
   */
  tap_action?: ActionConfig;
  /** Unset = reopen-chore (mark incomplete if it's done or in progress). */
  hold_action?: ActionConfig;
  /** Unset = do nothing. */
  double_tap_action?: ActionConfig;
  /**
   * An HA timer helper (`timer.*`) to run while the chore is in progress.
   * Starting the chore starts it for the chore's suggested duration (or the
   * helper's own default without one); the options panel offers pause /
   * resume / stop, and the card shows its countdown. Unset = the panel has
   * no timer options at all.
   */
  timer_entity?: string;
  /** Color the points badge by point value. Defaults to false. */
  color_by_points?: boolean;
  /** Points at/above which a chore gets the full high color. Default 5. */
  high_points?: number;
  /** Color at 0 points, as [r, g, b] (what HA's color picker saves) or "#rrggbb". */
  low_points_color?: RgbColor | string;
  /** Color at/above high_points, as [r, g, b] or "#rrggbb". */
  high_points_color?: RgbColor | string;
}

/** Everything on the chore card's config besides its type and entity. */
export type ChoreCardOptions = Omit<ChoreCardConfig, "type" | "entity">;

/** How long a press must last to count as a hold. Matches HA's own cards. */
export const HOLD_MS = 500;
/** Window for a second tap to count as a double tap. Matches HA's own cards. */
export const DOUBLE_TAP_MS = 250;
/** Pointer movement beyond this (px) cancels the gesture - it's a scroll. */
const MOVE_TOLERANCE = 10;

/**
 * True for a per-assignee chore sensor - i.e. a `sensor.simple_chore_*`
 * entity that isn't one of the privilege/summary/category sensors sharing
 * that prefix. Mirrors the filtering in parseChores().
 */
export function isChoreEntity(entityId: string, entity?: HassEntity): boolean {
  return (
    entityId.startsWith(CHORE_ENTITY_PREFIX) &&
    !entityId.startsWith(PRIVILEGE_ENTITY_PREFIX) &&
    !entityId.startsWith(SUMMARY_ENTITY_PREFIX) &&
    !entityId.startsWith(CATEGORY_ENTITY_PREFIX) &&
    (entity === undefined || Boolean(entity.attributes?.chore_slug))
  );
}

/**
 * Lovelace card showing a single assignee's chore as a large, glanceable
 * tile: icon, name, description and a points badge in the top-right corner.
 * Complete chores are dimmed with a check mark over the icon; everything
 * else renders at full strength, with Active chores' badge highlighted.
 *
 * Tap / hold / double-tap each take a chore action or a standard Lovelace
 * action config. Left unset, tap slides in a panel of the options that fit
 * the chore's state (complete / start / pause / resume / stop / mark
 * incomplete) and hold marks it incomplete again. Active chores with a
 * timer show a live countdown.
 */
@customElementOnce("simple-chores-chore-card")
export class SimpleChoresChoreCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config!: ChoreCardConfig;

  private _holdTimer?: ReturnType<typeof setTimeout>;
  private _tapTimer?: ReturnType<typeof setTimeout>;
  /** True once the current press has fired a hold, or moved into a scroll. */
  private _pressConsumed = false;
  private _pressStart: { x: number; y: number } | null = null;

  /** The chore's state at the last render, to spot it becoming Active. */
  private _lastState?: string;

  /** True while the "just started" animation plays. */
  @state() private _activating = false;

  /** Whether the slide-in options panel is open. */
  @state() private _menuOpen = false;

  /** Bumped every second while a timer runs, to re-render the countdown. */
  @state() private _clockTick = 0;
  private _clockInterval?: ReturnType<typeof setInterval>;

  setConfig(config: ChoreCardConfig): void {
    if (!config.entity) {
      throw new Error("simple-chores-chore-card: 'entity' is required");
    }
    if (config.entity !== this._config?.entity) this._lastState = undefined;
    this._config = config;
  }

  getCardSize(): number {
    return 2;
  }

  static getStubConfig(hass?: HomeAssistant): Partial<ChoreCardConfig> {
    const first = Object.entries(hass?.states ?? {}).find(([id, entity]) =>
      isChoreEntity(id, entity)
    );
    return { entity: first?.[0] ?? "" };
  }

  static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement("simple-chores-chore-card-editor");
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTimers();
    this._stopClock();
    this._menuOpen = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Restart the countdown clock stopped on disconnect, if still needed.
    if (this.hasUpdated) this._syncClock();
  }

  protected shouldUpdate(changed: Map<string, unknown>): boolean {
    // Only re-render when this card's own entity changed, not on every
    // state change anywhere in Home Assistant.
    if (changed.has("_config") || !this._config) return true;
    // Our own UI state (panel, countdown, animation) always re-renders.
    if (changed.has("_menuOpen") || changed.has("_clockTick") || changed.has("_activating")) {
      return true;
    }
    const oldHass = changed.get("hass") as HomeAssistant | undefined;
    if (!oldHass) return true;
    const timer = this._config.timer_entity;
    return (
      oldHass.states[this._config.entity] !== this.hass.states[this._config.entity] ||
      (timer !== undefined && oldHass.states[timer] !== this.hass.states[timer])
    );
  }

  protected willUpdate(): void {
    const current = this._config && this.hass?.states[this._config.entity]?.state;
    if (current === undefined) return;
    // Animate only a live change into Active, not a chore that was already
    // in progress when the card first rendered.
    if (current === "Active" && this._lastState !== undefined && this._lastState !== "Active") {
      this._activating = true;
    } else if (current !== "Active") {
      this._activating = false;
    }
    this._lastState = current;
  }

  protected render() {
    if (!this._config || !this.hass) return nothing;

    const entity = this.hass.states[this._config.entity];
    if (!entity) {
      return html`
        <ha-card>
          <div class="warning">Entity not found: ${this._config.entity}</div>
        </ha-card>
      `;
    }

    const attrs = entity.attributes;
    const choreState = entity.state as ChoreStateValue;
    const name: string = attrs.chore_name ?? attrs.friendly_name ?? this._config.entity;
    const description: string = attrs.description ?? "";
    const icon: string = attrs.icon ?? DEFAULT_CHORE_ICON;
    const points: number | undefined = attrs.points ?? attrs.default_points;
    const complete = choreState === "Complete";
    const active = choreState === "Active";
    const showDescription = this._config.show_description ?? true;
    const showPoints = this._config.show_points ?? true;
    const duration: number | null =
      this._config.show_duration && attrs.suggested_duration > 0
        ? attrs.suggested_duration
        : null;
    const status = this._timerStatus(entity);
    const remaining = status?.remaining ?? null;
    const paused = status?.paused ?? false;

    return html`
      <ha-card
        class="chore ${complete
          ? "complete"
          : choreState === "Not Requested"
            ? "not-requested"
            : "outstanding"} ${active ? "active" : ""} ${this._menuOpen ? "menu-open" : ""} ${this
          ._activating
          ? "activating"
          : ""}"
        tabindex="0"
        role="button"
        aria-label="${name}: ${choreState}"
        aria-expanded=${this._menuOpen ? "true" : "false"}
        aria-disabled=${choreState === "Not Requested" ? "true" : "false"}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._cancelPress}
        @pointerleave=${this._cancelPress}
        @contextmenu=${(e: Event) => e.preventDefault()}
        @keydown=${this._onKeyDown}
        @animationend=${(e: AnimationEvent) => {
          if (e.animationName === "sc-activate") this._activating = false;
        }}
      >
        <div class="icon-wrap">
          <ha-icon class="icon" .icon=${icon}></ha-icon>
          ${complete
            ? html`<span class="check"><ha-icon .icon=${"mdi:check"}></ha-icon></span>`
            : active
              ? html`<span class="in-progress" title="In progress">
                  <ha-icon .icon=${"mdi:progress-clock"}></ha-icon>
                </span>`
              : nothing}
        </div>
        <div class="text">
          <div class="name">${name}</div>
          ${description && showDescription
            ? html`<div class="description">${description}</div>`
            : nothing}
          ${duration !== null
            ? html`<div class="duration" title="Suggested duration">
                <ha-icon .icon=${"mdi:timer-outline"}></ha-icon>
                <span>${formatDuration(duration)}</span>
              </div>`
            : nothing}
          ${remaining !== null
            ? html`<div class="timer ${paused ? "paused" : ""} ${remaining <= 0 ? "done" : ""}">
                <ha-icon .icon=${paused ? "mdi:timer-pause-outline" : "mdi:timer-outline"}></ha-icon>
                <span>
                  ${remaining <= 0
                    ? "Time's up!"
                    : `${formatClock(remaining)} left${paused ? " · paused" : ""}`}
                </span>
              </div>`
            : nothing}
        </div>
        ${points !== undefined && showPoints ? this._renderBadge(points) : nothing}
        ${this._renderMenu(entity)}
      </ha-card>
    `;
  }

  /**
   * The slide-in options panel. Always rendered (hidden while closed) so it
   * can animate out as well as in. Pointer events inside it are kept from
   * reaching the card's own gesture handlers.
   */
  private _renderMenu(entity: HassEntity) {
    const open = this._menuOpen;
    const items = choreMenuItems(entity, this._timerEntity());
    const stop = (e: Event) => e.stopPropagation();
    return html`
      <div
        class="scrim ${open ? "open" : ""}"
        @pointerdown=${(e: Event) => {
          e.stopPropagation();
          this._closeMenu();
        }}
        @pointerup=${stop}
      ></div>
      <div
        class="menu ${open ? "open" : ""}"
        role="menu"
        aria-hidden=${open ? "false" : "true"}
        @pointerdown=${stop}
        @pointerup=${stop}
      >
        ${items.map(
          (item, i) => html`
            <button
              class="menu-item ${item.id}"
              role="menuitem"
              style="--i: ${i}"
              tabindex=${open ? "0" : "-1"}
              @click=${(e: Event) => {
                e.stopPropagation();
                this._closeMenu();
                void this._run(item.id);
              }}
            >
              <ha-icon .icon=${item.icon}></ha-icon>
              <span>${item.label}</span>
            </button>
          `
        )}
      </div>
    `;
  }

  /** Whether the press being handled came from the keyboard. */
  private _keyboardPress = false;

  private _openMenu(): void {
    this._menuOpen = true;
    // Keyboard users land on the first option. Not on pointer opens: there's
    // no need, and preventScroll matters - focusing a button that's still
    // sliding in from off-card would otherwise scroll the card's content
    // sideways to reveal it.
    if (!this._keyboardPress) return;
    void this.updateComplete.then(() =>
      this.shadowRoot
        ?.querySelector<HTMLButtonElement>(".menu-item")
        ?.focus({ preventScroll: true })
    );
  }

  private _closeMenu(): void {
    if (!this._menuOpen) return;
    this._menuOpen = false;
    this.shadowRoot?.querySelector<HTMLElement>("ha-card")?.focus({ preventScroll: true });
  }

  protected updated(): void {
    this._syncClock();
  }

  /** The configured timer helper's state, if it's set and exists. */
  private _timerEntity(): HassEntity | undefined {
    const id = this._config.timer_entity;
    return id ? this.hass.states[id] : undefined;
  }

  private _timerStatus(entity: HassEntity) {
    return timerStatus(entity, this._timerEntity(), Boolean(this._config.timer_entity));
  }

  /** Tick every second while a timer is running; stop otherwise. */
  private _syncClock(): void {
    const entity = this._config && this.hass?.states[this._config.entity];
    const status = entity ? this._timerStatus(entity) : null;
    const running = status !== null && !status.paused;
    if (running && this._clockInterval === undefined) {
      this._clockInterval = setInterval(() => this._clockTick++, 1000);
    } else if (!running) {
      this._stopClock();
    }
  }

  private _stopClock(): void {
    clearInterval(this._clockInterval);
    this._clockInterval = undefined;
  }

  private _renderBadge(points: number) {
    const c = this._config;
    if (!c.color_by_points) {
      return html`<div class="badge" title="${points} points">${points}</div>`;
    }
    const [r, g, b] = pointsColor(
      points,
      c.high_points ?? DEFAULT_HIGH_POINTS,
      parseColor(c.low_points_color, DEFAULT_LOW_POINTS_COLOR),
      parseColor(c.high_points_color, DEFAULT_HIGH_POINTS_COLOR)
    );
    // The points color replaces the Active highlight (see .points-colored).
    return html`<div
      class="badge points-colored"
      style="--sc-badge-color: rgb(${r}, ${g}, ${b})"
      title="${points} points"
    >
      ${points}
    </div>`;
  }

  // --- Gestures -----------------------------------------------------------

  private _onPointerDown(e: PointerEvent): void {
    if (e.button !== undefined && e.button !== 0) return;
    if (this._menuOpen) return;
    this._pressConsumed = false;
    this._pressStart = { x: e.clientX, y: e.clientY };
    clearTimeout(this._holdTimer);
    this._holdTimer = setTimeout(() => {
      this._pressConsumed = true;
      this._handleAction("hold");
    }, HOLD_MS);
  }

  private _onPointerMove(e: PointerEvent): void {
    if (!this._pressStart) return;
    const dx = e.clientX - this._pressStart.x;
    const dy = e.clientY - this._pressStart.y;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE) this._cancelPress();
  }

  private _onPointerUp(): void {
    clearTimeout(this._holdTimer);
    const started = this._pressStart !== null;
    this._pressStart = null;
    if (!started || this._pressConsumed) return;

    // Only wait to disambiguate a double tap when one is configured, so a
    // plain tap (the common "complete it" case) responds instantly.
    if (!this._config.double_tap_action || this._config.double_tap_action.action === "none") {
      this._handleAction("tap");
    } else if (this._tapTimer !== undefined) {
      clearTimeout(this._tapTimer);
      this._tapTimer = undefined;
      this._handleAction("double_tap");
    } else {
      this._tapTimer = setTimeout(() => {
        this._tapTimer = undefined;
        this._handleAction("tap");
      }, DOUBLE_TAP_MS);
    }
  }

  private _cancelPress(): void {
    clearTimeout(this._holdTimer);
    this._pressStart = null;
    this._pressConsumed = true;
  }

  private _clearTimers(): void {
    clearTimeout(this._holdTimer);
    clearTimeout(this._tapTimer);
    this._tapTimer = undefined;
  }

  private _onKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape" && this._menuOpen) {
      e.preventDefault();
      this._closeMenu();
      return;
    }
    // Keys on the panel's own buttons are theirs (native button activation).
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._keyboardPress = true;
      try {
        this._handleAction("tap");
      } finally {
        this._keyboardPress = false;
      }
    }
  }

  // --- Actions ------------------------------------------------------------

  private _handleAction(kind: ActionKind): void {
    // A chore that hasn't been requested has nothing to act on - no gesture
    // does anything, including any configured HA action.
    if (this.hass.states[this._config.entity]?.state === "Not Requested") return;
    const action =
      this._config[`${kind}_action`]?.action ?? DEFAULT_GESTURE_ACTIONS[kind];
    if (action === "none") return;
    if (action === CHORE_MENU_ACTION) {
      if (this._menuOpen) this._closeMenu();
      else this._openMenu();
      return;
    }
    const chore = choreAction(action);
    if (chore?.operation) {
      const entity = this.hass.states[this._config.entity];
      const operation = entity && chore.operation(entity.state as ChoreStateValue);
      if (operation) void this._run(operation);
      return;
    }

    // HA's own handler for every standard action (more-info, navigate,
    // perform-action, toggle, url, assist, ...), with confirmation support.
    this._fire("hass-action", {
      config: {
        entity: this._config.entity,
        tap_action: this._config.tap_action,
        hold_action: this._config.hold_action,
        double_tap_action: this._config.double_tap_action,
      },
      action: kind,
    });
  }

  /**
   * Carry out a chore operation: the chore service, plus the matching call
   * on the timer helper when one is configured. The chore goes first, so a
   * failed chore update never leaves the timer running on its own.
   */
  private async _run(operation: ChoreOperation): Promise<void> {
    const entity = this.hass.states[this._config.entity];
    if (!entity) return;
    const chore = {
      chore_slug: entity.attributes.chore_slug,
      user: entity.attributes.assignee,
    };
    const timerId = this._config.timer_entity;
    const timerState = this._timerEntity()?.state;
    const callTimer = (service: string, data: Record<string, unknown> = {}) =>
      timerId ? this.hass.callService("timer", service, { entity_id: timerId, ...data }) : undefined;

    try {
      switch (operation) {
        case "complete":
          await this.hass.callService(DOMAIN, "mark_complete", chore);
          if (timerState === "active" || timerState === "paused") await callTimer("cancel");
          break;
        case "incomplete":
          await this.hass.callService(DOMAIN, "mark_pending", chore);
          break;
        case "start": {
          // Link the timer helper so cancelling it from anywhere (another
          // card, an automation, the timer's own UI) moves the chore back to
          // Pending. Re-marking an Active chore keeps its start time.
          if (entity.state !== "Active" || timerId) {
            await this.hass.callService(DOMAIN, "mark_active", {
              ...chore,
              ...(timerId ? { timer_entity: timerId } : {}),
            });
          }
          const duration = timerDuration(entity);
          await callTimer("start", duration ? { duration } : {});
          break;
        }
        case "pause":
          await callTimer("pause");
          break;
        case "resume":
          // timer.start without a duration resumes a paused timer.
          await callTimer("start");
          break;
        case "stop":
          await this.hass.callService(DOMAIN, "mark_pending", chore);
          if (timerState === "active" || timerState === "paused") await callTimer("cancel");
          break;
      }
      this._fire("haptic", operation === "complete" ? "success" : "light");
    } catch (err) {
      this._fire("hass-notification", {
        message: `Couldn't update chore: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  private _fire(type: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  static styles = css`
    :host {
      --sc-badge-color: var(--primary-color, #03a9f4);
      --sc-active-color: var(--accent-color, #ff9800);
      --sc-badge-active-color: var(--sc-active-color);
      --sc-complete-check-color: var(--success-color, #43a047);
    }
    ha-card.chore {
      position: relative;
      display: flex;
      align-items: center;
      gap: 24px;
      min-height: 96px;
      padding: 16px 56px 16px 24px;
      box-sizing: border-box;
      cursor: pointer;
      outline: none;
      /* Clips the options panel while it's slid out past the right edge.
         clip (unlike hidden) can't be scrolled, even programmatically. */
      overflow: hidden;
      overflow: clip;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
    ha-card.chore:focus-visible {
      box-shadow: 0 0 0 2px var(--primary-color);
    }
    /* Cards keep the theme's own card background in every state; outstanding
       vs complete is told apart by the faded content of complete chores. */
    /* In progress: ringed in the theme's accent color. */
    ha-card.active {
      box-shadow: 0 0 0 2px var(--sc-active-color);
    }
    ha-card.active .icon {
      color: var(--sc-active-color);
    }
    ha-card.active:focus-visible {
      box-shadow:
        0 0 0 2px var(--sc-active-color),
        0 0 0 4px var(--primary-color);
    }
    /* One-off "just started" pop: a quick bounce with an accent ripple. */
    ha-card.activating {
      animation: sc-activate 700ms ease-out;
    }
    ha-card.activating .icon-wrap {
      animation: sc-activate-icon 700ms ease-out;
    }
    @keyframes sc-activate {
      0% {
        box-shadow: 0 0 0 0 var(--sc-active-color);
      }
      40% {
        box-shadow:
          0 0 0 2px var(--sc-active-color),
          0 0 0 10px color-mix(in srgb, var(--sc-active-color) 35%, transparent);
      }
      100% {
        box-shadow:
          0 0 0 2px var(--sc-active-color),
          0 0 0 18px transparent;
      }
    }
    @keyframes sc-activate-icon {
      0% {
        transform: scale(1);
      }
      35% {
        transform: scale(1.18);
      }
      100% {
        transform: scale(1);
      }
    }
    .in-progress {
      position: absolute;
      right: -8px;
      bottom: -8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--sc-active-color);
      display: flex;
      align-items: center;
      justify-content: center;
      --mdc-icon-size: 22px;
      color: var(--text-primary-color, #fff);
      animation: sc-pulse 2s ease-in-out infinite;
    }
    /* Gentle ongoing pulse so an in-progress chore reads as "live". */
    @keyframes sc-pulse {
      0%,
      100% {
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--sc-active-color) 60%, transparent);
      }
      50% {
        box-shadow: 0 0 0 6px transparent;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      ha-card.activating,
      ha-card.activating .icon-wrap,
      .in-progress,
      .menu.open .menu-item {
        animation: none;
      }
      .menu,
      .menu.open,
      .scrim {
        transition: none;
      }
    }
    ha-card.complete .icon,
    ha-card.complete .text,
    ha-card.complete .badge,
    ha-card.not-requested .icon,
    ha-card.not-requested .text,
    ha-card.not-requested .badge {
      opacity: 0.5;
    }
    /* Not requested: a complete chore's look, with the whole card at 50% -
       back to full strength while its options panel is open, so the panel
       itself stays readable. */
    ha-card.not-requested {
      cursor: default;
      opacity: 0.5;
      transition: opacity 200ms ease;
    }
    ha-card.not-requested.menu-open {
      opacity: 1;
    }
    .icon-wrap {
      position: relative;
      flex: 0 0 auto;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon {
      --mdc-icon-size: 56px;
      color: var(--primary-text-color);
    }
    .check {
      position: absolute;
      right: -8px;
      bottom: -8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--sc-complete-check-color);
      display: flex;
      align-items: center;
      justify-content: center;
      --mdc-icon-size: 22px;
      color: var(--text-primary-color, #fff);
    }
    .text {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .name {
      font-size: 2em;
      line-height: 1.2;
      color: var(--primary-text-color);
    }
    .description {
      font-size: 1.05em;
      line-height: 1.35;
      color: var(--primary-text-color);
    }
    .duration {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1.05em;
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
    }
    .timer {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 1.05em;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      color: var(--sc-active-color);
      --mdc-icon-size: 20px;
    }
    .timer.paused {
      color: var(--secondary-text-color);
    }
    .timer.done {
      color: var(--error-color, #db4437);
    }
    /* Options panel: slides in from the right over a light scrim. */
    .scrim {
      position: absolute;
      inset: 0;
      z-index: 1;
      background: color-mix(
        in srgb,
        var(--ha-card-background, var(--card-background-color, #fff)) 55%,
        transparent
      );
      opacity: 0;
      pointer-events: none;
      transition: opacity 200ms ease;
    }
    .scrim.open {
      opacity: 1;
      pointer-events: auto;
    }
    .menu {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 2;
      max-width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 8px;
      background: var(--ha-card-background, var(--card-background-color, #fff));
      box-shadow: -6px 0 16px rgba(0, 0, 0, 0.18);
      transform: translateX(calc(100% + 20px));
      visibility: hidden;
      transition:
        transform 240ms cubic-bezier(0.4, 0, 0.2, 1),
        visibility 0s linear 240ms;
      cursor: default;
    }
    .menu.open {
      transform: none;
      visibility: visible;
      transition: transform 240ms cubic-bezier(0.2, 0, 0, 1);
    }
    .menu-item {
      --sc-item-color: var(--primary-color);
      flex: 0 0 auto;
      min-width: 76px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 10px;
      border: none;
      border-radius: 12px;
      font: inherit;
      font-size: 0.95em;
      font-weight: 500;
      color: var(--sc-item-color);
      background: color-mix(in srgb, var(--sc-item-color) 14%, transparent);
      cursor: pointer;
      --mdc-icon-size: 30px;
      -webkit-tap-highlight-color: transparent;
    }
    .menu-item:hover {
      background: color-mix(in srgb, var(--sc-item-color) 24%, transparent);
    }
    .menu-item:focus-visible {
      outline: 2px solid var(--sc-item-color);
      outline-offset: 1px;
    }
    .menu.open .menu-item {
      animation: sc-item-in 260ms cubic-bezier(0.2, 0, 0, 1) both;
      animation-delay: calc(var(--i) * 45ms);
    }
    @keyframes sc-item-in {
      from {
        opacity: 0;
        transform: translateX(16px);
      }
    }
    .menu-item.complete {
      --sc-item-color: var(--success-color, #43a047);
    }
    .menu-item.start,
    .menu-item.resume,
    .menu-item.pause {
      --sc-item-color: var(--sc-active-color);
    }
    .menu-item.stop {
      --sc-item-color: var(--error-color, #db4437);
    }
    .menu-item.incomplete {
      --sc-item-color: var(--secondary-text-color);
    }
    .badge {
      position: absolute;
      top: 8px;
      right: 8px;
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      box-sizing: border-box;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 15px;
      font-variant-numeric: tabular-nums;
      color: var(--text-primary-color, #fff);
      background: var(--sc-badge-color);
    }
    ha-card.active .badge:not(.points-colored) {
      background: var(--sc-badge-active-color);
    }
    .warning {
      padding: 16px;
      color: var(--error-color, #db4437);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-chores-chore-card": SimpleChoresChoreCard;
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "simple-chores-chore-card",
  name: "Chore",
  description: "Shows a single Simple Chores chore with its points and completion state.",
  preview: true,
});

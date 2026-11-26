/**
 * Chore-specific gesture actions for the chore card (and, through it, the
 * chore list card). Stored in the usual Lovelace action shape so they sit
 * alongside HA's own actions in YAML - e.g. `tap_action: { action:
 * start-chore }` - but handled by the card itself instead of being handed
 * to HA's `hass-action` handler, which wouldn't know them.
 *
 * Every chore action and options-panel entry resolves to a ChoreOperation,
 * which the card carries out against the chore and, when one is configured,
 * its HA timer helper (`timer_entity`).
 */
import type { ChoreStateValue, HassEntity } from "./types";

/**
 * - complete: mark_complete (and cancel a running/paused timer)
 * - incomplete: mark_pending on a Complete chore
 * - start: mark_active (and timer.start for the suggested duration)
 * - pause / resume: timer.pause / timer.start
 * - stop: timer.cancel and mark_pending on an Active chore
 */
export type ChoreOperation = "complete" | "incomplete" | "start" | "pause" | "resume" | "stop";

export type ChoreActionId =
  | "chore-menu"
  | "complete-chore"
  | "start-chore"
  | "start-or-complete-chore"
  | "reopen-chore";

export type ActionKind = "tap" | "hold" | "double_tap";

export interface ChoreActionInfo {
  id: ChoreActionId;
  label: string;
  /**
   * What to do for a chore in `state`, or null for nothing. Absent for
   * chore-menu, which opens the card's options panel instead.
   */
  operation?: (state: ChoreStateValue) => ChoreOperation | null;
}

/** Opens the card's slide-in panel of options for the chore's state. */
export const CHORE_MENU_ACTION = "chore-menu";

export const CHORE_ACTIONS: ChoreActionInfo[] = [
  { id: CHORE_MENU_ACTION, label: "Show chore options" },
  {
    id: "complete-chore",
    label: "Complete chore",
    operation: (s) => (s === "Complete" ? null : "complete"),
  },
  {
    id: "start-chore",
    label: "Start chore (mark in progress)",
    // Starting a finished chore would silently take its points back -
    // that's what "Mark incomplete" is for.
    operation: (s) => (s === "Complete" || s === "Active" ? null : "start"),
  },
  {
    id: "start-or-complete-chore",
    label: "Start chore, then complete it",
    operation: (s) => (s === "Complete" ? null : s === "Active" ? "complete" : "start"),
  },
  {
    id: "reopen-chore",
    label: "Mark incomplete",
    operation: (s) => (s === "Complete" ? "incomplete" : s === "Active" ? "stop" : null),
  },
];

/** What each gesture does when its action is left unset. */
export const DEFAULT_GESTURE_ACTIONS: Record<ActionKind, string> = {
  tap: CHORE_MENU_ACTION,
  hold: "reopen-chore",
  double_tap: "none",
};

export function choreAction(action: string | undefined): ChoreActionInfo | undefined {
  return CHORE_ACTIONS.find((a) => a.id === action);
}

/** A chore's suggested duration as timer.start's "HH:MM:SS", or undefined. */
export function timerDuration(chore: HassEntity): string | undefined {
  const minutes = Number(chore.attributes.suggested_duration);
  if (!(minutes > 0)) return undefined;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export interface ChoreMenuItem {
  id: ChoreOperation;
  icon: string;
  label: string;
}

const ITEMS: Record<ChoreOperation, ChoreMenuItem> = {
  complete: { id: "complete", icon: "mdi:check", label: "Complete" },
  incomplete: { id: "incomplete", icon: "mdi:checkbox-blank-outline", label: "Mark incomplete" },
  start: { id: "start", icon: "mdi:play", label: "Start" },
  pause: { id: "pause", icon: "mdi:pause", label: "Pause" },
  resume: { id: "resume", icon: "mdi:play", label: "Resume" },
  stop: { id: "stop", icon: "mdi:stop", label: "Stop" },
};

/**
 * The options panel's entries for a chore in its current state. The timer
 * options (start / pause / resume / stop) need a timer helper; without one
 * the panel only completes or reopens the chore. Not Requested chores get
 * nothing - they haven't been asked for.
 */
export function choreMenuItems(chore: HassEntity, timer: HassEntity | undefined): ChoreMenuItem[] {
  const state = chore.state as ChoreStateValue;
  if (state === "Not Requested") return [];
  if (state === "Complete") return [ITEMS.incomplete];
  if (!timer) return [ITEMS.complete];
  if (state !== "Active") return [ITEMS.complete, ITEMS.start];
  const timerItem =
    timer.state === "active" ? ITEMS.pause : timer.state === "paused" ? ITEMS.resume : ITEMS.start;
  return [ITEMS.complete, timerItem, ITEMS.stop];
}

/** "H:MM:SS" (HA's timer duration/remaining format) to seconds, or NaN. */
export function parseHms(value: unknown): number {
  if (typeof value !== "string") return NaN;
  const parts = value.split(":").map(Number);
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return NaN;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export interface TimerStatus {
  /** Seconds left (0 or less once it's run out). */
  remaining: number;
  paused: boolean;
}

/**
 * The countdown to show on an Active chore. With a timer helper configured,
 * that helper's state; otherwise the chore's own built-in timer (set via
 * mark_active's timer_minutes, e.g. from the admin panel), if it has one.
 */
export function timerStatus(
  chore: HassEntity,
  timer: HassEntity | undefined,
  hasTimerEntity: boolean,
  now = Date.now()
): TimerStatus | null {
  if (chore.state !== "Active") return null;
  if (hasTimerEntity) {
    if (timer?.state === "paused") {
      const remaining = parseHms(timer.attributes.remaining);
      return Number.isNaN(remaining) ? null : { remaining, paused: true };
    }
    if (timer?.state === "active") {
      const ends = Date.parse(timer.attributes.finishes_at ?? "");
      if (!Number.isNaN(ends)) return { remaining: Math.round((ends - now) / 1000), paused: false };
      const remaining = parseHms(timer.attributes.remaining);
      return Number.isNaN(remaining) ? null : { remaining, paused: false };
    }
    return null;
  }
  const paused = chore.attributes.timer_paused_remaining;
  if (typeof paused === "number") return { remaining: paused, paused: true };
  const ends = Date.parse(chore.attributes.timer_ends_at ?? "");
  return Number.isNaN(ends) ? null : { remaining: Math.round((ends - now) / 1000), paused: false };
}

/** "4:05", or "1:02:03" past an hour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

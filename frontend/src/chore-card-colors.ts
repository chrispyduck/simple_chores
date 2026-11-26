/**
 * Color-by-points helpers for simple-chores-chore-card. Kept in their own
 * module (not the card file) because the card and its editor import each
 * other: constants the editor reads at module load would still be
 * undefined if they lived in the card, which is mid-evaluation then.
 */

export type RgbColor = [number, number, number];

export const DEFAULT_HIGH_POINTS = 5;
export const DEFAULT_LOW_POINTS_COLOR: RgbColor = [43, 123, 185];
export const DEFAULT_HIGH_POINTS_COLOR: RgbColor = [219, 68, 55];

/** Accept [r, g, b] or "#rgb"/"#rrggbb"; anything else yields `fallback`. */
export function parseColor(value: unknown, fallback: RgbColor): RgbColor {
  if (Array.isArray(value) && value.length === 3 && value.every((v) => Number.isFinite(v))) {
    return value.map((v) => Math.min(255, Math.max(0, Math.round(v)))) as RgbColor;
  }
  if (typeof value === "string") {
    let hex = value.trim().replace(/^#/, "");
    if (/^[0-9a-f]{3}$/i.test(hex)) hex = [...hex].map((c) => c + c).join("");
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RgbColor;
    }
  }
  return fallback;
}

/**
 * Blend from `low` (0 points) to `high` (at/above `threshold` points) in
 * proportion to where `points` falls between them. A non-positive
 * threshold makes every chore "high".
 */
export function pointsColor(
  points: number,
  threshold: number,
  low: RgbColor,
  high: RgbColor
): RgbColor {
  const t = threshold > 0 ? Math.min(1, Math.max(0, points / threshold)) : 1;
  return low.map((l, i) => Math.round(l + (high[i] - l) * t)) as RgbColor;
}

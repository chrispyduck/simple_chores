import { afterEach, describe, expect, it, vi } from "vitest";

import "./simple-chores-history-card";
import type {
  HistoryCardConfig,
  SimpleChoresHistoryCard,
} from "./simple-chores-history-card";
import type { HomeAssistant } from "./types";

function makeHass(overrides: Partial<HomeAssistant> = {}): HomeAssistant {
  return {
    states: {},
    user: { is_admin: false },
    callService: vi.fn().mockResolvedValue(undefined),
    callWS: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

const ENTRIES = [
  {
    id: "1",
    timestamp: "2026-01-01T12:00:00+00:00",
    action: "completed",
    chore_slug: "dishes",
    chore_name: "Dishes",
    category: "kitchen",
    assignee: "alice",
    points_delta: 10,
    points_total: 10,
    points_missed: 0,
    missed_total: 0,
  },
  {
    id: "2",
    timestamp: "2026-01-01T13:00:00+00:00",
    action: "missed",
    chore_slug: "trash",
    chore_name: "Trash",
    category: null,
    assignee: "alice",
    points_delta: 0,
    points_total: 10,
    points_missed: 5,
    missed_total: 5,
  },
  {
    id: "3",
    timestamp: "2026-01-01T14:00:00+00:00",
    action: "reset",
    chore_slug: "dishes",
    chore_name: "Dishes",
    category: "kitchen",
    assignee: "alice",
    points_delta: 0,
    points_total: 10,
    points_missed: 0,
    missed_total: 5,
  },
  {
    id: "4",
    timestamp: "2026-01-01T15:00:00+00:00",
    action: "completed",
    chore_slug: "sweeping",
    chore_name: "Sweeping",
    category: null,
    assignee: "bob",
    points_delta: 3,
    points_total: 3,
    points_missed: 0,
    missed_total: 0,
  },
];

async function mountCard(
  hass: HomeAssistant,
  config: HistoryCardConfig
): Promise<SimpleChoresHistoryCard> {
  const el = document.createElement(
    "simple-chores-history-card"
  ) as SimpleChoresHistoryCard;
  document.body.appendChild(el);
  el.hass = hass;
  el.setConfig(config);
  await el.updateComplete;
  // The history fetch is awaited inside connectedCallback, which already
  // ran synchronously up to its first await by the time updateComplete
  // resolves above; a second microtask flush picks up the post-await render.
  await el.updateComplete;
  return el;
}

function rows(el: SimpleChoresHistoryCard): Element[] {
  return [...el.shadowRoot!.querySelectorAll(".row:not(.col-header)")];
}

function dateHeaders(el: SimpleChoresHistoryCard): string[] {
  return [...el.shadowRoot!.querySelectorAll(".date-header")].map(
    (h) => h.textContent?.trim() ?? ""
  );
}

describe("simple-chores-history-card", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("requires an assignee in config", () => {
    const el = document.createElement(
      "simple-chores-history-card"
    ) as SimpleChoresHistoryCard;
    expect(() =>
      el.setConfig({ type: "custom:simple-chores-history-card" } as HistoryCardConfig)
    ).toThrow(/assignee/);
  });

  it("fetches history for the configured assignee via get_history", async () => {
    const callWS = vi.fn().mockResolvedValue({ response: { entries: ENTRIES } });
    await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });

    expect(callWS).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "call_service",
        domain: "simple_chores",
        service: "get_history",
        return_response: true,
      })
    );
  });

  it("excludes reset entries and other assignees by default, newest first", async () => {
    const callWS = vi.fn().mockResolvedValue({ response: { entries: ENTRIES } });
    const el = await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });

    const names = rows(el).map((r) => r.querySelector(".cell.chore")?.textContent);
    // Newest first: "missed" (13:00) before "completed" (12:00). The
    // "reset" entry (14:00) and bob's "completed" entry are both excluded.
    expect(names).toEqual(["Trash", "Dishes"]);
  });

  it("includes reset entries when show_reset is true", async () => {
    const callWS = vi.fn().mockResolvedValue({ response: { entries: ENTRIES } });
    const el = await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
      show_reset: true,
    });

    expect(rows(el)).toHaveLength(3);
  });

  it("hides an action type when its show_ flag is false", async () => {
    const callWS = vi.fn().mockResolvedValue({ response: { entries: ENTRIES } });
    const el = await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
      show_missed: false,
    });

    const names = rows(el).map((r) => r.querySelector(".cell.chore")?.textContent);
    expect(names).toEqual(["Dishes"]);
  });

  it("shows earned/missed totals with an inline delta only when non-zero", async () => {
    const callWS = vi.fn().mockResolvedValue({ response: { entries: ENTRIES } });
    const el = await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });

    // Newest first: the "missed" entry (13:00, +5 missed) then "completed"
    // (12:00, +10 earned).
    const [missedRow, completedRow] = rows(el);

    expect(missedRow.querySelector(".cell.earned")?.textContent).toContain("10");
    expect(missedRow.querySelector(".cell.earned .meta")).toBeNull();
    expect(missedRow.querySelector(".cell.missed")?.textContent).toContain("5");
    expect(missedRow.querySelector(".cell.missed .meta")?.textContent?.trim()).toBe("+5");

    expect(completedRow.querySelector(".cell.earned")?.textContent).toContain("10");
    expect(completedRow.querySelector(".cell.earned .meta")?.textContent?.trim()).toBe(
      "+10"
    );
    expect(completedRow.querySelector(".cell.missed .meta")).toBeNull();
  });

  it("groups rows under a date header, one per distinct day", async () => {
    const otherDay = {
      ...ENTRIES[0],
      id: "5",
      timestamp: "2026-01-02T09:00:00+00:00",
      chore_name: "Vacuuming",
    };
    const callWS = vi
      .fn()
      .mockResolvedValue({ response: { entries: [...ENTRIES, otherDay] } });
    const el = await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });

    // Three alice entries survive the default filters (reset excluded),
    // spanning two calendar days - one header per day, newest first.
    expect(rows(el)).toHaveLength(3);
    expect(dateHeaders(el)).toHaveLength(2);
  });

  it("caps the number of rows to the configured limit", async () => {
    const callWS = vi.fn().mockResolvedValue({ response: { entries: ENTRIES } });
    const el = await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
      limit: 1,
    });

    expect(rows(el)).toHaveLength(1);
  });

  it("shows an empty state when the assignee has no matching entries", async () => {
    const callWS = vi.fn().mockResolvedValue({ response: { entries: ENTRIES } });
    const el = await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "nobody",
    });

    expect(el.shadowRoot!.querySelector(".empty")?.textContent).toContain(
      "Nothing to show yet"
    );
  });

  it("registers itself in window.customCards", async () => {
    expect(window.customCards).toContainEqual(
      expect.objectContaining({ type: "simple-chores-history-card" })
    );
  });
});

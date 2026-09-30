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
  return [...el.shadowRoot!.querySelectorAll(".row")];
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

    const names = rows(el).map((r) => r.querySelector(".name")?.textContent);
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

    const names = rows(el).map((r) => r.querySelector(".name")?.textContent);
    expect(names).toEqual(["Dishes"]);
  });

  it("shows the points delta only when non-zero", async () => {
    const callWS = vi.fn().mockResolvedValue({ response: { entries: ENTRIES } });
    const el = await mountCard(makeHass({ callWS }), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });

    const [missedRow, completedRow] = rows(el);
    expect(missedRow.querySelector(".points")).toBeNull();
    expect(completedRow.querySelector(".points")?.textContent?.trim()).toBe("+10");
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

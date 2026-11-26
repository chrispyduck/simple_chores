import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_HIDE_COMPLETED_AFTER,
  SimpleChoresChoreListCard,
  assigneeChoreEntityIds,
  type ChoreListCardConfig,
} from "./simple-chores-chore-list-card";
import type { SimpleChoresChoreCard } from "./simple-chores-chore-card";
import type { SimpleChoresChoreListCardEditor } from "./simple-chores-chore-list-card-editor";
import type { HassEntity, HomeAssistant } from "./types";

function chore(
  assignee: string,
  slug: string,
  name: string,
  state = "Pending",
  attrs: Record<string, unknown> = {}
): [string, HassEntity] {
  const id = `sensor.simple_chore_${assignee}_${slug}`;
  return [
    id,
    {
      entity_id: id,
      state,
      attributes: { chore_slug: slug, chore_name: name, assignee, points: 2, ...attrs },
    },
  ];
}

function makeHass(entries: [string, HassEntity][]): HomeAssistant {
  return {
    states: Object.fromEntries(entries),
    user: { is_admin: false },
    callService: vi.fn().mockResolvedValue(undefined),
    callWS: vi.fn().mockResolvedValue({}),
  };
}

const STATES: [string, HassEntity][] = [
  chore("alice", "trash", "Trash"),
  chore("alice", "dishes", "Dishes", "Complete"),
  chore("alice", "laundry", "Laundry", "Not Requested"),
  chore("bob", "dishes", "Dishes"),
  [
    "sensor.simple_chore_meta_alice_summary",
    { entity_id: "sensor.simple_chore_meta_alice_summary", state: "0", attributes: {} },
  ],
];

async function mountCard(
  hass: HomeAssistant,
  config: Partial<ChoreListCardConfig> = {}
): Promise<SimpleChoresChoreListCard> {
  const el = document.createElement("simple-chores-chore-list-card");
  document.body.appendChild(el);
  el.hass = hass;
  el.setConfig({ type: "custom:simple-chores-chore-list-card", assignee: "alice", ...config });
  await el.updateComplete;
  return el;
}

function childCards(el: SimpleChoresChoreListCard): SimpleChoresChoreCard[] {
  return [...el.shadowRoot!.querySelectorAll("simple-chores-chore-card")];
}

function childConfig(card: SimpleChoresChoreCard): Record<string, unknown> {
  return (card as unknown as { _config: Record<string, unknown> })._config;
}

describe("assigneeChoreEntityIds", () => {
  const states = Object.fromEntries(STATES);

  it("returns the assignee's requested chores sorted by name", () => {
    expect(assigneeChoreEntityIds(states, "alice")).toEqual([
      "sensor.simple_chore_alice_dishes",
      "sensor.simple_chore_alice_trash",
    ]);
  });

  it("includes not-requested chores when asked", () => {
    expect(assigneeChoreEntityIds(states, "alice", true)).toEqual([
      "sensor.simple_chore_alice_dishes",
      "sensor.simple_chore_alice_laundry",
      "sensor.simple_chore_alice_trash",
    ]);
  });

  it("matches the assignee case-insensitively", () => {
    expect(assigneeChoreEntityIds(states, "Bob")).toEqual(["sensor.simple_chore_bob_dishes"]);
  });
});

describe("simple-chores-chore-list-card", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("requires an assignee", () => {
    const el = document.createElement("simple-chores-chore-list-card");
    expect(() =>
      el.setConfig({ type: "custom:simple-chores-chore-list-card" } as ChoreListCardConfig)
    ).toThrow(/assignee/);
  });

  it("renders one chore card per chore, with no wrapper card of its own", async () => {
    const el = await mountCard(makeHass(STATES));
    const cards = childCards(el);
    expect(cards.map((c) => childConfig(c).entity)).toEqual([
      "sensor.simple_chore_alice_dishes",
      "sensor.simple_chore_alice_trash",
    ]);
    // Only the chore cards' own ha-cards - nothing wrapping them.
    expect(el.shadowRoot!.querySelector("ha-card")).toBeNull();
    await Promise.all(cards.map((c) => c.updateComplete));
    expect(cards[0].shadowRoot!.querySelector(".name")?.textContent?.trim()).toBe("Dishes");
  });

  it("passes every chore card option through to the child cards", async () => {
    const tap = { action: "more-info" };
    const el = await mountCard(makeHass(STATES), {
      show_description: false,
      show_points: false,
      show_duration: true,
      color_by_points: true,
      high_points: 8,
      low_points_color: [1, 2, 3],
      high_points_color: "#ffffff",
      tap_action: tap,
      timer_entity: "timer.chores",
      show_not_requested: false,
    });
    expect(childConfig(childCards(el)[0])).toEqual({
      type: "custom:simple-chores-chore-card",
      entity: "sensor.simple_chore_alice_dishes",
      show_description: false,
      show_points: false,
      show_duration: true,
      color_by_points: true,
      high_points: 8,
      low_points_color: [1, 2, 3],
      high_points_color: "#ffffff",
      tap_action: tap,
      timer_entity: "timer.chores",
    });
  });

  it("re-applies options to existing child cards when the config changes", async () => {
    const el = await mountCard(makeHass(STATES));
    const first = childCards(el)[0];
    el.setConfig({
      type: "custom:simple-chores-chore-list-card",
      assignee: "alice",
      show_points: false,
    });
    await el.updateComplete;
    expect(childCards(el)[0]).toBe(first);
    expect(childConfig(first).show_points).toBe(false);
  });

  it("adds and removes chores as their state changes, reusing cards", async () => {
    const el = await mountCard(makeHass(STATES));
    const trash = childCards(el)[1];
    el.hass = makeHass([
      ...STATES.filter(([id]) => id !== "sensor.simple_chore_alice_laundry"),
      chore("alice", "laundry", "Laundry", "Pending"),
    ]);
    await el.updateComplete;
    const cards = childCards(el);
    expect(cards.map((c) => childConfig(c).entity)).toEqual([
      "sensor.simple_chore_alice_dishes",
      "sensor.simple_chore_alice_laundry",
      "sensor.simple_chore_alice_trash",
    ]);
    expect(cards[2]).toBe(trash);
  });

  it("passes hass updates to child cards", async () => {
    const el = await mountCard(makeHass(STATES));
    const hass = makeHass([...STATES.slice(1), chore("alice", "trash", "Trash", "Complete")]);
    el.hass = hass;
    await el.updateComplete;
    for (const card of childCards(el)) expect(card.hass).toBe(hass);
  });

  it("shows a message when the assignee has no chores", async () => {
    const el = await mountCard(makeHass(STATES), { assignee: "carol" });
    expect(el.shadowRoot!.querySelector(".empty")?.textContent).toContain("carol");
  });

  it("stubs the first known assignee", () => {
    expect(SimpleChoresChoreListCard.getStubConfig(makeHass(STATES))).toEqual({
      assignee: "alice",
    });
  });

  it("is registered as a custom card", () => {
    expect(window.customCards?.some((c) => c.type === "simple-chores-chore-list-card")).toBe(
      true
    );
  });
});

describe("simple-chores-chore-list-card-editor (fallback inputs)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  async function mountEditor(): Promise<SimpleChoresChoreListCardEditor> {
    const el = (await SimpleChoresChoreListCard.getConfigElement()) as SimpleChoresChoreListCardEditor;
    el.hass = makeHass(STATES);
    el.setConfig({ type: "custom:simple-chores-chore-list-card", assignee: "" });
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    return el;
  }

  it("is the card's config element", async () => {
    const el = await SimpleChoresChoreListCard.getConfigElement();
    expect(el.tagName.toLowerCase()).toBe("simple-chores-chore-list-card-editor");
  });

  it("suggests known assignees and sets the assignee", async () => {
    const el = await mountEditor();
    const options = [...el.shadowRoot!.querySelectorAll("datalist option")].map((o) =>
      o.getAttribute("value")
    );
    expect(options).toEqual(["alice", "bob"]);

    const handler = vi.fn();
    el.addEventListener("config-changed", handler);
    const input = el.shadowRoot!.querySelector("input[type=text]") as HTMLInputElement;
    input.value = "bob";
    input.dispatchEvent(new Event("input"));
    expect(handler.mock.calls[0][0].detail.config).toEqual({
      type: "custom:simple-chores-chore-list-card",
      assignee: "bob",
    });
  });

  it("offers the chore card's options plus the list-only options", async () => {
    const el = await mountEditor();
    const labels = [...el.shadowRoot!.querySelectorAll(".checkbox-item")].map((l) =>
      l.textContent?.trim()
    );
    expect(labels).toEqual([
      "Show description",
      "Show points",
      "Show suggested duration",
      "Show not requested chores",
      "Move completed chores to the end",
      "Color points badge by value",
      "Hide completed chores",
    ]);

    const handler = vi.fn();
    el.addEventListener("config-changed", handler);
    const boxes = el.shadowRoot!.querySelectorAll<HTMLInputElement>(".checkbox-item input");
    boxes[3].checked = true;
    boxes[3].dispatchEvent(new Event("change"));
    expect(handler.mock.calls.at(-1)![0].detail.config.show_not_requested).toBe(true);
    boxes[3].checked = false;
    boxes[3].dispatchEvent(new Event("change"));
    expect(handler.mock.calls.at(-1)![0].detail.config).not.toHaveProperty("show_not_requested");
  });
});

describe("simple-chores-chore-list-card-editor hide options", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  async function mountEditor(config: Record<string, unknown> = {}) {
    const el = (await SimpleChoresChoreListCard.getConfigElement()) as SimpleChoresChoreListCardEditor;
    el.hass = makeHass(STATES);
    el.setConfig({ type: "custom:simple-chores-chore-list-card", assignee: "alice", ...config });
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;
    return el;
  }

  it("shows the delay (default 30) only while hiding is on, and keeps YAML minimal", async () => {
    const el = await mountEditor();
    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input.hide-after")!;
    expect(input.value).toBe(String(DEFAULT_HIDE_COMPLETED_AFTER));

    const handler = vi.fn();
    el.addEventListener("config-changed", handler);
    input.value = "10";
    input.dispatchEvent(new Event("input"));
    expect(handler.mock.calls.at(-1)![0].detail.config.hide_completed_after).toBe(10);
    input.value = "30";
    input.dispatchEvent(new Event("input"));
    expect(handler.mock.calls.at(-1)![0].detail.config).not.toHaveProperty("hide_completed_after");

    const boxes = [...el.shadowRoot!.querySelectorAll<HTMLInputElement>(".checkbox-item input")];
    const hide = boxes.find((b) =>
      b.parentElement!.textContent!.includes("Hide completed chores")
    )!;
    hide.checked = false;
    hide.dispatchEvent(new Event("change"));
    expect(handler.mock.calls.at(-1)![0].detail.config.hide_completed).toBe(false);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("input.hide-after")).toBeNull();
  });
});

describe("simple-chores-chore-list-card completed handling", () => {
  const NOW = Date.parse("2026-11-26T12:00:00Z");
  const ago = (s: number) => new Date(NOW - s * 1000).toISOString();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  const ids = (el: SimpleChoresChoreListCard) => childCards(el).map((c) => childConfig(c).entity);
  const flush = async (el: SimpleChoresChoreListCard) => {
    // Hide completion runs in a microtask, then re-renders.
    for (let i = 0; i < 3; i++) {
      await Promise.resolve();
      await el.updateComplete;
    }
  };

  it("leaves out chores completed longer ago than the delay", async () => {
    const el = await mountCard(
      makeHass([
        chore("alice", "trash", "Trash"),
        chore("alice", "dishes", "Dishes", "Complete", {}),
      ].map(([id, e]) => [id, { ...e, last_changed: ago(e.state === "Complete" ? 60 : 0) }]))
    );
    expect(ids(el)).toEqual(["sensor.simple_chore_alice_trash"]);
  });

  it("hides a completed chore once the delay passes", async () => {
    const states: [string, HassEntity][] = [
      chore("alice", "trash", "Trash"),
      chore("alice", "dishes", "Dishes", "Complete"),
    ];
    states[1][1].last_changed = ago(5);
    const el = await mountCard(makeHass(states));
    expect(ids(el)).toEqual([
      "sensor.simple_chore_alice_dishes",
      "sensor.simple_chore_alice_trash",
    ]);
    vi.advanceTimersByTime((DEFAULT_HIDE_COMPLETED_AFTER - 5) * 1000);
    await flush(el);
    expect(ids(el)).toEqual(["sensor.simple_chore_alice_trash"]);
  });

  it("honors hide_completed_after and hide_completed: false", async () => {
    const states: [string, HassEntity][] = [chore("alice", "dishes", "Dishes", "Complete")];
    states[0][1].last_changed = ago(5);
    let el = await mountCard(makeHass(states), { hide_completed_after: 3 });
    expect(el.shadowRoot!.querySelector(".empty")?.textContent?.trim()).toBe("All done!");
    document.body.innerHTML = "";
    el = await mountCard(makeHass(states), { hide_completed: false });
    vi.advanceTimersByTime(3_600_000);
    await flush(el);
    expect(ids(el)).toEqual(["sensor.simple_chore_alice_dishes"]);
  });

  it("times newly completed chores from when they were first seen complete", async () => {
    const el = await mountCard(makeHass([chore("alice", "dishes", "Dishes")]), {
      hide_completed_after: 10,
    });
    el.hass = makeHass([chore("alice", "dishes", "Dishes", "Complete")]);
    await el.updateComplete;
    vi.advanceTimersByTime(9_000);
    await flush(el);
    expect(ids(el)).toHaveLength(1);
    vi.advanceTimersByTime(1_000);
    await flush(el);
    expect(ids(el)).toHaveLength(0);
  });

  it("brings a hidden chore back when it's reopened", async () => {
    const states: [string, HassEntity][] = [chore("alice", "dishes", "Dishes", "Complete")];
    states[0][1].last_changed = ago(60);
    const el = await mountCard(makeHass(states));
    expect(ids(el)).toHaveLength(0);
    el.hass = makeHass([chore("alice", "dishes", "Dishes", "Pending")]);
    await el.updateComplete;
    expect(ids(el)).toEqual(["sensor.simple_chore_alice_dishes"]);
  });

  it("moves completed chores to the end with completed_last", async () => {
    const states: [string, HassEntity][] = [
      chore("alice", "trash", "Trash"),
      chore("alice", "dishes", "Dishes", "Complete"),
      chore("alice", "beds", "Beds"),
    ];
    let el = await mountCard(makeHass(states), { hide_completed: false });
    expect(ids(el)).toEqual([
      "sensor.simple_chore_alice_beds",
      "sensor.simple_chore_alice_dishes",
      "sensor.simple_chore_alice_trash",
    ]);
    document.body.innerHTML = "";
    el = await mountCard(makeHass(states), { hide_completed: false, completed_last: true });
    expect(ids(el)).toEqual([
      "sensor.simple_chore_alice_beds",
      "sensor.simple_chore_alice_trash",
      "sensor.simple_chore_alice_dishes",
    ]);
  });

  it("doesn't pass list-only options to the chore cards", async () => {
    const el = await mountCard(makeHass(STATES), {
      hide_completed: false,
      hide_completed_after: 5,
      completed_last: true,
    });
    const config = childConfig(childCards(el)[0]);
    expect(config).not.toHaveProperty("hide_completed");
    expect(config).not.toHaveProperty("hide_completed_after");
    expect(config).not.toHaveProperty("completed_last");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import "./simple-chores-history-card-editor";
import type { SimpleChoresHistoryCardEditor } from "./simple-chores-history-card-editor";
import type { HistoryCardConfig } from "./simple-chores-history-card";
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

function choreState(assignee: string, slug: string) {
  return {
    entity_id: `sensor.simple_chore_${assignee}_${slug}`,
    state: "Pending",
    attributes: {
      chore_slug: slug,
      chore_name: slug,
      assignee,
      frequency: "daily",
      points: 1,
    },
  };
}

async function mountEditor(
  hass: HomeAssistant,
  config: HistoryCardConfig
): Promise<SimpleChoresHistoryCardEditor> {
  const el = document.createElement(
    "simple-chores-history-card-editor"
  ) as SimpleChoresHistoryCardEditor;
  document.body.appendChild(el);
  el.hass = hass;
  el.setConfig(config);
  await el.updateComplete;
  return el;
}

function configChangedEvents(el: SimpleChoresHistoryCardEditor): HistoryCardConfig[] {
  const seen: HistoryCardConfig[] = [];
  el.addEventListener("config-changed", (e) => {
    seen.push((e as CustomEvent<{ config: HistoryCardConfig }>).detail.config);
  });
  return seen;
}

describe("simple-chores-history-card-editor", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders nothing before hass is set", async () => {
    const el = document.createElement(
      "simple-chores-history-card-editor"
    ) as SimpleChoresHistoryCardEditor;
    document.body.appendChild(el);
    el.setConfig({ type: "custom:simple-chores-history-card", assignee: "alice" });
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".form")).toBeNull();
  });

  it("seeds the assignee field from the given config", async () => {
    const el = await mountEditor(makeHass(), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input[type='text']");
    expect(input?.value).toBe("alice");
  });

  it("suggests known assignees from live chore sensors, not just admin users", async () => {
    const hass = makeHass({
      states: {
        "sensor.simple_chore_alice_dishes": choreState("alice", "dishes"),
        "sensor.simple_chore_bob_trash": choreState("bob", "trash"),
      },
    });
    const el = await mountEditor(hass, {
      type: "custom:simple-chores-history-card",
      assignee: "",
    });

    const options = [...el.shadowRoot!.querySelectorAll("datalist option")].map(
      (o) => o.getAttribute("value")
    );
    expect(options).toEqual(["alice", "bob"]);
  });

  it("fires config-changed with the new assignee as the user types", async () => {
    const el = await mountEditor(makeHass(), {
      type: "custom:simple-chores-history-card",
      assignee: "",
    });
    const events = configChangedEvents(el);

    const input = el.shadowRoot!.querySelector<HTMLInputElement>("input[type='text']")!;
    input.value = "alice";
    input.dispatchEvent(new Event("input"));

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ assignee: "alice" });
  });

  it("drops the title from config when cleared", async () => {
    const el = await mountEditor(makeHass(), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
      title: "Alice's Activity",
    });
    const events = configChangedEvents(el);

    const titleInput = el.shadowRoot!.querySelectorAll<HTMLInputElement>(
      "input[type='text']"
    )[1];
    titleInput.value = "";
    titleInput.dispatchEvent(new Event("input"));

    expect(events[0]).not.toHaveProperty("title");
  });

  it("updates days as a number", async () => {
    const el = await mountEditor(makeHass(), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });
    const events = configChangedEvents(el);

    const daysInput = el.shadowRoot!.querySelector<HTMLInputElement>(
      "input[type='number']"
    )!;
    daysInput.value = "14";
    daysInput.dispatchEvent(new Event("input"));

    expect(events[0]).toMatchObject({ days: 14 });
  });

  it("ignores an invalid days value instead of writing NaN", async () => {
    const el = await mountEditor(makeHass(), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });
    const events = configChangedEvents(el);

    const daysInput = el.shadowRoot!.querySelector<HTMLInputElement>(
      "input[type='number']"
    )!;
    daysInput.value = "0";
    daysInput.dispatchEvent(new Event("input"));

    expect(events).toHaveLength(0);
  });

  it("defaults the show_* checkboxes to the card's own defaults", async () => {
    const el = await mountEditor(makeHass(), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });

    const checkboxes = [
      ...el.shadowRoot!.querySelectorAll<HTMLInputElement>(".checkbox-item input"),
    ];
    expect(checkboxes.map((c) => c.checked)).toEqual([true, true, true, false]);
  });

  it("toggling a checkbox fires config-changed with that flag set", async () => {
    const el = await mountEditor(makeHass(), {
      type: "custom:simple-chores-history-card",
      assignee: "alice",
    });
    const events = configChangedEvents(el);

    const resetCheckbox =
      el.shadowRoot!.querySelectorAll<HTMLInputElement>(".checkbox-item input")[3];
    resetCheckbox.checked = true;
    resetCheckbox.dispatchEvent(new Event("change"));

    expect(events[0]).toMatchObject({ show_reset: true });
  });
});

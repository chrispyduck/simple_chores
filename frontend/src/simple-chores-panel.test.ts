import { afterEach, describe, expect, it, vi } from "vitest";

import "./simple-chores-panel";
import type { SimpleChoresPanel } from "./simple-chores-panel";
import type { HassEntity, HomeAssistant } from "./types";

function makeHass(overrides: Partial<HomeAssistant> = {}): HomeAssistant {
  return {
    states: {},
    user: { is_admin: true },
    callService: vi.fn().mockResolvedValue(undefined),
    callWS: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

async function mountPanel(hass: HomeAssistant): Promise<SimpleChoresPanel> {
  const el = document.createElement("simple-chores-panel") as SimpleChoresPanel;
  document.body.appendChild(el);
  el.hass = hass;
  await el.updateComplete;
  return el;
}

function tabButtons(el: SimpleChoresPanel): HTMLButtonElement[] {
  return [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".tab")];
}

describe("simple-chores-panel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders nothing before hass is set", async () => {
    const el = document.createElement("simple-chores-panel") as SimpleChoresPanel;
    document.body.appendChild(el);
    await el.updateComplete;

    // The shadow root still carries the component's <style>, so check for
    // actual rendered markup rather than textContent (which includes CSS).
    expect(el.shadowRoot?.querySelector(".toolbar")).toBeNull();
  });

  it("shows an admin-required banner for a non-admin user", async () => {
    const el = await mountPanel(makeHass({ user: { is_admin: false } }));

    const banner = el.shadowRoot!.querySelector(".banner.error");
    expect(banner?.textContent).toContain("administrator");
  });

  it("does not show the admin banner for an admin user", async () => {
    const el = await mountPanel(makeHass());
    expect(el.shadowRoot!.querySelector(".banner.error")).toBeNull();
  });

  it("renders every tab, in order, for an admin user", async () => {
    const el = await mountPanel(makeHass());

    const labels = tabButtons(el).map((t) => t.textContent?.trim());
    expect(labels).toEqual([
      "Chores",
      "Privileges",
      "Categories",
      "Users",
      "History",
      "Settings",
    ]);
  });

  it("defaults to the Chores tab with an empty state when there are no chores", async () => {
    const el = await mountPanel(makeHass());

    const choresTab = tabButtons(el)[0];
    expect(choresTab.classList.contains("active")).toBe(true);
    expect(el.shadowRoot!.querySelector(".empty")?.textContent).toContain(
      "No chores yet"
    );
  });

  it("renders a chore card built from a chore sensor entity", async () => {
    const states: Record<string, HassEntity> = {
      "sensor.simple_chore_alice_dishes": {
        entity_id: "sensor.simple_chore_alice_dishes",
        state: "Pending",
        attributes: {
          chore_slug: "dishes",
          chore_name: "Dishes",
          assignee: "alice",
          frequency: "daily",
          points: 2,
          default_points: 2,
        },
      },
    };
    const el = await mountPanel(makeHass({ states }));

    expect(el.shadowRoot!.querySelector(".card .name")?.textContent).toBe("Dishes");
    expect(el.shadowRoot!.querySelector(".assignee-name")?.textContent).toBe("alice");
  });

  it("shows a display name instead of the raw username once loaded", async () => {
    const states: Record<string, HassEntity> = {
      "sensor.simple_chore_alice_dishes": {
        entity_id: "sensor.simple_chore_alice_dishes",
        state: "Pending",
        attributes: { chore_slug: "dishes", chore_name: "Dishes", assignee: "alice" },
      },
    };
    const callWS = vi
      .fn()
      .mockResolvedValue([{ id: "1", username: "alice", name: "Alice Smith" }]);
    const el = await mountPanel(makeHass({ states, callWS }));

    // The display-name fetch is async and kicked off from updated(); wait
    // for it and the resulting re-render.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".assignee-name")?.textContent).toBe(
      "Alice Smith"
    );
  });

  it("switches tabs on click and shows the Settings tab's danger zone", async () => {
    const el = await mountPanel(makeHass());

    const settingsTab = tabButtons(el).find((t) => t.textContent?.trim() === "Settings")!;
    settingsTab.click();
    await el.updateComplete;

    expect(settingsTab.classList.contains("active")).toBe(true);
    expect(el.shadowRoot!.querySelector(".danger-zone")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".danger-zone-title")?.textContent).toBe(
      "Reset points"
    );
  });

  it("opens the reset-points confirmation dialog from the danger zone", async () => {
    const el = await mountPanel(makeHass());
    const settingsTab = tabButtons(el).find((t) => t.textContent?.trim() === "Settings")!;
    settingsTab.click();
    await el.updateComplete;

    const resetButton = [
      ...el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".danger-zone button"),
    ][0];
    resetButton.click();
    await el.updateComplete;

    const dialog = el.shadowRoot!.querySelector(".dialog");
    expect(dialog?.querySelector("h2")?.textContent).toBe("Reset points");
  });

  it("shows an empty state on the Users tab with no known assignees", async () => {
    const el = await mountPanel(makeHass());
    const usersTab = tabButtons(el).find((t) => t.textContent?.trim() === "Users")!;
    usersTab.click();
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".empty")?.textContent).toContain(
      "No assignees yet"
    );
  });

  it("renders a user card with their points summary", async () => {
    const states: Record<string, HassEntity> = {
      "sensor.simple_chore_alice_dishes": {
        entity_id: "sensor.simple_chore_alice_dishes",
        state: "Pending",
        attributes: { chore_slug: "dishes", assignee: "alice" },
      },
      "sensor.simple_chore_meta_alice_summary": {
        entity_id: "sensor.simple_chore_meta_alice_summary",
        state: "1",
        attributes: { assignee: "alice", total_points: 42 },
      },
    };
    const el = await mountPanel(makeHass({ states }));
    const usersTab = tabButtons(el).find((t) => t.textContent?.trim() === "Users")!;
    usersTab.click();
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".user-points-value")?.textContent).toBe("42");
  });

  it("loads and renders history entries when the History tab is opened", async () => {
    const callWS = vi.fn().mockResolvedValue({
      response: {
        entries: [
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
          },
        ],
      },
    });
    const el = await mountPanel(makeHass({ callWS }));

    const historyTab = tabButtons(el).find((t) => t.textContent?.trim() === "History")!;
    historyTab.click();
    await el.updateComplete;
    // _loadHistory awaits callWS before assigning _historyEntries.
    await el.updateComplete;

    expect(callWS).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "call_service",
        domain: "simple_chores",
        service: "get_history",
        return_response: true,
      })
    );

    const row = el.shadowRoot!.querySelector(".history-row:not(.history-header)");
    expect(row?.querySelector(".history-chore .name")?.textContent).toBe("Dishes");
    expect(row?.querySelector(".history-points")?.textContent?.trim()).toBe("+10");
    expect(row?.querySelector(".history-balance")?.textContent?.trim()).toBe("10");
  });

  it("shows an empty state on the History tab with no entries", async () => {
    const el = await mountPanel(makeHass({ callWS: vi.fn().mockResolvedValue({}) }));

    const historyTab = tabButtons(el).find((t) => t.textContent?.trim() === "History")!;
    historyTab.click();
    await el.updateComplete;
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector(".empty")?.textContent).toContain(
      "No chore history yet"
    );
  });

  it("clears history from the Settings danger zone after confirming", async () => {
    const callService = vi.fn().mockResolvedValue(undefined);
    const el = await mountPanel(makeHass({ callService }));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const settingsTab = tabButtons(el).find((t) => t.textContent?.trim() === "Settings")!;
    settingsTab.click();
    await el.updateComplete;

    const clearButton = [
      ...el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".danger-zone button"),
    ].find((b) => b.textContent?.includes("Clear history"))!;
    clearButton.click();
    await el.updateComplete;

    expect(callService).toHaveBeenCalledWith("simple_chores", "reset_history", {});
  });
});

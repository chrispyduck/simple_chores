import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { SimpleChoresChoreCard } from "./simple-chores-chore-card";
import { SimpleChoresChoreCardEditor } from "./simple-chores-chore-card-editor";
import type { HassEntity, HomeAssistant } from "./types";

const CHORE_ID = "sensor.simple_chore_alice_dishes";
const SUMMARY_ID = "sensor.simple_chore_meta_alice_summary";

function makeHass(): HomeAssistant {
  const states: Record<string, HassEntity> = {
    [CHORE_ID]: {
      entity_id: CHORE_ID,
      state: "Pending",
      attributes: { chore_slug: "dishes", chore_name: "Dishes", assignee: "alice" },
    },
    [SUMMARY_ID]: { entity_id: SUMMARY_ID, state: "0", attributes: {} },
  };
  return {
    states,
    callService: vi.fn().mockResolvedValue(undefined),
    callWS: vi.fn().mockResolvedValue({}),
  };
}

async function mountEditor(): Promise<SimpleChoresChoreCardEditor> {
  const el = (await SimpleChoresChoreCard.getConfigElement()) as SimpleChoresChoreCardEditor;
  el.hass = makeHass();
  el.setConfig({ type: "custom:simple-chores-chore-card", entity: "" });
  document.body.appendChild(el);
  // Let ensureHaForm() settle, then the re-render it triggers.
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

describe("simple-chores-chore-card-editor", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is the card's config element", async () => {
    const el = await SimpleChoresChoreCard.getConfigElement();
    expect(el.tagName.toLowerCase()).toBe("simple-chores-chore-card-editor");
  });

  describe("without ha-form (fallback inputs)", () => {
    it("suggests only chore sensors", async () => {
      const el = await mountEditor();
      const options = [...el.shadowRoot!.querySelectorAll("datalist option")].map(
        (o) => o.getAttribute("value")
      );
      expect(options).toEqual([CHORE_ID]);
    });

    it("fires config-changed when the entity is entered", async () => {
      const el = await mountEditor();
      const handler = vi.fn();
      el.addEventListener("config-changed", handler);
      const input = el.shadowRoot!.querySelector("input[type=text]") as HTMLInputElement;
      input.value = CHORE_ID;
      input.dispatchEvent(new Event("input"));
      expect(handler.mock.calls[0][0].detail.config).toEqual({
        type: "custom:simple-chores-chore-card",
        entity: CHORE_ID,
      });
    });
  });

  describe("with ha-form", () => {
    // Registered here (not at collection time) so the fallback tests above
    // run before it exists - custom elements can't be unregistered.
    beforeAll(() => {
      if (!customElements.get("ha-form")) {
        customElements.define("ha-form", class extends HTMLElement {});
      }
    });

    it("renders ha-form with an entity picker limited to chore sensors", async () => {
      const el = await mountEditor();
      const form = el.shadowRoot!.querySelector("ha-form") as HTMLElement & {
        schema: { name: string; selector?: { entity?: { include_entities: string[] } } }[];
      };
      expect(form).not.toBeNull();
      expect(form.schema[0].selector?.entity?.include_entities).toEqual([CHORE_ID]);
    });

    it("shows the show_* toggles as on when unset", async () => {
      const el = await mountEditor();
      const form = el.shadowRoot!.querySelector("ha-form") as HTMLElement & {
        data: Record<string, unknown>;
      };
      expect(form.data.show_description).toBe(true);
      expect(form.data.show_points).toBe(true);
      expect(form.data.show_duration).toBeUndefined();
    });

    it("keeps show_duration only when on", async () => {
      const el = await mountEditor();
      const handler = vi.fn();
      el.addEventListener("config-changed", handler);
      const form = el.shadowRoot!.querySelector("ha-form")!;
      for (const show_duration of [true, false]) {
        form.dispatchEvent(
          new CustomEvent("value-changed", {
            detail: {
              value: { type: "custom:simple-chores-chore-card", entity: CHORE_ID, show_duration },
            },
          })
        );
      }
      expect(handler.mock.calls[0][0].detail.config.show_duration).toBe(true);
      expect(handler.mock.calls[1][0].detail.config).not.toHaveProperty("show_duration");
    });

    it("forwards value-changed as config-changed, dropping defaults", async () => {
      const el = await mountEditor();
      const handler = vi.fn();
      el.addEventListener("config-changed", handler);
      el.shadowRoot!.querySelector("ha-form")!.dispatchEvent(
        new CustomEvent("value-changed", {
          detail: {
            value: {
              type: "custom:simple-chores-chore-card",
              entity: CHORE_ID,
              show_description: true,
              show_points: false,
              tap_action: undefined,
              hold_action: { action: "more-info" },
            },
          },
        })
      );
      expect(handler.mock.calls[0][0].detail.config).toEqual({
        type: "custom:simple-chores-chore-card",
        entity: CHORE_ID,
        show_points: false,
        hold_action: { action: "more-info" },
      });
    });

    type SchemaItem = { name: string; schema?: SchemaItem[] };
    function fieldNames(el: SimpleChoresChoreCardEditor): string[] {
      const form = el.shadowRoot!.querySelector("ha-form") as HTMLElement & {
        schema: SchemaItem[];
      };
      const names: string[] = [];
      const walk = (items: SchemaItem[]) =>
        items.forEach((i) => (i.schema ? walk(i.schema) : names.push(i.name)));
      walk(form.schema);
      return names;
    }

    it("only shows threshold and colors when color_by_points is on", async () => {
      const el = await mountEditor();
      expect(fieldNames(el)).toContain("color_by_points");
      expect(fieldNames(el)).not.toContain("high_points");

      el.setConfig({
        type: "custom:simple-chores-chore-card",
        entity: CHORE_ID,
        color_by_points: true,
      });
      await el.updateComplete;
      expect(fieldNames(el)).toEqual(
        expect.arrayContaining(["high_points", "low_points_color", "high_points_color"])
      );
    });

    it("drops default threshold/colors but keeps custom ones", async () => {
      const el = await mountEditor();
      const handler = vi.fn();
      el.addEventListener("config-changed", handler);
      el.shadowRoot!.querySelector("ha-form")!.dispatchEvent(
        new CustomEvent("value-changed", {
          detail: {
            value: {
              type: "custom:simple-chores-chore-card",
              entity: CHORE_ID,
              color_by_points: true,
              high_points: 5,
              low_points_color: [43, 123, 185],
              high_points_color: [10, 20, 30],
            },
          },
        })
      );
      expect(handler.mock.calls[0][0].detail.config).toEqual({
        type: "custom:simple-chores-chore-card",
        entity: CHORE_ID,
        color_by_points: true,
        high_points_color: [10, 20, 30],
      });
    });

    function form(el: SimpleChoresChoreCardEditor) {
      return el.shadowRoot!.querySelector("ha-form") as HTMLElement & {
        data: Record<string, unknown>;
        schema: SchemaItem[];
      };
    }

    function change(el: SimpleChoresChoreCardEditor, value: Record<string, unknown>) {
      const handler = vi.fn();
      el.addEventListener("config-changed", handler);
      form(el).dispatchEvent(
        new CustomEvent("value-changed", {
          detail: {
            value: { type: "custom:simple-chores-chore-card", entity: CHORE_ID, ...value },
          },
        })
      );
      return handler.mock.calls[0][0].detail.config as Record<string, unknown>;
    }

    it("shows each gesture's actual default by name, not 'Default'", async () => {
      const el = await mountEditor();
      expect(form(el).data).toMatchObject({
        tap_behavior: "chore-menu",
        hold_behavior: "reopen-chore",
        double_tap_behavior: "none",
      });
      // HA's own picker only appears for "Other".
      expect(fieldNames(el)).toContain("tap_behavior");
      expect(fieldNames(el)).not.toContain("tap_action");
    });

    it("stores a chore action, and drops it when it's the default", async () => {
      const el = await mountEditor();
      expect(change(el, { double_tap_behavior: "start-chore" })).toEqual({
        type: "custom:simple-chores-chore-card",
        entity: CHORE_ID,
        double_tap_action: { action: "start-chore" },
      });
      expect(change(el, { double_tap_behavior: "none" })).not.toHaveProperty(
        "double_tap_action"
      );
      expect(change(el, { tap_behavior: "chore-menu" })).not.toHaveProperty("tap_action");
    });

    it("switching to Other starts from more-info and shows HA's action picker", async () => {
      const el = await mountEditor();
      expect(change(el, { hold_behavior: "other" }).hold_action).toEqual({
        action: "more-info",
      });
      await el.updateComplete;
      expect(form(el).data.hold_behavior).toBe("other");
      expect(fieldNames(el)).toContain("hold_action");
    });

    it("keeps an HA action edited under Other", async () => {
      const el = await mountEditor();
      const nav = { action: "navigate", navigation_path: "/lovelace/0" };
      expect(change(el, { tap_behavior: "other", tap_action: nav }).tap_action).toEqual(nav);
    });
  });
});

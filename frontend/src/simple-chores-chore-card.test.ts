import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DOUBLE_TAP_MS,
  HOLD_MS,
  SimpleChoresChoreCard,
  parseColor,
  pointsColor,
} from "./simple-chores-chore-card";
import type { ChoreCardConfig } from "./simple-chores-chore-card";
import type { HassEntity, HomeAssistant } from "./types";

const ENTITY_ID = "sensor.simple_chore_alice_dishes";

function choreEntity(state: string, attrs: Record<string, unknown> = {}): HassEntity {
  return {
    entity_id: ENTITY_ID,
    state,
    attributes: {
      chore_slug: "dishes",
      chore_name: "Dishes",
      description: "Load and run the dishwasher",
      icon: "mdi:dishwasher",
      assignee: "alice",
      points: 3,
      ...attrs,
    },
  };
}

function makeHass(states: Record<string, HassEntity>): HomeAssistant {
  return {
    states,
    user: { is_admin: false },
    callService: vi.fn().mockResolvedValue(undefined),
    callWS: vi.fn().mockResolvedValue({}),
  };
}

async function mountCard(
  hass: HomeAssistant,
  config: Partial<ChoreCardConfig> = {}
): Promise<SimpleChoresChoreCard> {
  const el = document.createElement("simple-chores-chore-card") as SimpleChoresChoreCard;
  document.body.appendChild(el);
  el.hass = hass;
  el.setConfig({ type: "custom:simple-chores-chore-card", entity: ENTITY_ID, ...config });
  await el.updateComplete;
  return el;
}

function q(el: SimpleChoresChoreCard, selector: string): Element | null {
  return el.shadowRoot!.querySelector(selector);
}

describe("simple-chores-chore-card", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("requires an entity in config", () => {
    const el = document.createElement("simple-chores-chore-card") as SimpleChoresChoreCard;
    expect(() =>
      el.setConfig({ type: "custom:simple-chores-chore-card" } as ChoreCardConfig)
    ).toThrow(/entity/);
  });

  it("renders name, description, icon and points", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending") }));
    expect(q(el, ".name")?.textContent?.trim()).toBe("Dishes");
    expect(q(el, ".description")?.textContent?.trim()).toBe("Load and run the dishwasher");
    expect((q(el, ".icon") as HTMLElement & { icon: string }).icon).toBe("mdi:dishwasher");
    expect(q(el, ".badge")?.textContent?.trim()).toBe("3");
  });

  it("renders a pending chore normally, without a check", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending") }));
    expect(q(el, "ha-card")!.classList.contains("outstanding")).toBe(true);
    expect(q(el, "ha-card")!.classList.contains("complete")).toBe(false);
    expect(q(el, ".check")).toBeNull();
  });

  it("greys out a not-requested chore, without a check", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Not Requested") }));
    const classes = q(el, "ha-card")!.classList;
    expect(classes.contains("not-requested")).toBe(true);
    expect(classes.contains("outstanding")).toBe(false);
    expect(classes.contains("complete")).toBe(false);
    expect(q(el, ".check")).toBeNull();
  });

  it("dims and checks a complete chore", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Complete") }));
    expect(q(el, "ha-card")!.classList.contains("complete")).toBe(true);
    expect(q(el, ".check")).not.toBeNull();
  });

  it("highlights an active chore", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Active") }));
    expect(q(el, "ha-card")!.classList.contains("active")).toBe(true);
    expect(q(el, "ha-card")!.classList.contains("outstanding")).toBe(true);
  });

  it("marks an active chore with the in-progress indicator", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Active") }));
    expect(q(el, ".in-progress")).not.toBeNull();
    expect(q(el, ".check")).toBeNull();
    // Already active on first render: no "just started" animation.
    expect(q(el, "ha-card")!.classList.contains("activating")).toBe(false);
  });

  it("animates a chore that becomes active, until the animation ends", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending") }));
    expect(q(el, ".in-progress")).toBeNull();
    el.hass = makeHass({ [ENTITY_ID]: choreEntity("Active") });
    await el.updateComplete;
    const haCard = q(el, "ha-card")!;
    expect(haCard.classList.contains("activating")).toBe(true);
    const end = new Event("animationend") as Event & { animationName: string };
    Object.defineProperty(end, "animationName", { value: "sc-activate" });
    haCard.dispatchEvent(end);
    await el.updateComplete;
    expect(haCard.classList.contains("activating")).toBe(false);
    expect(haCard.classList.contains("active")).toBe(true);
  });

  describe("timer countdown", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
      vi.setSystemTime(Date.parse("2026-11-26T12:00:00Z"));
    });
    afterEach(() => vi.useRealTimers());

    it("counts down a running timer every second", async () => {
      const el = await mountCard(
        makeHass({
          [ENTITY_ID]: choreEntity("Active", { timer_ends_at: "2026-11-26T12:05:00Z" }),
        })
      );
      expect(q(el, ".timer")?.textContent?.trim()).toBe("5:00 left");
      vi.advanceTimersByTime(3000);
      await el.updateComplete;
      expect(q(el, ".timer")?.textContent?.trim()).toBe("4:57 left");
    });

    it("shows a paused timer's remaining time, and time's up", async () => {
      let el = await mountCard(
        makeHass({ [ENTITY_ID]: choreEntity("Active", { timer_paused_remaining: 125 }) })
      );
      expect(q(el, ".timer")?.textContent?.replace(/\s+/g, " ").trim()).toBe(
        "2:05 left · paused"
      );
      document.body.innerHTML = "";
      el = await mountCard(
        makeHass({
          [ENTITY_ID]: choreEntity("Active", { timer_ends_at: "2026-11-26T11:59:00Z" }),
        })
      );
      expect(q(el, ".timer")?.textContent?.trim()).toBe("Time's up!");
    });

    it("counts down from the timer helper when one is set", async () => {
      const timerId = "timer.chores";
      const chore = choreEntity("Active", { timer_ends_at: "2026-11-26T13:00:00Z" });
      const el = await mountCard(
        makeHass({
          [ENTITY_ID]: chore,
          [timerId]: {
            entity_id: timerId,
            state: "active",
            attributes: { finishes_at: "2026-11-26T12:02:00Z", remaining: "0:05:00" },
          },
        }),
        { timer_entity: timerId }
      );
      // The helper wins over the chore's own built-in timer.
      expect(q(el, ".timer")?.textContent?.trim()).toBe("2:00 left");
      vi.advanceTimersByTime(1000);
      await el.updateComplete;
      expect(q(el, ".timer")?.textContent?.trim()).toBe("1:59 left");

      el.hass = makeHass({
        [ENTITY_ID]: chore,
        [timerId]: { entity_id: timerId, state: "paused", attributes: { remaining: "0:01:30" } },
      });
      await el.updateComplete;
      expect(q(el, ".timer")?.textContent?.replace(/\s+/g, " ").trim()).toBe(
        "1:30 left · paused"
      );

      el.hass = makeHass({
        [ENTITY_ID]: chore,
        [timerId]: { entity_id: timerId, state: "idle", attributes: {} },
      });
      await el.updateComplete;
      expect(q(el, ".timer")).toBeNull();
    });

    it("shows no timer without one", async () => {
      const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Active") }));
      expect(q(el, ".timer")).toBeNull();
    });
  });

  it("updates when the entity's state changes", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending") }));
    el.hass = makeHass({ [ENTITY_ID]: choreEntity("Complete") });
    await el.updateComplete;
    expect(q(el, ".check")).not.toBeNull();
  });

  it("omits the description when empty or hidden", async () => {
    let el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending", { description: "" }) }));
    expect(q(el, ".description")).toBeNull();
    document.body.innerHTML = "";
    el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending") }), {
      show_description: false,
    });
    expect(q(el, ".description")).toBeNull();
  });

  it("hides the points badge when show_points is false", async () => {
    const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending") }), {
      show_points: false,
    });
    expect(q(el, ".badge")).toBeNull();
  });

  it("hides the suggested duration unless show_duration is on", async () => {
    const entity = choreEntity("Pending", { suggested_duration: 90 });
    let el = await mountCard(makeHass({ [ENTITY_ID]: entity }));
    expect(q(el, ".duration")).toBeNull();
    document.body.innerHTML = "";
    el = await mountCard(makeHass({ [ENTITY_ID]: entity }), { show_duration: true });
    expect(q(el, ".duration")?.textContent?.trim()).toBe("1 hr 30 min");
  });

  it("shows nothing for show_duration when the chore has no duration", async () => {
    const el = await mountCard(
      makeHass({ [ENTITY_ID]: choreEntity("Pending", { suggested_duration: null }) }),
      { show_duration: true }
    );
    expect(q(el, ".duration")).toBeNull();
  });

  it("shows a warning for a missing entity", async () => {
    const el = await mountCard(makeHass({}));
    expect(q(el, ".warning")?.textContent).toContain(ENTITY_ID);
  });

  it("stub config picks a chore sensor, skipping summary/privilege sensors", () => {
    const hass = makeHass({
      "sensor.simple_chore_meta_alice_summary": {
        entity_id: "sensor.simple_chore_meta_alice_summary",
        state: "0",
        attributes: {},
      },
      [ENTITY_ID]: choreEntity("Pending"),
    });
    expect(SimpleChoresChoreCard.getStubConfig(hass)).toEqual({ entity: ENTITY_ID });
  });

  describe("actions", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    function card(el: SimpleChoresChoreCard): HTMLElement {
      return q(el, "ha-card") as HTMLElement;
    }

    function pointer(el: SimpleChoresChoreCard, type: string, x = 0, y = 0): void {
      // jsdom has no PointerEvent; the handlers only read button/clientX/clientY.
      card(el).dispatchEvent(new MouseEvent(type, { button: 0, clientX: x, clientY: y }));
    }

    function tap(el: SimpleChoresChoreCard): void {
      pointer(el, "pointerdown");
      pointer(el, "pointerup");
    }

    function hold(el: SimpleChoresChoreCard): void {
      pointer(el, "pointerdown");
      vi.advanceTimersByTime(HOLD_MS);
      pointer(el, "pointerup");
    }

    const COMPLETE_ON_TAP = { tap_action: { action: "complete-chore" } };

    function menuOpen(el: SimpleChoresChoreCard): boolean {
      return q(el, ".menu")!.classList.contains("open");
    }

    function menuLabels(el: SimpleChoresChoreCard): string[] {
      return [...el.shadowRoot!.querySelectorAll(".menu-item")].map(
        (b) => b.textContent?.trim() ?? ""
      );
    }

    it("tap opens the options panel by default, without calling a service", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const el = await mountCard(hass);
      expect(menuOpen(el)).toBe(false);
      tap(el);
      await el.updateComplete;
      expect(menuOpen(el)).toBe(true);
      expect(card(el).getAttribute("aria-expanded")).toBe("true");
      expect(hass.callService).not.toHaveBeenCalled();
    });

    const TIMER = "timer.chores";
    const WITH_TIMER = { timer_entity: TIMER };
    function timer(state: string, attrs: Record<string, unknown> = {}): HassEntity {
      return { entity_id: TIMER, state, attributes: attrs };
    }
    async function flush(): Promise<void> {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    }

    it.each([
      ["Pending", "no timer", undefined, {}, ["Complete"]],
      ["Active", "no timer", undefined, {}, ["Complete"]],
      ["Pending", "a timer", timer("idle"), WITH_TIMER, ["Complete", "Start"]],
      ["Active", "a running timer", timer("active"), WITH_TIMER, ["Complete", "Pause", "Stop"]],
      ["Active", "a paused timer", timer("paused"), WITH_TIMER, ["Complete", "Resume", "Stop"]],
      ["Active", "a finished timer", timer("idle"), WITH_TIMER, ["Complete", "Start", "Stop"]],
      // Configured but missing from HA: treated as no timer.
      ["Pending", "a missing timer", undefined, WITH_TIMER, ["Complete"]],
      ["Complete", "a timer", timer("idle"), WITH_TIMER, ["Mark incomplete"]],
      ["Not Requested", "a timer", timer("idle"), WITH_TIMER, []],
    ])("a %s chore with %s offers %o", async (state, _desc, timerEntity, config, labels) => {
      const states: Record<string, HassEntity> = { [ENTITY_ID]: choreEntity(state) };
      if (timerEntity) states[TIMER] = timerEntity;
      const el = await mountCard(makeHass(states), config);
      expect(menuLabels(el)).toEqual(labels);
    });

    const CHORE = { chore_slug: "dishes", user: "alice" };
    const LINKED = { ...CHORE, timer_entity: TIMER };
    it.each([
      ["Complete", "Pending", "idle", {}, [["simple_chores", "mark_complete", CHORE]]],
      [
        "Complete",
        "Active",
        "active",
        {},
        [
          ["simple_chores", "mark_complete", CHORE],
          ["timer", "cancel", { entity_id: TIMER }],
        ],
      ],
      [
        "Start",
        "Pending",
        "idle",
        { suggested_duration: 90 },
        [
          ["simple_chores", "mark_active", LINKED],
          ["timer", "start", { entity_id: TIMER, duration: "01:30:00" }],
        ],
      ],
      [
        "Start",
        "Pending",
        "idle",
        { suggested_duration: null },
        [
          ["simple_chores", "mark_active", LINKED],
          ["timer", "start", { entity_id: TIMER }],
        ],
      ],
      // Restarting a finished timer on an in-progress chore re-marks it only
      // to (re)link the timer - mark_active keeps the original start time.
      [
        "Start",
        "Active",
        "idle",
        {},
        [
          ["simple_chores", "mark_active", LINKED],
          ["timer", "start", { entity_id: TIMER }],
        ],
      ],
      ["Pause", "Active", "active", {}, [["timer", "pause", { entity_id: TIMER }]]],
      ["Resume", "Active", "paused", {}, [["timer", "start", { entity_id: TIMER }]]],
      [
        "Stop",
        "Active",
        "paused",
        {},
        [
          ["simple_chores", "mark_pending", CHORE],
          ["timer", "cancel", { entity_id: TIMER }],
        ],
      ],
      ["Stop", "Active", "idle", {}, [["simple_chores", "mark_pending", CHORE]]],
      ["Mark incomplete", "Complete", "idle", {}, [["simple_chores", "mark_pending", CHORE]]],
    ])(
      "'%s' on a %s chore (timer %s, %o) makes the right calls",
      async (label, state, timerState, attrs, calls) => {
        const hass = makeHass({
          [ENTITY_ID]: choreEntity(state, attrs),
          [TIMER]: timer(timerState),
        });
        const el = await mountCard(hass, WITH_TIMER);
        tap(el);
        await el.updateComplete;
        const button = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>(".menu-item")].find(
          (b) => b.textContent?.trim() === label
        )!;
        button.click();
        await flush();
        expect(vi.mocked(hass.callService).mock.calls).toEqual(calls);
        await el.updateComplete;
        expect(menuOpen(el)).toBe(false);
      }
    );

    it("doesn't touch the timer when the chore update fails", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending"), [TIMER]: timer("idle") });
      hass.callService = vi.fn().mockRejectedValue(new Error("nope"));
      const el = await mountCard(hass, WITH_TIMER);
      const notify = vi.fn();
      el.addEventListener("hass-notification", notify);
      tap(el);
      await el.updateComplete;
      el.shadowRoot!.querySelector<HTMLButtonElement>(".menu-item.start")!.click();
      await flush();
      expect(hass.callService).toHaveBeenCalledOnce();
      expect(notify).toHaveBeenCalled();
    });

    it("re-renders when only the timer entity changes", async () => {
      const chore = choreEntity("Active");
      const el = await mountCard(makeHass({ [ENTITY_ID]: chore, [TIMER]: timer("active") }), WITH_TIMER);
      expect(menuLabels(el)).toContain("Pause");
      el.hass = makeHass({ [ENTITY_ID]: chore, [TIMER]: timer("paused") });
      await el.updateComplete;
      expect(menuLabels(el)).toContain("Resume");
    });

    it("closes the panel on a press outside it, Escape, or a second tap action", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const el = await mountCard(hass);
      tap(el);
      await el.updateComplete;
      q(el, ".scrim")!.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      await el.updateComplete;
      expect(menuOpen(el)).toBe(false);

      tap(el);
      await el.updateComplete;
      card(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      await el.updateComplete;
      expect(menuOpen(el)).toBe(false);

      card(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      await el.updateComplete;
      expect(menuOpen(el)).toBe(true);
      expect(hass.callService).not.toHaveBeenCalled();
    });

    it("moves focus into the panel only when opened from the keyboard", async () => {
      const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending") }));
      const focus = vi.spyOn(HTMLButtonElement.prototype, "focus");
      tap(el);
      await el.updateComplete;
      await el.updateComplete;
      expect(focus).not.toHaveBeenCalled();

      card(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      await el.updateComplete;
      card(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      await el.updateComplete;
      await el.updateComplete;
      // preventScroll: focusing a still-sliding-in button mustn't scroll the card.
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      focus.mockRestore();
    });

    it.each([
      ["tap (panel)", {}],
      ["tap (complete-chore)", { tap_action: { action: "complete-chore" } }],
      ["tap (start-chore)", { tap_action: { action: "start-chore" } }],
      ["tap (HA action)", { tap_action: { action: "more-info" } }],
    ])("a not-requested chore ignores %s", async (_name, config) => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Not Requested") });
      const el = await mountCard(hass, config);
      const handler = vi.fn();
      el.addEventListener("hass-action", handler);
      tap(el);
      hold(el);
      await el.updateComplete;
      expect(hass.callService).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
      expect(q(el, ".menu")!.classList.contains("open")).toBe(false);
      expect(card(el).getAttribute("aria-disabled")).toBe("true");
    });

    it("presses inside the open panel don't trigger card gestures", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Complete") });
      const el = await mountCard(hass);
      tap(el);
      await el.updateComplete;
      const menu = q(el, ".menu")!;
      menu.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
      vi.advanceTimersByTime(HOLD_MS);
      menu.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, button: 0 }));
      expect(hass.callService).not.toHaveBeenCalled(); // no hold → mark_pending
      expect(menuOpen(el)).toBe(true);
    });

    it("complete-chore does nothing to a complete chore", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Complete") });
      const el = await mountCard(hass, COMPLETE_ON_TAP);
      tap(el);
      expect(hass.callService).not.toHaveBeenCalled();
    });

    it("hold marks a complete chore incomplete by default", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Complete") });
      const el = await mountCard(hass);
      hold(el);
      expect(hass.callService).toHaveBeenCalledOnce();
      expect(hass.callService).toHaveBeenCalledWith("simple_chores", "mark_pending", {
        chore_slug: "dishes",
        user: "alice",
      });
    });

    it("hold does nothing to an unfinished chore by default", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const el = await mountCard(hass);
      hold(el);
      expect(hass.callService).not.toHaveBeenCalled();
    });

    it("moving the pointer (scrolling) cancels the tap", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const el = await mountCard(hass);
      pointer(el, "pointerdown", 0, 0);
      pointer(el, "pointermove", 0, 40);
      pointer(el, "pointerup", 0, 40);
      vi.advanceTimersByTime(HOLD_MS);
      expect(hass.callService).not.toHaveBeenCalled();
    });

    it("Enter key acts as a tap", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const el = await mountCard(hass, COMPLETE_ON_TAP);
      card(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(hass.callService).toHaveBeenCalledWith(
        "simple_chores",
        "mark_complete",
        expect.anything()
      );
    });

    it("hold stops an in-progress chore by default", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Active") });
      const el = await mountCard(hass);
      hold(el);
      expect(hass.callService).toHaveBeenCalledWith("simple_chores", "mark_pending", {
        chore_slug: "dishes",
        user: "alice",
      });
    });

    it.each([
      ["start-chore", "Pending", "mark_active"],
      ["start-chore", "Active", null],
      ["start-chore", "Complete", null],
      ["start-or-complete-chore", "Pending", "mark_active"],
      ["start-or-complete-chore", "Active", "mark_complete"],
      ["start-or-complete-chore", "Complete", null],
      ["complete-chore", "Active", "mark_complete"],
      ["reopen-chore", "Complete", "mark_pending"],
      ["reopen-chore", "Pending", null],
    ])("%s on a %s chore calls %s", async (action, state, service) => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity(state) });
      const el = await mountCard(hass, { tap_action: { action } });
      const handler = vi.fn();
      el.addEventListener("hass-action", handler);
      tap(el);
      expect(handler).not.toHaveBeenCalled();
      if (service === null) {
        expect(hass.callService).not.toHaveBeenCalled();
      } else {
        expect(hass.callService).toHaveBeenCalledWith("simple_chores", service, {
          chore_slug: "dishes",
          user: "alice",
        });
      }
    });

    it("start-chore also starts the timer helper when one is set", async () => {
      const hass = makeHass({
        [ENTITY_ID]: choreEntity("Pending", { suggested_duration: 15 }),
        "timer.chores": { entity_id: "timer.chores", state: "idle", attributes: {} },
      });
      const el = await mountCard(hass, {
        tap_action: { action: "start-chore" },
        timer_entity: "timer.chores",
      });
      tap(el);
      for (let i = 0; i < 5; i++) await Promise.resolve();
      expect(vi.mocked(hass.callService).mock.calls).toEqual([
        [
          "simple_chores",
          "mark_active",
          { chore_slug: "dishes", user: "alice", timer_entity: "timer.chores" },
        ],
        ["timer", "start", { entity_id: "timer.chores", duration: "00:15:00" }],
      ]);
    });

    it("start-chore without a timer helper only marks the chore active", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending", { suggested_duration: 15 }) });
      const el = await mountCard(hass, { tap_action: { action: "start-chore" } });
      tap(el);
      for (let i = 0; i < 5; i++) await Promise.resolve();
      expect(vi.mocked(hass.callService).mock.calls).toEqual([
        ["simple_chores", "mark_active", { chore_slug: "dishes", user: "alice" }],
      ]);
    });

    it("a configured action is handed to HA via hass-action", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const tapAction = { action: "more-info" };
      const el = await mountCard(hass, { tap_action: tapAction });
      const handler = vi.fn();
      el.addEventListener("hass-action", handler);
      tap(el);
      expect(hass.callService).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].detail).toEqual({
        config: {
          entity: ENTITY_ID,
          tap_action: tapAction,
          hold_action: undefined,
          double_tap_action: undefined,
        },
        action: "tap",
      });
    });

    it("action: none disables the default", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const el = await mountCard(hass, { tap_action: { action: "none" } });
      const handler = vi.fn();
      el.addEventListener("hass-action", handler);
      tap(el);
      expect(hass.callService).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
    });

    it("double tap fires double_tap_action instead of two taps", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const el = await mountCard(hass, { double_tap_action: { action: "more-info" } });
      const handler = vi.fn();
      el.addEventListener("hass-action", handler);
      tap(el);
      tap(el);
      vi.advanceTimersByTime(DOUBLE_TAP_MS);
      expect(hass.callService).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].detail.action).toBe("double_tap");
    });

    it("with double tap configured, a single tap still fires after the window", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      const el = await mountCard(hass, {
        ...COMPLETE_ON_TAP,
        double_tap_action: { action: "more-info" },
      });
      tap(el);
      expect(hass.callService).not.toHaveBeenCalled();
      vi.advanceTimersByTime(DOUBLE_TAP_MS);
      expect(hass.callService).toHaveBeenCalledWith(
        "simple_chores",
        "mark_complete",
        expect.anything()
      );
    });

    it("shows a notification if the service call fails", async () => {
      const hass = makeHass({ [ENTITY_ID]: choreEntity("Pending") });
      hass.callService = vi.fn().mockRejectedValue(new Error("boom"));
      const el = await mountCard(hass, COMPLETE_ON_TAP);
      const handler = vi.fn();
      el.addEventListener("hass-notification", handler);
      tap(el);
      await vi.runAllTimersAsync();
      expect(handler.mock.calls[0][0].detail.message).toContain("boom");
    });
  });

  describe("color by points", () => {
    function badgeColor(el: SimpleChoresChoreCard): string {
      return (q(el, ".badge") as HTMLElement).style.getPropertyValue("--sc-badge-color");
    }

    it("is off by default", async () => {
      const el = await mountCard(makeHass({ [ENTITY_ID]: choreEntity("Pending") }));
      expect(q(el, ".badge")!.classList.contains("points-colored")).toBe(false);
      expect(badgeColor(el)).toBe("");
    });

    it("blends between the low and high colors by points / threshold", async () => {
      const el = await mountCard(
        makeHass({ [ENTITY_ID]: choreEntity("Pending", { points: 5 }) }),
        {
          color_by_points: true,
          high_points: 10,
          low_points_color: [0, 0, 0],
          high_points_color: "#c8641e",
        }
      );
      expect(q(el, ".badge")!.classList.contains("points-colored")).toBe(true);
      expect(badgeColor(el)).toBe("rgb(100, 50, 15)");
    });

    it("uses the high color at and above the threshold", async () => {
      const el = await mountCard(
        makeHass({ [ENTITY_ID]: choreEntity("Pending", { points: 12 }) }),
        { color_by_points: true, high_points: 7, high_points_color: [1, 2, 3] }
      );
      expect(badgeColor(el)).toBe("rgb(1, 2, 3)");
    });

    it("pointsColor clamps and handles a non-positive threshold", () => {
      const low: [number, number, number] = [0, 0, 0];
      const high: [number, number, number] = [100, 100, 100];
      expect(pointsColor(0, 5, low, high)).toEqual([0, 0, 0]);
      expect(pointsColor(-3, 5, low, high)).toEqual([0, 0, 0]);
      expect(pointsColor(1, 4, low, high)).toEqual([25, 25, 25]);
      expect(pointsColor(9, 5, low, high)).toEqual([100, 100, 100]);
      expect(pointsColor(1, 0, low, high)).toEqual([100, 100, 100]);
    });

    it("parseColor accepts rgb arrays and hex, falling back otherwise", () => {
      const fallback: [number, number, number] = [9, 9, 9];
      expect(parseColor([1, 2, 300], fallback)).toEqual([1, 2, 255]);
      expect(parseColor("#ff8000", fallback)).toEqual([255, 128, 0]);
      expect(parseColor("#f80", fallback)).toEqual([255, 136, 0]);
      expect(parseColor("red", fallback)).toEqual(fallback);
      expect(parseColor(undefined, fallback)).toEqual(fallback);
    });
  });
});

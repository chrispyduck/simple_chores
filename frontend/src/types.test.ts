import { describe, expect, it } from "vitest";

import {
  CategoryDefinition,
  ChoreDefinition,
  HassEntity,
  PrivilegeDefinition,
  SETTINGS_ENTITY_ID,
  categoryToDraft,
  choreToDraft,
  displayName,
  emptyChoreDraft,
  knownAssignees,
  parseCategories,
  parseChores,
  parsePrivileges,
  parseSettings,
  parseSummaries,
  privilegeToDraft,
  sanitizeSlug,
  userDisplayNameMap,
} from "./types";

/** Build a states map from [entity_id, state, attributes] triples. */
function statesOf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...entries: Array<[string, string, Record<string, any>?]>
): Record<string, HassEntity> {
  const states: Record<string, HassEntity> = {};
  for (const [entity_id, state, attributes] of entries) {
    states[entity_id] = { entity_id, state, attributes: attributes ?? {} };
  }
  return states;
}

describe("sanitizeSlug", () => {
  it("lowercases and hyphenates spaces into underscores", () => {
    expect(sanitizeSlug("Take Out Trash")).toBe("take_out_trash");
  });

  it("converts hyphens to underscores", () => {
    expect(sanitizeSlug("wash-dishes")).toBe("wash_dishes");
  });

  it("strips characters that aren't alphanumeric or underscore", () => {
    expect(sanitizeSlug("Chore! #1 (Kitchen)")).toBe("chore_1_kitchen");
  });

  it("collapses runs of underscores into one", () => {
    expect(sanitizeSlug("foo__bar")).toBe("foo_bar");
    expect(sanitizeSlug("Foo   Bar")).toBe("foo_bar");
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(sanitizeSlug("!!!")).toBe("");
  });
});

describe("parseChores", () => {
  it("groups per-assignee sensors into one definition by chore_slug", () => {
    const states = statesOf(
      [
        "sensor.simple_chore_alice_dishes",
        "Pending",
        {
          chore_slug: "dishes",
          chore_name: "Dishes",
          assignee: "alice",
          frequency: "daily",
          points: 2,
          default_points: 2,
        },
      ],
      [
        "sensor.simple_chore_bob_dishes",
        "Complete",
        {
          chore_slug: "dishes",
          chore_name: "Dishes",
          assignee: "bob",
          frequency: "daily",
          points: 2,
          default_points: 2,
        },
      ]
    );

    const chores = parseChores(states);

    expect(chores).toHaveLength(1);
    expect(chores[0].slug).toBe("dishes");
    expect(chores[0].assignees).toHaveLength(2);
    // Assignees are sorted alphabetically within a chore.
    expect(chores[0].assignees.map((a) => a.assignee)).toEqual(["alice", "bob"]);
    expect(chores[0].assignees[0].state).toBe("Pending");
    expect(chores[0].assignees[1].state).toBe("Complete");
  });

  it("excludes privilege, summary, and category entities from the scan", () => {
    const states = statesOf(
      ["sensor.simple_chore_alice_dishes", "Pending", { chore_slug: "dishes", assignee: "alice" }],
      ["sensor.simple_chore_privilege_alice_tv", "Enabled", { privilege_slug: "tv" }],
      ["sensor.simple_chore_meta_alice_summary", "3", { assignee: "alice" }],
      ["sensor.simple_chore_category_kitchen", "1", { category_slug: "kitchen" }]
    );

    const chores = parseChores(states);

    expect(chores).toHaveLength(1);
    expect(chores[0].slug).toBe("dishes");
  });

  it("skips entities without a chore_slug attribute", () => {
    const states = statesOf(["sensor.simple_chore_orphan", "Pending", {}]);
    expect(parseChores(states)).toEqual([]);
  });

  it("resolves each assignee's own points, falling back to default_points", () => {
    const states = statesOf(
      [
        "sensor.simple_chore_alice_dishes",
        "Pending",
        {
          chore_slug: "dishes",
          assignee: "alice",
          points: 10,
          default_points: 2,
        },
      ],
      [
        "sensor.simple_chore_bob_dishes",
        "Pending",
        {
          chore_slug: "dishes",
          assignee: "bob",
          points: 2,
          default_points: 2,
        },
      ]
    );

    const [chore] = parseChores(states);

    expect(chore.points).toBe(2); // the shared default
    const alice = chore.assignees.find((a) => a.assignee === "alice")!;
    const bob = chore.assignees.find((a) => a.assignee === "bob")!;
    expect(alice.points).toBe(10); // override
    expect(bob.points).toBe(2); // follows the default
  });

  it("falls back to a resolved-points value when default_points is missing", () => {
    const states = statesOf([
      "sensor.simple_chore_alice_dishes",
      "Pending",
      { chore_slug: "dishes", assignee: "alice", points: 5 },
    ]);

    const [chore] = parseChores(states);
    expect(chore.points).toBe(5);
    expect(chore.assignees[0].points).toBe(5);
  });

  it("sorts chores by name", () => {
    const states = statesOf(
      ["sensor.simple_chore_alice_vacuum", "Pending", { chore_slug: "vacuum", chore_name: "Vacuum", assignee: "alice" }],
      ["sensor.simple_chore_alice_dishes", "Pending", { chore_slug: "dishes", chore_name: "Dishes", assignee: "alice" }]
    );

    const chores = parseChores(states);
    expect(chores.map((c) => c.name)).toEqual(["Dishes", "Vacuum"]);
  });
});

describe("parsePrivileges", () => {
  it("groups per-assignee privilege sensors by privilege_slug", () => {
    const states = statesOf(
      [
        "sensor.simple_chore_privilege_alice_tv",
        "Enabled",
        { privilege_slug: "tv", privilege_name: "TV Time", assignee: "alice", behavior: "manual" },
      ],
      [
        "sensor.simple_chore_privilege_bob_tv",
        "Disabled",
        { privilege_slug: "tv", privilege_name: "TV Time", assignee: "bob", behavior: "manual" },
      ]
    );

    const privileges = parsePrivileges(states);

    expect(privileges).toHaveLength(1);
    expect(privileges[0].assignees).toHaveLength(2);
    expect(privileges[0].behavior).toBe("manual");
  });

  it("does not pick up plain chore sensors", () => {
    const states = statesOf([
      "sensor.simple_chore_alice_dishes",
      "Pending",
      { chore_slug: "dishes", assignee: "alice" },
    ]);
    expect(parsePrivileges(states)).toEqual([]);
  });

  it("captures disable_until when present", () => {
    const states = statesOf([
      "sensor.simple_chore_privilege_alice_tv",
      "Temporarily Disabled",
      {
        privilege_slug: "tv",
        assignee: "alice",
        disable_until: "2026-01-01T12:00:00+00:00",
      },
    ]);

    const [privilege] = parsePrivileges(states);
    expect(privilege.assignees[0].disableUntil).toBe("2026-01-01T12:00:00+00:00");
  });
});

describe("parseCategories", () => {
  it("builds one definition per category entity", () => {
    const states = statesOf([
      "sensor.simple_chore_category_kitchen",
      "3",
      { category_slug: "kitchen", category_name: "Kitchen", icon: "mdi:fork" },
    ]);

    const categories = parseCategories(states);
    expect(categories).toHaveLength(1);
    expect(categories[0]).toMatchObject({
      slug: "kitchen",
      name: "Kitchen",
      icon: "mdi:fork",
      choreCount: 3,
    });
  });

  it("sorts categories by name", () => {
    const states = statesOf(
      ["sensor.simple_chore_category_z", "0", { category_slug: "z", category_name: "Zzz" }],
      ["sensor.simple_chore_category_a", "0", { category_slug: "a", category_name: "Aaa" }]
    );
    const categories = parseCategories(states);
    expect(categories.map((c) => c.name)).toEqual(["Aaa", "Zzz"]);
  });
});

describe("parseSettings", () => {
  it("returns backend defaults when the settings entity is missing", () => {
    const settings = parseSettings({});
    expect(settings).toEqual({ autoFinalizeEnabled: true, autoFinalizeDelayMinutes: 60 });
  });

  it("reads values from the settings entity when present", () => {
    const states = statesOf([
      SETTINGS_ENTITY_ID,
      "Disabled",
      { auto_finalize_enabled: false, auto_finalize_delay_minutes: 15 },
    ]);
    expect(parseSettings(states)).toEqual({
      autoFinalizeEnabled: false,
      autoFinalizeDelayMinutes: 15,
    });
  });
});

describe("parseSummaries", () => {
  it("parses a per-assignee summary sensor", () => {
    const states = statesOf([
      "sensor.simple_chore_meta_alice_summary",
      "2",
      {
        assignee: "alice",
        total_points: 42,
        points_earned: 10,
        points_missed: 3,
        points_possible: 15,
        total_pending: 1,
        total_complete: 1,
      },
    ]);

    const [summary] = parseSummaries(states);
    expect(summary).toMatchObject({
      assignee: "alice",
      totalPoints: 42,
      pointsEarned: 10,
      pointsMissed: 3,
      pointsPossible: 15,
      totalPending: 1,
      totalComplete: 1,
    });
  });

  it("excludes the settings entity even though it shares the summary prefix", () => {
    const states = statesOf([SETTINGS_ENTITY_ID, "Enabled", { auto_finalize_enabled: true }]);
    expect(parseSummaries(states)).toEqual([]);
  });

  it("sorts summaries by assignee", () => {
    const states = statesOf(
      ["sensor.simple_chore_meta_bob_summary", "0", { assignee: "bob" }],
      ["sensor.simple_chore_meta_alice_summary", "0", { assignee: "alice" }]
    );
    expect(parseSummaries(states).map((s) => s.assignee)).toEqual(["alice", "bob"]);
  });
});

describe("knownAssignees", () => {
  it("collects unique assignees from chores and privileges, sorted", () => {
    const chores: ChoreDefinition[] = [
      {
        slug: "dishes",
        name: "Dishes",
        description: "",
        frequency: "daily",
        icon: "",
        points: 1,
        category: null,
        assignees: [
          { assignee: "bob", entityId: "x", state: "Pending", points: 1 },
          { assignee: "alice", entityId: "y", state: "Pending", points: 1 },
        ],
      },
    ];
    const privileges: PrivilegeDefinition[] = [
      {
        slug: "tv",
        name: "TV",
        icon: "",
        behavior: "manual",
        linkedChores: [],
        assignees: [{ assignee: "carol", entityId: "z", state: "Enabled" }],
      },
    ];

    expect(knownAssignees(chores, privileges)).toEqual(["alice", "bob", "carol"]);
  });

  it("de-duplicates an assignee seen in both chores and privileges", () => {
    const chores: ChoreDefinition[] = [
      {
        slug: "dishes",
        name: "Dishes",
        description: "",
        frequency: "daily",
        icon: "",
        points: 1,
        category: null,
        assignees: [{ assignee: "alice", entityId: "x", state: "Pending", points: 1 }],
      },
    ];
    const privileges: PrivilegeDefinition[] = [
      {
        slug: "tv",
        name: "TV",
        icon: "",
        behavior: "manual",
        linkedChores: [],
        assignees: [{ assignee: "alice", entityId: "z", state: "Enabled" }],
      },
    ];

    expect(knownAssignees(chores, privileges)).toEqual(["alice"]);
  });
});

describe("userDisplayNameMap / displayName", () => {
  it("maps lowercased usernames to display names", () => {
    const map = userDisplayNameMap([
      { id: "1", username: "Alice", name: "Alice Smith" },
      { id: "2", username: null, name: "System User" },
    ]);
    expect(map).toEqual({ alice: "Alice Smith" });
  });

  it("looks up a display name case-insensitively, falling back to the raw value", () => {
    const map = { alice: "Alice Smith" };
    expect(displayName("Alice", map)).toBe("Alice Smith");
    expect(displayName("bob", map)).toBe("bob");
  });
});

describe("choreToDraft / emptyChoreDraft", () => {
  const baseChore: ChoreDefinition = {
    slug: "dishes",
    name: "Dishes",
    description: "Wash them",
    frequency: "daily",
    icon: "mdi:water",
    points: 2,
    category: "kitchen",
    assignees: [
      { assignee: "alice", entityId: "a", state: "Pending", points: 10 },
      { assignee: "bob", entityId: "b", state: "Pending", points: 2 },
    ],
  };

  it("only includes assignees whose points differ from the default", () => {
    const draft = choreToDraft(baseChore);
    expect(draft.pointsByAssignee).toEqual({ alice: 10 });
  });

  it("maps category null to the UNCATEGORIZED sentinel", () => {
    const draft = choreToDraft({ ...baseChore, category: null });
    expect(draft.category).toBe("");
  });

  it("carries over the assignee name list", () => {
    const draft = choreToDraft(baseChore);
    expect(draft.assignees).toEqual(["alice", "bob"]);
  });

  it("starts with an empty override map for a brand new chore", () => {
    expect(emptyChoreDraft().pointsByAssignee).toEqual({});
  });
});

describe("categoryToDraft / privilegeToDraft", () => {
  it("copies category fields into a draft", () => {
    const category: CategoryDefinition = {
      slug: "kitchen",
      name: "Kitchen",
      icon: "mdi:fork",
      entityId: "sensor.simple_chore_category_kitchen",
      choreCount: 2,
    };
    expect(categoryToDraft(category)).toEqual({
      slug: "kitchen",
      name: "Kitchen",
      icon: "mdi:fork",
    });
  });

  it("copies privilege fields, including a defensive copy of linkedChores", () => {
    const privilege: PrivilegeDefinition = {
      slug: "tv",
      name: "TV Time",
      icon: "mdi:television",
      behavior: "automatic",
      linkedChores: ["dishes"],
      assignees: [{ assignee: "alice", entityId: "x", state: "Enabled" }],
    };
    const draft = privilegeToDraft(privilege);

    expect(draft).toMatchObject({
      slug: "tv",
      name: "TV Time",
      icon: "mdi:television",
      behavior: "automatic",
      assignees: ["alice"],
    });
    expect(draft.linkedChores).toEqual(["dishes"]);
    expect(draft.linkedChores).not.toBe(privilege.linkedChores);
  });
});

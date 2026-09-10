/**
 * Minimal Home Assistant frontend surface this panel relies on. The real
 * `hass` object carries far more than this, but a custom panel should only
 * declare what it actually reads so it keeps working across HA releases.
 */
export interface HassEntity {
  entity_id: string;
  state: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: Record<string, any>;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  user?: { name?: string; is_admin?: boolean };
  callService: (
    domain: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serviceData?: Record<string, any>
  ) => Promise<unknown>;
  // Used to fetch the HA user list (for display names) via
  // "config/auth/list" - see knownUserDisplayNames() below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callWS: <T = any>(msg: Record<string, any>) => Promise<T>;
}

/** One entry from the "config/auth/list" websocket command. */
export interface HaUserInfo {
  id: string;
  username: string | null;
  name: string;
}

export const DOMAIN = "simple_chores";

// Entity id prefixes written by custom_components/simple_chores/sensor.py.
// Privilege, summary and category entities are also prefixed with the chore
// prefix, so they must be excluded explicitly when scanning for plain chore
// sensors.
export const CHORE_ENTITY_PREFIX = "sensor.simple_chore_";
export const PRIVILEGE_ENTITY_PREFIX = "sensor.simple_chore_privilege_";
export const SUMMARY_ENTITY_PREFIX = "sensor.simple_chore_meta_";
export const CATEGORY_ENTITY_PREFIX = "sensor.simple_chore_category_";

// Singleton entity publishing integration-wide settings - see
// SETTINGS_ENTITY_ID in custom_components/simple_chores/const.py. It's
// already excluded from chore scans since it falls under SUMMARY_ENTITY_PREFIX.
export const SETTINGS_ENTITY_ID = "sensor.simple_chore_meta_settings";

export type ChoreFrequency = "daily" | "manual" | "once";
export type ChoreStateValue = "Pending" | "Complete" | "Not Requested";
export type PrivilegeBehavior = "automatic" | "manual";
export type PrivilegeStateValue = "Enabled" | "Disabled" | "Temporarily Disabled";

export const CHORE_FREQUENCIES: ChoreFrequency[] = ["daily", "manual", "once"];
export const PRIVILEGE_BEHAVIORS: PrivilegeBehavior[] = ["automatic", "manual"];

export const DEFAULT_CHORE_ICON = "mdi:clipboard-list-outline";
export const DEFAULT_PRIVILEGE_ICON = "mdi:star";
export const DEFAULT_CATEGORY_ICON = "mdi:tag-outline";

/** Sentinel used in the chore filter/draft UI for "no category assigned". */
export const UNCATEGORIZED = "";

export interface ChoreAssigneeStatus {
  assignee: string;
  entityId: string;
  state: ChoreStateValue;
  /** This assignee's resolved points - the override if set, else chore.points. */
  points: number;
}

export interface ChoreDefinition {
  slug: string;
  name: string;
  description: string;
  frequency: ChoreFrequency;
  icon: string;
  /** Default points; an assignee's own resolved value lives on ChoreAssigneeStatus. */
  points: number;
  category: string | null;
  assignees: ChoreAssigneeStatus[];
}

export interface CategoryDefinition {
  slug: string;
  name: string;
  icon: string;
  entityId: string;
  choreCount: number;
}

/** Integration-wide settings, published on SETTINGS_ENTITY_ID. */
export interface SettingsDefinition {
  autoFinalizeEnabled: boolean;
  autoFinalizeDelayMinutes: number;
}

/** One assignee's points summary, published on their `..._meta_{assignee}_summary` sensor. */
export interface SummaryDefinition {
  assignee: string;
  entityId: string;
  totalPoints: number;
  pointsEarned: number;
  pointsMissed: number;
  pointsPossible: number;
  totalPending: number;
  totalComplete: number;
}

export interface PrivilegeAssigneeStatus {
  assignee: string;
  entityId: string;
  state: PrivilegeStateValue;
  disableUntil?: string;
}

export interface PrivilegeDefinition {
  slug: string;
  name: string;
  icon: string;
  behavior: PrivilegeBehavior;
  linkedChores: string[];
  assignees: PrivilegeAssigneeStatus[];
}

/** Editable draft shape backing the create/edit chore dialog. */
export interface ChoreDraft {
  slug: string;
  name: string;
  description: string;
  frequency: ChoreFrequency;
  icon: string;
  points: number;
  /**
   * Sparse per-assignee point overrides - only assignees whose reward
   * differs from `points` appear here (see choreToDraft).
   */
  pointsByAssignee: Record<string, number>;
  category: string; // "" (UNCATEGORIZED) means no category
  assignees: string[];
}

/** Editable draft shape backing the create/edit category dialog. */
export interface CategoryDraft {
  slug: string;
  name: string;
  icon: string;
}

/** Editable draft shape backing the create/edit privilege dialog. */
export interface PrivilegeDraft {
  slug: string;
  name: string;
  icon: string;
  behavior: PrivilegeBehavior;
  linkedChores: string[];
  assignees: string[];
}

export function emptyChoreDraft(): ChoreDraft {
  return {
    slug: "",
    name: "",
    description: "",
    frequency: "daily",
    icon: DEFAULT_CHORE_ICON,
    points: 1,
    pointsByAssignee: {},
    category: UNCATEGORIZED,
    assignees: [],
  };
}

export function choreToDraft(chore: ChoreDefinition): ChoreDraft {
  const pointsByAssignee: Record<string, number> = {};
  for (const a of chore.assignees) {
    if (a.points !== chore.points) pointsByAssignee[a.assignee] = a.points;
  }

  return {
    slug: chore.slug,
    name: chore.name,
    description: chore.description,
    frequency: chore.frequency,
    icon: chore.icon,
    points: chore.points,
    pointsByAssignee,
    category: chore.category ?? UNCATEGORIZED,
    assignees: chore.assignees.map((a) => a.assignee),
  };
}

export function emptyCategoryDraft(): CategoryDraft {
  return {
    slug: "",
    name: "",
    icon: DEFAULT_CATEGORY_ICON,
  };
}

export function categoryToDraft(category: CategoryDefinition): CategoryDraft {
  return {
    slug: category.slug,
    name: category.name,
    icon: category.icon,
  };
}

export function emptyPrivilegeDraft(): PrivilegeDraft {
  return {
    slug: "",
    name: "",
    icon: DEFAULT_PRIVILEGE_ICON,
    behavior: "automatic",
    linkedChores: [],
    assignees: [],
  };
}

export function privilegeToDraft(privilege: PrivilegeDefinition): PrivilegeDraft {
  return {
    slug: privilege.slug,
    name: privilege.name,
    icon: privilege.icon,
    behavior: privilege.behavior,
    linkedChores: [...privilege.linkedChores],
    assignees: privilege.assignees.map((a) => a.assignee),
  };
}

/**
 * Turn a slug candidate into the same lowercase/underscore form the backend
 * sanitizes to (see sanitize_entity_id in const.py), so the panel can show a
 * user the slug it will actually get before they submit.
 */
export function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    // Collapse runs of underscores (e.g. from "Foo  Bar" or "foo__bar")
    // into one, matching sanitize_entity_id in const.py.
    .replace(/_+/g, "_");
}

/**
 * Rebuild the list of chore definitions from the per-assignee sensor
 * entities the backend publishes. There is no single "chore" entity - each
 * assignee gets their own sensor - so definitions are recovered by grouping
 * those sensors by chore_slug.
 */
export function parseChores(states: Record<string, HassEntity>): ChoreDefinition[] {
  const bySlug = new Map<string, ChoreDefinition>();

  for (const [entityId, entity] of Object.entries(states)) {
    if (!entityId.startsWith(CHORE_ENTITY_PREFIX)) continue;
    if (entityId.startsWith(PRIVILEGE_ENTITY_PREFIX)) continue;
    if (entityId.startsWith(SUMMARY_ENTITY_PREFIX)) continue;
    if (entityId.startsWith(CATEGORY_ENTITY_PREFIX)) continue;

    const attrs = entity.attributes;
    const slug: string | undefined = attrs.chore_slug;
    if (!slug) continue;

    let definition = bySlug.get(slug);
    if (!definition) {
      definition = {
        slug,
        name: attrs.chore_name ?? slug,
        description: attrs.description ?? "",
        frequency: (attrs.frequency as ChoreFrequency) ?? "daily",
        icon: attrs.icon ?? DEFAULT_CHORE_ICON,
        // default_points is the chore's shared value; older/unrefreshed
        // sensors may not have it yet, so fall back to this assignee's
        // resolved points rather than leaving the definition unset.
        points: attrs.default_points ?? attrs.points ?? 0,
        category: attrs.category ?? null,
        assignees: [],
      };
      bySlug.set(slug, definition);
    }

    definition.assignees.push({
      assignee: attrs.assignee,
      entityId,
      state: entity.state as ChoreStateValue,
      points: attrs.points ?? definition.points,
    });
  }

  for (const definition of bySlug.values()) {
    definition.assignees.sort((a, b) => a.assignee.localeCompare(b.assignee));
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Same idea as parseChores, but for privilege sensors. */
export function parsePrivileges(
  states: Record<string, HassEntity>
): PrivilegeDefinition[] {
  const bySlug = new Map<string, PrivilegeDefinition>();

  for (const [entityId, entity] of Object.entries(states)) {
    if (!entityId.startsWith(PRIVILEGE_ENTITY_PREFIX)) continue;

    const attrs = entity.attributes;
    const slug: string | undefined = attrs.privilege_slug;
    if (!slug) continue;

    let definition = bySlug.get(slug);
    if (!definition) {
      definition = {
        slug,
        name: attrs.privilege_name ?? slug,
        icon: attrs.icon ?? DEFAULT_PRIVILEGE_ICON,
        behavior: (attrs.behavior as PrivilegeBehavior) ?? "automatic",
        linkedChores: attrs.linked_chores ?? [],
        assignees: [],
      };
      bySlug.set(slug, definition);
    }

    definition.assignees.push({
      assignee: attrs.assignee,
      entityId,
      state: entity.state as PrivilegeStateValue,
      disableUntil: attrs.disable_until,
    });
  }

  for (const definition of bySlug.values()) {
    definition.assignees.sort((a, b) => a.assignee.localeCompare(b.assignee));
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Rebuild the list of category definitions from `sensor.simple_chore_category_*`
 * entities. Unlike chores/privileges, there is exactly one entity per
 * category (categories aren't per-assignee), so no grouping is needed.
 */
export function parseCategories(
  states: Record<string, HassEntity>
): CategoryDefinition[] {
  const categories: CategoryDefinition[] = [];

  for (const [entityId, entity] of Object.entries(states)) {
    if (!entityId.startsWith(CATEGORY_ENTITY_PREFIX)) continue;

    const attrs = entity.attributes;
    const slug: string | undefined = attrs.category_slug;
    if (!slug) continue;

    categories.push({
      slug,
      name: attrs.category_name ?? slug,
      icon: attrs.icon ?? DEFAULT_CATEGORY_ICON,
      entityId,
      choreCount: Number(entity.state) || 0,
    });
  }

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

const DEFAULT_SETTINGS: SettingsDefinition = {
  autoFinalizeEnabled: true,
  autoFinalizeDelayMinutes: 60,
};

/**
 * Read integration-wide settings from SETTINGS_ENTITY_ID. Falls back to the
 * backend's own defaults if the sensor hasn't shown up yet (e.g. right
 * after startup, before the sensor platform finishes loading).
 */
export function parseSettings(states: Record<string, HassEntity>): SettingsDefinition {
  const entity = states[SETTINGS_ENTITY_ID];
  if (!entity) return { ...DEFAULT_SETTINGS };

  const attrs = entity.attributes;
  return {
    autoFinalizeEnabled: attrs.auto_finalize_enabled ?? DEFAULT_SETTINGS.autoFinalizeEnabled,
    autoFinalizeDelayMinutes:
      attrs.auto_finalize_delay_minutes ?? DEFAULT_SETTINGS.autoFinalizeDelayMinutes,
  };
}

/**
 * Rebuild each assignee's points summary from their
 * `sensor.simple_chore_meta_{assignee}_summary` entity. Excludes
 * SETTINGS_ENTITY_ID, which lives under the same prefix but isn't a
 * per-assignee summary.
 */
export function parseSummaries(states: Record<string, HassEntity>): SummaryDefinition[] {
  const summaries: SummaryDefinition[] = [];

  for (const [entityId, entity] of Object.entries(states)) {
    if (!entityId.startsWith(SUMMARY_ENTITY_PREFIX)) continue;
    if (entityId === SETTINGS_ENTITY_ID) continue;

    const attrs = entity.attributes;
    const assignee: string | undefined = attrs.assignee;
    if (!assignee) continue;

    summaries.push({
      assignee,
      entityId,
      totalPoints: attrs.total_points ?? 0,
      pointsEarned: attrs.points_earned ?? 0,
      pointsMissed: attrs.points_missed ?? 0,
      pointsPossible: attrs.points_possible ?? 0,
      totalPending: attrs.total_pending ?? 0,
      totalComplete: attrs.total_complete ?? 0,
    });
  }

  return summaries.sort((a, b) => a.assignee.localeCompare(b.assignee));
}

/** Every assignee name seen across any chore or privilege, for suggestions. */
export function knownAssignees(
  chores: ChoreDefinition[],
  privileges: PrivilegeDefinition[]
): string[] {
  const names = new Set<string>();
  for (const chore of chores) {
    for (const a of chore.assignees) names.add(a.assignee);
  }
  for (const privilege of privileges) {
    for (const a of privilege.assignees) names.add(a.assignee);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/**
 * Build a lowercased-username -> display name lookup from the HA user
 * list ("config/auth/list"), so the panel can show "Alice" instead of the
 * login username stored as `assignee` (see README: "Assignees are Home
 * Assistant users ... identified by name"). Users without a `homeassistant`
 * auth-provider credential (no username) are skipped - they can't match an
 * assignee anyway.
 */
export function userDisplayNameMap(users: HaUserInfo[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const user of users) {
    if (user.username) map[user.username.toLowerCase()] = user.name;
  }
  return map;
}

/** Look up `assignee`'s display name, falling back to the raw value. */
export function displayName(
  assignee: string,
  userDisplayNames: Record<string, string>
): string {
  return userDisplayNames[assignee.toLowerCase()] ?? assignee;
}

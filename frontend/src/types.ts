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
}

export const DOMAIN = "simple_chores";

// Entity id prefixes written by custom_components/simple_chores/sensor.py.
// Privilege and summary entities are also prefixed with the chore prefix, so
// they must be excluded explicitly when scanning for plain chore sensors.
export const CHORE_ENTITY_PREFIX = "sensor.simple_chore_";
export const PRIVILEGE_ENTITY_PREFIX = "sensor.simple_chore_privilege_";
export const SUMMARY_ENTITY_PREFIX = "sensor.simple_chore_meta_";

export type ChoreFrequency = "daily" | "manual" | "once";
export type ChoreStateValue = "Pending" | "Complete" | "Not Requested";
export type PrivilegeBehavior = "automatic" | "manual";
export type PrivilegeStateValue = "Enabled" | "Disabled" | "Temporarily Disabled";

export const CHORE_FREQUENCIES: ChoreFrequency[] = ["daily", "manual", "once"];
export const PRIVILEGE_BEHAVIORS: PrivilegeBehavior[] = ["automatic", "manual"];

export const DEFAULT_CHORE_ICON = "mdi:clipboard-list-outline";
export const DEFAULT_PRIVILEGE_ICON = "mdi:star";

export interface ChoreAssigneeStatus {
  assignee: string;
  entityId: string;
  state: ChoreStateValue;
}

export interface ChoreDefinition {
  slug: string;
  name: string;
  description: string;
  frequency: ChoreFrequency;
  icon: string;
  points: number;
  assignees: ChoreAssigneeStatus[];
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
  assignees: string[];
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
    assignees: [],
  };
}

export function choreToDraft(chore: ChoreDefinition): ChoreDraft {
  return {
    slug: chore.slug,
    name: chore.name,
    description: chore.description,
    frequency: chore.frequency,
    icon: chore.icon,
    points: chore.points,
    assignees: chore.assignees.map((a) => a.assignee),
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
    .replace(/-/g, "_")
    .replace(/[^a-z0-9_]/g, "");
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
        points: attrs.points ?? 0,
        assignees: [],
      };
      bySlug.set(slug, definition);
    }

    definition.assignees.push({
      assignee: attrs.assignee,
      entityId,
      state: entity.state as ChoreStateValue,
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

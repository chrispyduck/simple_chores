import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  CategoryDefinition,
  CategoryDraft,
  ChoreDefinition,
  ChoreDraft,
  ChoreFrequency,
  CHORE_FREQUENCIES,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_CHORE_ICON,
  DEFAULT_PRIVILEGE_ICON,
  HaUserInfo,
  HomeAssistant,
  PrivilegeBehavior,
  PrivilegeDefinition,
  PrivilegeDraft,
  PRIVILEGE_BEHAVIORS,
  SettingsDefinition,
  SummaryDefinition,
  UNCATEGORIZED,
  categoryToDraft,
  choreToDraft,
  displayName,
  emptyCategoryDraft,
  emptyChoreDraft,
  emptyPrivilegeDraft,
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

const SERVICE_DOMAIN = "simple_chores";

// Sentinel for the chores-tab category filter's "show only uncategorized
// chores" option. Distinct from UNCATEGORIZED ("") so "" can keep meaning
// "no filter, show every chore" in the filter dropdown.
const UNCATEGORIZED_FILTER = "__uncategorized__";

type Tab = "chores" | "privileges" | "categories" | "users" | "settings";

type ChoreSortKey = "name" | "points" | "frequency" | "category";

interface DialogState {
  kind: "chore" | "privilege" | "category";
  original?: string; // slug being edited; undefined when creating
  draft: ChoreDraft | PrivilegeDraft | CategoryDraft;
}

/** Local editable copy of SettingsDefinition, backing the Settings tab. */
interface SettingsDraft {
  autoFinalizeEnabled: boolean;
  autoFinalizeDelayMinutes: number;
}

/** Draft backing the Settings tab's "reset points" danger-zone dialog. */
interface ResetPointsDraft {
  user: string; // "" means all users
  resetTotal: boolean;
}

/**
 * Admin panel for managing Simple Chores chore and privilege definitions,
 * and for day-to-day operations (marking chores, enabling/disabling
 * privileges, starting a new day) that would otherwise require calling
 * services by hand.
 *
 * There is no dedicated backend API for this panel: chore/privilege
 * definitions are reconstructed from the `sensor.simple_chore_*` entities
 * the integration already publishes (see types.ts), and every mutation is a
 * plain `hass.callService` call to the same services the YAML dashboards and
 * automations use. Home Assistant only shows this panel to administrators
 * (see panel.py's require_admin=True), which is what actually restricts it.
 */
@customElement("simple-chores-panel")
export class SimpleChoresPanel extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ type: Boolean }) narrow = false;

  @state() private _tab: Tab = "chores";
  @state() private _dialog: DialogState | null = null;
  @state() private _busy = false;
  @state() private _error: string | null = null;
  @state() private _bulkUser = "";
  @state() private _categoryFilter = "";
  @state() private _choreSort: ChoreSortKey = "name";
  @state() private _userDisplayNames: Record<string, string> = {};
  @state() private _settingsDraft: SettingsDraft | null = null;
  @state() private _resetPointsDialog: ResetPointsDraft | null = null;
  @state() private _userAdjustInput: Record<string, string> = {};
  private _loadedUserDisplayNames = false;

  protected updated(changed: PropertyValues): void {
    if (changed.has("hass") && !this.hass?.user?.is_admin) {
      // The panel is only registered for admins, but guard anyway in case a
      // token is shared or the frontend caches a stale panel list.
      this._error =
        "You must be an administrator to manage chores and privileges.";
    }
    if (this.hass && !this._loadedUserDisplayNames) {
      this._loadedUserDisplayNames = true;
      this._loadUserDisplayNames();
    }
  }

  /**
   * Fetch every HA user's display name, keyed by their lowercased login
   * username, so assignees (stored as usernames - see README) can be shown
   * as people's actual names. Best-effort: falls back to raw usernames
   * everywhere if this fails, rather than blocking the panel on it.
   */
  private async _loadUserDisplayNames(): Promise<void> {
    try {
      const users = await this.hass.callWS<HaUserInfo[]>({
        type: "config/auth/list",
      });
      this._userDisplayNames = userDisplayNameMap(users);
    } catch (err) {
      console.warn("simple-chores-panel: failed to load user display names", err);
    }
  }

  private _displayName(assignee: string): string {
    return displayName(assignee, this._userDisplayNames);
  }

  render() {
    if (!this.hass) return nothing;

    const chores = parseChores(this.hass.states);
    const privileges = parsePrivileges(this.hass.states);
    const categories = parseCategories(this.hass.states);
    const settings = parseSettings(this.hass.states);
    const summaries = parseSummaries(this.hass.states);
    const assignees = knownAssignees(chores, privileges);

    return html`
      <div class="toolbar">
        <ha-icon icon="mdi:clipboard-check-outline"></ha-icon>
        <span class="toolbar-title">Chores</span>
        ${this._busy
          ? html`<ha-icon class="spin" icon="mdi:loading"></ha-icon>`
          : nothing}
      </div>

      <div class="content">
        ${this._error
          ? html`
              <div class="banner error">
                <span>${this._error}</span>
                <button class="icon-button" @click=${this._dismissError}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
            `
          : nothing}

        <div class="tabs">
          <button
            class="tab ${this._tab === "chores" ? "active" : ""}"
            @click=${() => (this._tab = "chores")}
          >
            Chores
          </button>
          <button
            class="tab ${this._tab === "privileges" ? "active" : ""}"
            @click=${() => (this._tab = "privileges")}
          >
            Privileges
          </button>
          <button
            class="tab ${this._tab === "categories" ? "active" : ""}"
            @click=${() => (this._tab = "categories")}
          >
            Categories
          </button>
          <button
            class="tab ${this._tab === "users" ? "active" : ""}"
            @click=${() => (this._tab = "users")}
          >
            Users
          </button>
          <button
            class="tab ${this._tab === "settings" ? "active" : ""}"
            @click=${() => (this._tab = "settings")}
          >
            Settings
          </button>
        </div>

        ${this._tab === "chores"
          ? this._renderChoresTab(chores, categories, assignees)
          : this._tab === "privileges"
            ? this._renderPrivilegesTab(privileges, chores, assignees)
            : this._tab === "categories"
              ? this._renderCategoriesTab(categories, assignees)
              : this._tab === "users"
                ? this._renderUsersTab(assignees, summaries)
                : this._renderSettingsTab(settings, assignees)}
      </div>

      ${this._dialog ? this._renderDialog(chores, categories, assignees) : nothing}
      ${this._resetPointsDialog ? this._renderResetPointsDialog(assignees) : nothing}
    `;
  }

  // --- Chores tab ----------------------------------------------------

  private _renderChoresTab(
    chores: ChoreDefinition[],
    categories: CategoryDefinition[],
    assignees: string[]
  ) {
    const filtered = chores.filter((chore) => {
      if (this._categoryFilter) {
        if (this._categoryFilter === UNCATEGORIZED_FILTER) {
          if (chore.category) return false;
        } else if (chore.category !== this._categoryFilter) {
          return false;
        }
      }
      if (this._bulkUser && !chore.assignees.some((a) => a.assignee === this._bulkUser)) {
        return false;
      }
      return true;
    });
    const sorted = this._sortChores(filtered, categories);

    // Only offer "Finalize by category" once a specific category is picked -
    // it needs one to scope to, unlike Reset completed / Start new day.
    const canFinalizeByCategory =
      this._categoryFilter && this._categoryFilter !== UNCATEGORIZED_FILTER;

    return html`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        ${this._renderCategoryFilterPicker(categories)}
        ${this._renderChoreSortPicker()}
        ${canFinalizeByCategory
          ? html`
              <button
                title="Reset completed manual chores in this category to not requested, and count pending ones as missed"
                @click=${() =>
                  this._categoryAction(this._categoryFilter, "finalize_by_category")}
              >
                Finalize by category
              </button>
            `
          : nothing}
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(assignees)}
        <button @click=${() => this._resetCompleted()}>Reset completed</button>
        <button @click=${() => this._startNewDay()}>Start new day</button>
      </div>

      ${this._renderPointsSummary(filtered)}

      ${sorted.length === 0
        ? html`<p class="empty">
            ${chores.length === 0
              ? "No chores yet. Create one to get started."
              : "No chores match the current filters."}
          </p>`
        : html`<div class="card-grid">
            ${sorted.map((chore) => this._renderChoreCard(chore, categories))}
          </div>`}
    `;
  }

  private _renderChoreSortPicker() {
    const options: Array<{ value: ChoreSortKey; label: string }> = [
      { value: "name", label: "Sort: Name" },
      { value: "points", label: "Sort: Points (high to low)" },
      { value: "frequency", label: "Sort: Frequency" },
      { value: "category", label: "Sort: Category" },
    ];
    return html`
      <select
        class="user-picker"
        title="Sort chores"
        .value=${this._choreSort}
        @change=${(e: Event) =>
          (this._choreSort = (e.target as HTMLSelectElement).value as ChoreSortKey)}
      >
        ${options.map((o) => html`<option value=${o.value}>${o.label}</option>`)}
      </select>
    `;
  }

  private _sortChores(
    chores: ChoreDefinition[],
    categories: CategoryDefinition[]
  ): ChoreDefinition[] {
    const sorted = [...chores];
    const categoryName = (slug: string | null) =>
      slug ? (categories.find((c) => c.slug === slug)?.name ?? slug) : "";

    switch (this._choreSort) {
      case "points":
        sorted.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
        break;
      case "frequency":
        sorted.sort(
          (a, b) => a.frequency.localeCompare(b.frequency) || a.name.localeCompare(b.name)
        );
        break;
      case "category":
        sorted.sort(
          (a, b) =>
            categoryName(a.category).localeCompare(categoryName(b.category)) ||
            a.name.localeCompare(b.name)
        );
        break;
      case "name":
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }

  /**
   * A "points possible" line summing each displayed assignee's points
   * across the currently-filtered chores - "if you did everything shown
   * here, how many points could you earn". Respects the same per-assignee
   * filter the chore cards themselves apply (see _renderChoreCard).
   */
  private _renderPointsSummary(chores: ChoreDefinition[]) {
    const totals = new Map<string, number>();
    for (const chore of chores) {
      for (const a of chore.assignees) {
        if (this._bulkUser && a.assignee !== this._bulkUser) continue;
        totals.set(a.assignee, (totals.get(a.assignee) ?? 0) + a.points);
      }
    }
    if (totals.size === 0) return nothing;

    const entries = [...totals.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    return html`
      <div class="points-summary">
        <ha-icon icon="mdi:star-outline"></ha-icon>
        <span>Points possible:</span>
        ${entries.map(
          ([assignee, total], i) => html`
            ${i > 0 ? html`<span class="points-summary-sep">·</span>` : nothing}
            <span
              ><strong>${this._displayName(assignee)}</strong> ${total}</span
            >
          `
        )}
      </div>
    `;
  }

  private _renderCategoryFilterPicker(categories: CategoryDefinition[]) {
    return html`
      <select
        class="user-picker"
        title="Filter chores by category"
        .value=${this._categoryFilter}
        @change=${(e: Event) =>
          (this._categoryFilter = (e.target as HTMLSelectElement).value)}
      >
        <option value="">All categories</option>
        <option value=${UNCATEGORIZED_FILTER}>Uncategorized</option>
        ${categories.map(
          (c) => html`<option value=${c.slug}>${c.name}</option>`
        )}
      </select>
    `;
  }

  private _renderBulkUserPicker(assignees: string[]) {
    return html`
      <select
        class="user-picker"
        title="Filter the chores shown below, and limit Reset completed / Start new day, to one assignee"
        .value=${this._bulkUser}
        @change=${(e: Event) =>
          (this._bulkUser = (e.target as HTMLSelectElement).value)}
      >
        <option value="">All assignees</option>
        ${assignees.map(
          (a) => html`<option value=${a}>${this._displayName(a)}</option>`
        )}
      </select>
    `;
  }

  private _renderChoreCard(chore: ChoreDefinition, categories: CategoryDefinition[]) {
    const hasOverrides = chore.assignees.some((a) => a.points !== chore.points);
    const pointsLabel = `${chore.points} point${chore.points === 1 ? "" : "s"}${hasOverrides ? " (default)" : ""}`;
    const categoryName = chore.category
      ? (categories.find((c) => c.slug === chore.category)?.name ?? chore.category)
      : null;
    return html`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${chore.icon || DEFAULT_CHORE_ICON}></ha-icon>
          <div class="card-title">
            <div class="name">${chore.name}</div>
            <div class="meta">
              ${chore.frequency} · ${pointsLabel}
              ${categoryName ? html` · ${categoryName}` : nothing}
              ${chore.description ? html` · ${chore.description}` : nothing}
            </div>
          </div>
          <div class="card-actions">
            <button
              class="icon-button"
              title="Edit"
              @click=${() => this._openEditChore(chore)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
            <button
              class="icon-button danger"
              title="Delete"
              @click=${() => this._deleteChore(chore)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </div>
        <div class="assignee-list">
          ${chore.assignees
            .filter((a) => !this._bulkUser || a.assignee === this._bulkUser)
            .map(
              (a) => html`
                <div class="assignee-row">
                  <span class="assignee-name">${this._displayName(a.assignee)}</span>
                  ${a.points !== chore.points
                    ? html`<span class="points-override-badge" title="Point override"
                        >${a.points}pt</span
                      >`
                    : nothing}
                  <span class="state-chip ${this._choreStateClass(a.state)}"
                    >${a.state}</span
                  >
                  <div class="row-actions">
                    <button
                      class="icon-button"
                      title="Request"
                      ?disabled=${a.state === "Pending"}
                      @click=${() =>
                        this._markChore(chore.slug, a.assignee, "mark_pending")}
                    >
                      <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Complete"
                      ?disabled=${a.state === "Complete"}
                      @click=${() =>
                        this._markChore(chore.slug, a.assignee, "mark_complete")}
                    >
                      <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Clear"
                      ?disabled=${a.state === "Not Requested"}
                      @click=${() =>
                        this._markChore(
                          chore.slug,
                          a.assignee,
                          "mark_not_requested"
                        )}
                    >
                      <ha-icon icon="mdi:close-circle-outline"></ha-icon>
                    </button>
                    <button
                      class="icon-button"
                      title="Finalize now (instead of waiting for auto-finalize)"
                      ?disabled=${a.state !== "Complete"}
                      @click=${() => this._finalizeOne(chore.slug, a.assignee)}
                    >
                      <ha-icon icon="mdi:flag-checkered"></ha-icon>
                    </button>
                  </div>
                </div>
              `
            )}
        </div>
      </div>
    `;
  }

  private _choreStateClass(state: string): string {
    if (state === "Complete") return "state-good";
    if (state === "Pending") return "state-warn";
    return "state-neutral";
  }

  // --- Privileges tab --------------------------------------------------

  private _renderPrivilegesTab(
    privileges: PrivilegeDefinition[],
    chores: ChoreDefinition[],
    assignees: string[]
  ) {
    return html`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreatePrivilege}>
          <ha-icon icon="mdi:plus"></ha-icon> New privilege
        </button>
      </div>

      ${privileges.length === 0
        ? html`<p class="empty">No privileges yet. Create one to get started.</p>`
        : html`<div class="card-grid">
            ${privileges.map((p) => this._renderPrivilegeCard(p, chores, assignees))}
          </div>`}
    `;
  }

  private _renderPrivilegeCard(
    privilege: PrivilegeDefinition,
    chores: ChoreDefinition[],
    assignees: string[]
  ) {
    void assignees; // reserved for future per-card assignee suggestions
    const linkedChoreNames = privilege.linkedChores.map(
      (slug) => chores.find((c) => c.slug === slug)?.name ?? slug
    );
    return html`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${privilege.icon || DEFAULT_PRIVILEGE_ICON}></ha-icon>
          <div class="card-title">
            <div class="name">${privilege.name}</div>
            <div class="meta">
              ${privilege.behavior}
              ${linkedChoreNames.length
                ? html` · linked: ${linkedChoreNames.join(", ")}`
                : html` · linked: all requested chores`}
            </div>
          </div>
          <div class="card-actions">
            <button
              class="icon-button"
              title="Edit"
              @click=${() => this._openEditPrivilege(privilege)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
            <button
              class="icon-button danger"
              title="Delete"
              @click=${() => this._deletePrivilege(privilege)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </div>
        <div class="assignee-list">
          ${privilege.assignees.map((a) => {
            const isTemp = a.state === "Temporarily Disabled";
            return html`
              <div class="assignee-row privilege-row">
                <div class="assignee-main">
                  <span class="assignee-name">${this._displayName(a.assignee)}</span>
                  <span class="state-chip ${this._privilegeStateClass(a.state)}">
                    ${a.state}${isTemp && a.disableUntil
                      ? html` (${this._formatUntil(a.disableUntil)})`
                      : nothing}
                  </span>
                  ${privilege.behavior === "manual"
                    ? html`
                        <div class="row-actions">
                          <button
                            class="action-chip"
                            title="Enable"
                            ?disabled=${a.state === "Enabled"}
                            @click=${() =>
                              this._call(SERVICE_DOMAIN, "enable_privilege", {
                                user: a.assignee,
                                privilege_slug: privilege.slug,
                              })}
                          >
                            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                            <span>Enable</span>
                          </button>
                          <button
                            class="action-chip"
                            title="Disable"
                            ?disabled=${a.state === "Disabled"}
                            @click=${() =>
                              this._call(SERVICE_DOMAIN, "disable_privilege", {
                                user: a.assignee,
                                privilege_slug: privilege.slug,
                              })}
                          >
                            <ha-icon icon="mdi:close-circle-outline"></ha-icon>
                            <span>Disable</span>
                          </button>
                        </div>
                      `
                    : nothing}
                </div>
                <div class="block-steppers">
                  <span class="block-steppers-label">Temporary block</span>
                  ${this._renderBlockStepper(
                    "1h",
                    isTemp,
                    () => this._adjustTemporaryDisable(privilege.slug, a.assignee, -60),
                    () =>
                      this._addTemporaryDisable(privilege.slug, a.assignee, isTemp, 60)
                  )}
                  ${this._renderBlockStepper(
                    "1d",
                    isTemp,
                    () =>
                      this._adjustTemporaryDisable(privilege.slug, a.assignee, -1440),
                    () =>
                      this._addTemporaryDisable(
                        privilege.slug,
                        a.assignee,
                        isTemp,
                        1440
                      )
                  )}
                  <button
                    class="action-chip"
                    title="Clear the block now"
                    ?disabled=${!isTemp}
                    @click=${() =>
                      this._clearTemporaryDisable(privilege.slug, a.assignee)}
                  >
                    <ha-icon icon="mdi:backspace-outline"></ha-icon>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  /**
   * A single stepper for adjusting a privilege's temporary block by a fixed
   * unit (e.g. "1h" or "1d") - a minus button, the unit, and a plus button
   * inside one bordered pill, matching how Home Assistant renders its own
   * number/counter steppers.
   */
  private _renderBlockStepper(
    unit: string,
    canShorten: boolean,
    onShorten: () => unknown,
    onExtend: () => unknown
  ) {
    return html`
      <div class="stepper">
        <button
          title="Shorten the block by ${unit}"
          ?disabled=${!canShorten}
          @click=${onShorten}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <span class="stepper-unit">${unit}</span>
        <button title="Extend the block by ${unit}" @click=${onExtend}>
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </div>
    `;
  }

  private _privilegeStateClass(state: string): string {
    if (state === "Enabled") return "state-good";
    // Temporarily Disabled (an admin actively blocked it) is the more
    // severe state, so it gets red; plain Disabled (requirements not met
    // yet, or a manual privilege simply switched off) gets orange/yellow.
    if (state === "Temporarily Disabled") return "state-bad";
    return "state-warn";
  }

  private _formatUntil(iso: string): string {
    try {
      const date = new Date(iso);
      const now = new Date();
      const sameDay = date.toDateString() === now.toDateString();
      const time = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      return sameDay ? `until ${time}` : `until ${date.toLocaleDateString()} ${time}`;
    } catch {
      return "";
    }
  }

  // --- Categories tab --------------------------------------------------

  private _renderCategoriesTab(categories: CategoryDefinition[], assignees: string[]) {
    return html`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateCategory}>
          <ha-icon icon="mdi:plus"></ha-icon> New category
        </button>
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(assignees)}
      </div>

      ${categories.length === 0
        ? html`<p class="empty">
            No categories yet. Create one, then assign it to chores.
          </p>`
        : html`<div class="card-grid">
            ${categories.map((category) => this._renderCategoryCard(category))}
          </div>`}
    `;
  }

  private _renderCategoryCard(category: CategoryDefinition) {
    const choreLabel = `${category.choreCount} chore${category.choreCount === 1 ? "" : "s"}`;
    return html`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${category.icon || DEFAULT_CATEGORY_ICON}></ha-icon>
          <div class="card-title">
            <div class="name">${category.name}</div>
            <div class="meta">${choreLabel}</div>
          </div>
          <div class="card-actions">
            <button
              class="icon-button"
              title="Edit"
              @click=${() => this._openEditCategory(category)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
            <button
              class="icon-button danger"
              title="Delete"
              @click=${() => this._deleteCategory(category)}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </button>
          </div>
        </div>
        <div class="row-actions category-actions">
          <button
            class="action-chip"
            title="Mark every chore in this category pending"
            @click=${() => this._categoryAction(category.slug, "mark_pending_by_category")}
          >
            <ha-icon icon="mdi:plus-circle-outline"></ha-icon>
            <span>Request</span>
          </button>
          <button
            class="action-chip"
            title="Mark every chore in this category complete"
            @click=${() => this._categoryAction(category.slug, "mark_complete_by_category")}
          >
            <ha-icon icon="mdi:check-circle-outline"></ha-icon>
            <span>Complete</span>
          </button>
          <button
            class="action-chip"
            title="Mark every chore in this category not requested"
            @click=${() =>
              this._categoryAction(category.slug, "mark_not_requested_by_category")}
          >
            <ha-icon icon="mdi:close-circle-outline"></ha-icon>
            <span>Clear</span>
          </button>
          <button
            class="action-chip"
            title="Reset completed manual chores in this category to not requested, and count pending ones as missed"
            @click=${() => this._categoryAction(category.slug, "finalize_by_category")}
          >
            <ha-icon icon="mdi:flag-checkered"></ha-icon>
            <span>Finalize</span>
          </button>
        </div>
      </div>
    `;
  }

  // --- Settings tab ------------------------------------------------------

  private _renderSettingsTab(settings: SettingsDefinition, assignees: string[]) {
    // Lazily seed the editable draft from the live sensor the first time
    // this tab is rendered (or after a save clears it back to null), so
    // in-progress edits aren't clobbered by unrelated hass state updates.
    if (!this._settingsDraft) {
      this._settingsDraft = {
        autoFinalizeEnabled: settings.autoFinalizeEnabled,
        autoFinalizeDelayMinutes: settings.autoFinalizeDelayMinutes,
      };
    }
    const draft = this._settingsDraft;

    return html`
      <div class="settings-section">
        <h3>Auto-finalize</h3>
        <p class="hint">
          A chore left Complete is automatically reset to Not Requested after
          the delay below, so completed chores don't keep piling up on the
          Chores tab and dashboards throughout the day. Points were already
          awarded when the chore was completed, so this never changes them.
        </p>

        <label class="checkbox-item settings-toggle">
          <input
            type="checkbox"
            .checked=${draft.autoFinalizeEnabled}
            @change=${(e: Event) => {
              draft.autoFinalizeEnabled = (e.target as HTMLInputElement).checked;
              this.requestUpdate();
            }}
          />
          Enable auto-finalize
        </label>

        <label>
          Delay (minutes)
          <input
            type="number"
            min="1"
            ?disabled=${!draft.autoFinalizeEnabled}
            .value=${String(draft.autoFinalizeDelayMinutes)}
            @input=${(e: Event) => {
              draft.autoFinalizeDelayMinutes =
                Number((e.target as HTMLInputElement).value) || 1;
              this.requestUpdate();
            }}
          />
        </label>

        <div class="actions-row">
          <button
            class="primary"
            ?disabled=${this._busy}
            @click=${() => this._saveSettings()}
          >
            Save
          </button>
          <button @click=${() => (this._settingsDraft = null)}>Reset</button>
        </div>
      </div>

      <div class="danger-zone">
        <h3>Danger zone</h3>
        <div class="danger-zone-row">
          <div class="danger-zone-text">
            <div class="danger-zone-title">Reset points</div>
            <p class="hint">
              Clears daily point stats (earned/missed) for one or every
              assignee. Optionally wipes their lifetime point total too.
              This cannot be undone.
            </p>
          </div>
          <button class="danger" @click=${() => this._openResetPointsDialog(assignees)}>
            Reset points&hellip;
          </button>
        </div>
      </div>
    `;
  }

  private async _saveSettings() {
    const draft = this._settingsDraft;
    if (!draft) return;

    const ok = await this._call(SERVICE_DOMAIN, "update_settings", {
      auto_finalize_enabled: draft.autoFinalizeEnabled,
      auto_finalize_delay_minutes: draft.autoFinalizeDelayMinutes,
    });

    if (ok) this._settingsDraft = null;
  }

  private _openResetPointsDialog = (assignees: string[]) => {
    this._error = null;
    this._resetPointsDialog = {
      user: assignees.length === 1 ? assignees[0] : "",
      resetTotal: false,
    };
  };

  private _renderResetPointsDialog(assignees: string[]) {
    const draft = this._resetPointsDialog;
    if (!draft) return nothing;

    return html`
      <div class="overlay" @click=${this._onResetPointsOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>Reset points</h2>
            <button
              class="icon-button"
              @click=${() => (this._resetPointsDialog = null)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            <p class="hint danger-text">
              This clears daily point stats and cannot be undone.
            </p>
            <label>
              Assignee
              <select
                .value=${draft.user}
                @change=${(e: Event) => {
                  draft.user = (e.target as HTMLSelectElement).value;
                  this.requestUpdate();
                }}
              >
                <option value="">All users</option>
                ${assignees.map(
                  (a) => html`<option value=${a}>${this._displayName(a)}</option>`
                )}
              </select>
            </label>
            <label class="checkbox-item">
              <input
                type="checkbox"
                .checked=${draft.resetTotal}
                @change=${(e: Event) => {
                  draft.resetTotal = (e.target as HTMLInputElement).checked;
                  this.requestUpdate();
                }}
              />
              Also reset lifetime total points
            </label>
          </div>
          <div class="dialog-footer">
            <button @click=${() => (this._resetPointsDialog = null)}>Cancel</button>
            <button
              class="danger"
              ?disabled=${this._busy}
              @click=${() => this._confirmResetPoints()}
            >
              Reset points
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _onResetPointsOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) this._resetPointsDialog = null;
  };

  private async _confirmResetPoints() {
    const draft = this._resetPointsDialog;
    if (!draft) return;

    const ok = await this._call(SERVICE_DOMAIN, "reset_points", {
      ...(draft.user ? { user: draft.user } : {}),
      reset_total: draft.resetTotal,
    });

    if (ok) this._resetPointsDialog = null;
  }

  // --- Users tab -----------------------------------------------------

  private _renderUsersTab(assignees: string[], summaries: SummaryDefinition[]) {
    const byAssignee = new Map(summaries.map((s) => [s.assignee, s]));

    return html`
      ${assignees.length === 0
        ? html`<p class="empty">
            No assignees yet. Add one to a chore or privilege to get started.
          </p>`
        : html`<div class="card-grid">
            ${assignees.map((a) => this._renderUserCard(a, byAssignee.get(a)))}
          </div>`}
    `;
  }

  private _renderUserCard(assignee: string, summary: SummaryDefinition | undefined) {
    const totalPoints = summary?.totalPoints ?? 0;
    const pointsEarned = summary?.pointsEarned ?? 0;
    const pointsMissed = summary?.pointsMissed ?? 0;
    const pointsPossible = summary?.pointsPossible ?? 0;

    return html`
      <div class="card">
        <div class="user-card-header">
          <div class="user-identity">
            <ha-icon icon="mdi:account-outline"></ha-icon>
            <span class="name">${this._displayName(assignee)}</span>
          </div>
          <div class="user-points-total" title="Lifetime total points">
            <span class="user-points-value">${totalPoints}</span>
            <span class="user-points-label">points</span>
          </div>
        </div>
        <div class="points-stats">
          <div class="points-stat">
            <span class="points-stat-value">${pointsEarned}</span>
            <span class="points-stat-label">earned today</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${pointsMissed}</span>
            <span class="points-stat-label">missed</span>
          </div>
          <div class="points-stat">
            <span class="points-stat-value">${pointsPossible}</span>
            <span class="points-stat-label">possible today</span>
          </div>
        </div>
        <div class="user-adjust-row">
          <input
            type="number"
            class="user-adjust-input"
            placeholder="±points"
            .value=${this._userAdjustInput[assignee] ?? ""}
            @input=${(e: Event) => {
              this._userAdjustInput = {
                ...this._userAdjustInput,
                [assignee]: (e.target as HTMLInputElement).value,
              };
            }}
          />
          <button @click=${() => this._applyPointsAdjustment(assignee)}>
            Apply adjustment
          </button>
        </div>
      </div>
    `;
  }

  private async _applyPointsAdjustment(assignee: string) {
    const raw = this._userAdjustInput[assignee];
    const adjustment = Number(raw);
    if (!raw || Number.isNaN(adjustment) || adjustment === 0) {
      this._error = "Enter a non-zero point adjustment first.";
      return;
    }

    const ok = await this._call(SERVICE_DOMAIN, "adjust_points", {
      user: assignee,
      adjustment,
    });

    if (ok) {
      this._userAdjustInput = { ...this._userAdjustInput, [assignee]: "" };
    }
  }

  // --- Dialog ------------------------------------------------------------

  private _renderDialog(
    chores: ChoreDefinition[],
    categories: CategoryDefinition[],
    assignees: string[]
  ) {
    if (!this._dialog) return nothing;
    const kind = this._dialog.kind;
    const verb = this._dialog.original ? "Edit" : "New";
    const noun =
      kind === "chore" ? "chore" : kind === "privilege" ? "privilege" : "category";

    return html`
      <div class="overlay" @click=${this._onOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dialog-header">
            <h2>${verb} ${noun}</h2>
            <button class="icon-button" @click=${this._closeDialog}>
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="dialog-body">
            ${kind === "chore"
              ? this._renderChoreForm(categories, assignees)
              : kind === "privilege"
                ? this._renderPrivilegeForm(chores, assignees)
                : this._renderCategoryForm()}
          </div>
          <div class="dialog-footer">
            <button @click=${this._closeDialog}>Cancel</button>
            <button
              class="primary"
              ?disabled=${this._busy}
              @click=${() =>
                kind === "chore"
                  ? this._saveChoreDialog()
                  : kind === "privilege"
                    ? this._savePrivilegeDialog()
                    : this._saveCategoryDialog()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _onOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) this._closeDialog();
  };

  private _renderChoreForm(categories: CategoryDefinition[], assignees: string[]) {
    const draft = this._dialog!.draft as ChoreDraft;
    const editing = Boolean(this._dialog!.original);
    const previewSlug = sanitizeSlug(draft.slug || draft.name);
    const willRename =
      editing && previewSlug && previewSlug !== this._dialog!.original;

    return html`
      <label>
        Name
        <input
          type="text"
          .value=${draft.name}
          @input=${(e: Event) => {
            draft.name = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${draft.slug}
          placeholder=${previewSlug || "auto-generated from name"}
          @input=${(e: Event) => {
            draft.slug = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
        ${willRename
          ? html`<span class="hint">Will be renamed to "${previewSlug}"</span>`
          : editing
            ? nothing
            : html`<span class="hint">Will be saved as "${previewSlug}"</span>`}
      </label>

      <label>
        Description
        <input
          type="text"
          .value=${draft.description}
          @input=${(e: Event) => {
            draft.description = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
      </label>

      <div class="form-row">
        <label>
          Frequency
          <select
            .value=${draft.frequency}
            @change=${(e: Event) => {
              draft.frequency = (e.target as HTMLSelectElement)
                .value as ChoreFrequency;
              this.requestUpdate();
            }}
          >
            ${CHORE_FREQUENCIES.map(
              (f) => html`<option value=${f}>${f}</option>`
            )}
          </select>
        </label>

        <label>
          Points
          <input
            type="number"
            min="0"
            .value=${String(draft.points)}
            @input=${(e: Event) => {
              draft.points = Number((e.target as HTMLInputElement).value) || 0;
              this.requestUpdate();
            }}
          />
        </label>
      </div>

      <label>
        Category
        <select
          .value=${draft.category}
          @change=${(e: Event) => {
            draft.category = (e.target as HTMLSelectElement).value;
            this.requestUpdate();
          }}
        >
          <option value=${UNCATEGORIZED}>Uncategorized</option>
          ${categories.map(
            (c) => html`<option value=${c.slug}>${c.name}</option>`
          )}
        </select>
      </label>

      ${this._renderIconField(draft.icon, DEFAULT_CHORE_ICON, (icon) => {
        draft.icon = icon;
        this.requestUpdate();
      })}

      ${this._renderAssigneeEditor(draft, assignees)}
      ${this._renderPointsByAssigneeEditor(draft)}
    `;
  }

  /**
   * Per-assignee point override inputs, one row per currently-listed
   * assignee. An input left matching the shared "Points" field above
   * follows it automatically; typing a different value overrides it just
   * for that assignee (see ChoreDraft.pointsByAssignee).
   */
  private _renderPointsByAssigneeEditor(draft: ChoreDraft) {
    if (draft.assignees.length === 0) return nothing;

    return html`
      <label>
        Points per assignee
        <span class="hint"
          >Leave matching the default above to use it; change a value to
          reward that assignee differently for this chore.</span
        >
        <div class="points-override-list">
          ${draft.assignees.map((name) => {
            const value = draft.pointsByAssignee[name] ?? draft.points;
            return html`
              <div class="points-override-row">
                <span class="points-override-name">${this._displayName(name)}</span>
                <input
                  type="number"
                  min="0"
                  class="points-override-input"
                  .value=${String(value)}
                  @input=${(e: Event) => {
                    const typed = Number((e.target as HTMLInputElement).value) || 0;
                    const rest = { ...draft.pointsByAssignee };
                    if (typed === draft.points) {
                      delete rest[name];
                    } else {
                      rest[name] = typed;
                    }
                    draft.pointsByAssignee = rest;
                    this.requestUpdate();
                  }}
                />
              </div>
            `;
          })}
        </div>
      </label>
    `;
  }

  private _renderPrivilegeForm(chores: ChoreDefinition[], assignees: string[]) {
    const draft = this._dialog!.draft as PrivilegeDraft;
    const editing = Boolean(this._dialog!.original);
    const previewSlug = sanitizeSlug(draft.slug || draft.name);
    const willRename =
      editing && previewSlug && previewSlug !== this._dialog!.original;

    return html`
      <label>
        Name
        <input
          type="text"
          .value=${draft.name}
          @input=${(e: Event) => {
            draft.name = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${draft.slug}
          placeholder=${previewSlug || "auto-generated from name"}
          @input=${(e: Event) => {
            draft.slug = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
        ${willRename
          ? html`<span class="hint">Will be renamed to "${previewSlug}"</span>`
          : editing
            ? nothing
            : html`<span class="hint">Will be saved as "${previewSlug}"</span>`}
      </label>

      <label>
        Behavior
        <select
          .value=${draft.behavior}
          @change=${(e: Event) => {
            draft.behavior = (e.target as HTMLSelectElement)
              .value as PrivilegeBehavior;
            this.requestUpdate();
          }}
        >
          ${PRIVILEGE_BEHAVIORS.map(
            (b) => html`<option value=${b}>${b}</option>`
          )}
        </select>
        <span class="hint"
          >Automatic privileges turn on when their linked chores are
          complete. Manual ones are only toggled by an admin.</span
        >
      </label>

      ${this._renderIconField(draft.icon, DEFAULT_PRIVILEGE_ICON, (icon) => {
        draft.icon = icon;
        this.requestUpdate();
      })}

      <label>
        Linked chores
        <span class="hint"
          >Leave all unchecked to require every requested chore to be
          complete instead of a specific list.</span
        >
        <div class="checkbox-list">
          ${chores.length === 0
            ? html`<span class="hint">No chores defined yet.</span>`
            : chores.map(
                (c) => html`
                  <label class="checkbox-item">
                    <input
                      type="checkbox"
                      .checked=${draft.linkedChores.includes(c.slug)}
                      @change=${(e: Event) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        draft.linkedChores = checked
                          ? [...draft.linkedChores, c.slug]
                          : draft.linkedChores.filter((s) => s !== c.slug);
                        this.requestUpdate();
                      }}
                    />
                    ${c.name}
                  </label>
                `
              )}
        </div>
      </label>

      ${this._renderAssigneeEditor(draft, assignees)}
    `;
  }

  private _renderCategoryForm() {
    const draft = this._dialog!.draft as CategoryDraft;
    const editing = Boolean(this._dialog!.original);
    const previewSlug = sanitizeSlug(draft.slug || draft.name);
    const willRename =
      editing && previewSlug && previewSlug !== this._dialog!.original;

    return html`
      <label>
        Name
        <input
          type="text"
          .value=${draft.name}
          @input=${(e: Event) => {
            draft.name = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
      </label>

      <label>
        Slug
        <input
          type="text"
          .value=${draft.slug}
          placeholder=${previewSlug || "auto-generated from name"}
          @input=${(e: Event) => {
            draft.slug = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
        ${willRename
          ? html`<span class="hint">Will be renamed to "${previewSlug}"</span>`
          : editing
            ? nothing
            : html`<span class="hint">Will be saved as "${previewSlug}"</span>`}
      </label>

      ${this._renderIconField(draft.icon, DEFAULT_CATEGORY_ICON, (icon) => {
        draft.icon = icon;
        this.requestUpdate();
      })}
    `;
  }

  private _renderIconField(
    icon: string,
    fallback: string,
    onChange: (icon: string) => void
  ) {
    return html`
      <label>
        Icon
        <div class="icon-field">
          <ha-icon .icon=${icon || fallback}></ha-icon>
          <input
            type="text"
            .value=${icon}
            placeholder=${fallback}
            @input=${(e: Event) => onChange((e.target as HTMLInputElement).value)}
          />
        </div>
      </label>
    `;
  }

  private _renderAssigneeEditor(
    draft: { assignees: string[] },
    suggestions: string[]
  ) {
    return html`
      <label>
        Assignees
        <div class="chip-list">
          ${draft.assignees.map(
            (name) => html`
              <span class="chip">
                ${this._displayName(name)}
                <button
                  class="chip-remove"
                  @click=${() => {
                    draft.assignees = draft.assignees.filter((n) => n !== name);
                    this.requestUpdate();
                  }}
                >
                  ✕
                </button>
              </span>
            `
          )}
          <input
            type="text"
            list="simple-chores-known-assignees"
            placeholder="Add assignee, press Enter"
            @keydown=${(e: KeyboardEvent) => this._onAssigneeKeydown(e, draft)}
            @blur=${(e: FocusEvent) =>
              this._commitAssigneeInput(e.target as HTMLInputElement, draft)}
          />
        </div>
      </label>
      <datalist id="simple-chores-known-assignees">
        ${suggestions.map(
          (a) => html`<option value=${a} label=${this._displayName(a)}></option>`
        )}
      </datalist>
    `;
  }

  private _onAssigneeKeydown(e: KeyboardEvent, draft: { assignees: string[] }) {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    this._commitAssigneeInput(e.target as HTMLInputElement, draft);
  }

  private _commitAssigneeInput(
    input: HTMLInputElement,
    draft: { assignees: string[] }
  ) {
    const name = input.value.trim().replace(/,$/, "");
    if (name && !draft.assignees.includes(name)) {
      draft.assignees = [...draft.assignees, name];
    }
    input.value = "";
    this.requestUpdate();
  }

  // --- Actions -------------------------------------------------------

  private _dismissError = () => {
    this._error = null;
  };

  private _closeDialog = () => {
    this._dialog = null;
  };

  private _openCreateChore = () => {
    this._error = null;
    this._dialog = { kind: "chore", draft: emptyChoreDraft() };
  };

  private _openEditChore(chore: ChoreDefinition) {
    this._error = null;
    this._dialog = {
      kind: "chore",
      original: chore.slug,
      draft: choreToDraft(chore),
    };
  }

  private _openCreatePrivilege = () => {
    this._error = null;
    this._dialog = { kind: "privilege", draft: emptyPrivilegeDraft() };
  };

  private _openEditPrivilege(privilege: PrivilegeDefinition) {
    this._error = null;
    this._dialog = {
      kind: "privilege",
      original: privilege.slug,
      draft: privilegeToDraft(privilege),
    };
  }

  private _openCreateCategory = () => {
    this._error = null;
    this._dialog = { kind: "category", draft: emptyCategoryDraft() };
  };

  private _openEditCategory(category: CategoryDefinition) {
    this._error = null;
    this._dialog = {
      kind: "category",
      original: category.slug,
      draft: categoryToDraft(category),
    };
  }

  /**
   * Build the `new_slug` field for an update_* service call, if the slug
   * field was actually edited to something new - `{}` otherwise, so
   * spreading this into the call data is a no-op when nothing changed.
   */
  private _renameField(
    originalSlug: string,
    slugFieldValue: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Record<string, any> {
    const sanitized = sanitizeSlug(slugFieldValue);
    return sanitized && sanitized !== originalSlug ? { new_slug: sanitized } : {};
  }

  private async _call(
    domain: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>
  ): Promise<boolean> {
    this._busy = true;
    try {
      await this.hass.callService(domain, service, data);
      return true;
    } catch (err) {
      this._error = err instanceof Error ? err.message : String(err);
      return false;
    } finally {
      this._busy = false;
    }
  }

  private _markChore(
    slug: string,
    user: string,
    service: "mark_complete" | "mark_pending" | "mark_not_requested"
  ) {
    return this._call(SERVICE_DOMAIN, service, { chore_slug: slug, user });
  }

  /**
   * Immediately finalize one completed chore for one assignee - the same
   * reset auto-finalize performs after its delay, triggered on demand.
   */
  private _finalizeOne(slug: string, user: string) {
    return this._call(SERVICE_DOMAIN, "finalize_one", { chore_slug: slug, user });
  }

  private _resetCompleted() {
    const data = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(SERVICE_DOMAIN, "reset_completed", data);
  }

  private _startNewDay() {
    const data = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(SERVICE_DOMAIN, "start_new_day", data);
  }

  private _categoryAction(
    categorySlug: string,
    service:
      | "mark_complete_by_category"
      | "mark_pending_by_category"
      | "mark_not_requested_by_category"
      | "finalize_by_category"
  ) {
    const data = {
      category_slug: categorySlug,
      ...(this._bulkUser ? { user: this._bulkUser } : {}),
    };
    return this._call(SERVICE_DOMAIN, service, data);
  }

  private async _deleteChore(chore: ChoreDefinition) {
    const names = chore.assignees.map((a) => this._displayName(a.assignee)).join(", ");
    if (
      !confirm(
        `Delete "${chore.name}"? This removes it for every assignee (${names}).`
      )
    ) {
      return;
    }
    await this._call(SERVICE_DOMAIN, "delete_chore", { slug: chore.slug });
  }

  private async _deletePrivilege(privilege: PrivilegeDefinition) {
    const names = privilege.assignees
      .map((a) => this._displayName(a.assignee))
      .join(", ");
    if (
      !confirm(
        `Delete "${privilege.name}"? This removes it for every assignee (${names}).`
      )
    ) {
      return;
    }
    await this._call(SERVICE_DOMAIN, "delete_privilege", { slug: privilege.slug });
  }

  private async _deleteCategory(category: CategoryDefinition) {
    if (
      !confirm(
        `Delete "${category.name}"? Chores must be uncategorized or reassigned first.`
      )
    ) {
      return;
    }
    await this._call(SERVICE_DOMAIN, "delete_category", { slug: category.slug });
  }

  private _addTemporaryDisable(
    slug: string,
    user: string,
    alreadyTemporary: boolean,
    minutes: number
  ) {
    return alreadyTemporary
      ? this._call(SERVICE_DOMAIN, "adjust_temporary_disable", {
          user,
          privilege_slug: slug,
          adjustment: minutes,
        })
      : this._call(SERVICE_DOMAIN, "temporarily_disable_privilege", {
          user,
          privilege_slug: slug,
          duration: minutes,
        });
  }

  /**
   * Nudge an in-progress block's end time by `adjustmentMinutes` (negative to
   * shorten it, positive to extend it), via the existing
   * `adjust_temporary_disable` service. Only meaningful while the privilege
   * is already temporarily disabled - callers should disable the triggering
   * button otherwise, since the service just warns and no-ops.
   */
  private _adjustTemporaryDisable(
    slug: string,
    user: string,
    adjustmentMinutes: number
  ) {
    return this._call(SERVICE_DOMAIN, "adjust_temporary_disable", {
      user,
      privilege_slug: slug,
      adjustment: adjustmentMinutes,
    });
  }

  /**
   * End a temporary block immediately, via `clear_temporary_disable`. The
   * privilege is restored to what it was right before the block (or
   * recomputed from linked chores, for automatic-behavior privileges).
   */
  private _clearTemporaryDisable(slug: string, user: string) {
    return this._call(SERVICE_DOMAIN, "clear_temporary_disable", {
      user,
      privilege_slug: slug,
    });
  }

  private async _saveChoreDialog() {
    const dialog = this._dialog!;
    const draft = dialog.draft as ChoreDraft;

    if (!draft.name.trim()) {
      this._error = "Name is required.";
      return;
    }
    if (draft.assignees.length === 0) {
      this._error = "At least one assignee is required.";
      return;
    }

    const assignees = draft.assignees.join(",");
    // Drop overrides for anyone no longer listed as an assignee.
    const pointsByAssignee = Object.entries(draft.pointsByAssignee)
      .filter(([name]) => draft.assignees.includes(name))
      .map(([name, points]) => `${name}:${points}`)
      .join(",");
    const ok = dialog.original
      ? await this._call(SERVICE_DOMAIN, "update_chore", {
          slug: dialog.original,
          name: draft.name,
          description: draft.description,
          frequency: draft.frequency,
          assignees,
          icon: draft.icon || DEFAULT_CHORE_ICON,
          points: draft.points,
          points_by_assignee: pointsByAssignee,
          category: draft.category,
          ...this._renameField(dialog.original, draft.slug || draft.name),
        })
      : await this._call(SERVICE_DOMAIN, "create_chore", {
          name: draft.name,
          slug: sanitizeSlug(draft.slug || draft.name),
          description: draft.description,
          frequency: draft.frequency,
          assignees,
          icon: draft.icon || DEFAULT_CHORE_ICON,
          points: draft.points,
          points_by_assignee: pointsByAssignee,
          category: draft.category,
        });

    if (ok) this._dialog = null;
  }

  private async _saveCategoryDialog() {
    const dialog = this._dialog!;
    const draft = dialog.draft as CategoryDraft;

    if (!draft.name.trim()) {
      this._error = "Name is required.";
      return;
    }

    const ok = dialog.original
      ? await this._call(SERVICE_DOMAIN, "update_category", {
          slug: dialog.original,
          name: draft.name,
          icon: draft.icon || DEFAULT_CATEGORY_ICON,
          ...this._renameField(dialog.original, draft.slug || draft.name),
        })
      : await this._call(SERVICE_DOMAIN, "create_category", {
          name: draft.name,
          slug: sanitizeSlug(draft.slug || draft.name),
          icon: draft.icon || DEFAULT_CATEGORY_ICON,
        });

    if (ok) this._dialog = null;
  }

  private async _savePrivilegeDialog() {
    const dialog = this._dialog!;
    const draft = dialog.draft as PrivilegeDraft;

    if (!draft.name.trim()) {
      this._error = "Name is required.";
      return;
    }
    if (draft.assignees.length === 0) {
      this._error = "At least one assignee is required.";
      return;
    }

    const assignees = draft.assignees.join(",");
    const linkedChores = draft.linkedChores.join(",");
    const ok = dialog.original
      ? await this._call(SERVICE_DOMAIN, "update_privilege", {
          slug: dialog.original,
          name: draft.name,
          icon: draft.icon || DEFAULT_PRIVILEGE_ICON,
          behavior: draft.behavior,
          linked_chores: linkedChores,
          assignees,
          ...this._renameField(dialog.original, draft.slug || draft.name),
        })
      : await this._call(SERVICE_DOMAIN, "create_privilege", {
          name: draft.name,
          slug: sanitizeSlug(draft.slug || draft.name),
          icon: draft.icon || DEFAULT_PRIVILEGE_ICON,
          behavior: draft.behavior,
          linked_chores: linkedChores,
          assignees,
        });

    if (ok) this._dialog = null;
  }

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      overflow-y: auto;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color, #212121);
      padding-bottom: env(safe-area-inset-bottom);
      box-sizing: border-box;
      font-family: var(
        --paper-font-body1_-_font-family,
        Roboto,
        system-ui,
        sans-serif
      );
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 64px;
      padding: 0 16px;
      background: var(--app-header-background-color, var(--primary-color, #03a9f4));
      color: var(--app-header-text-color, #fff);
      box-sizing: border-box;
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 400;
      flex: 1;
    }

    .spin {
      animation: spin 1.2s linear infinite;
    }
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .content {
      max-width: 960px;
      margin: 0 auto;
      padding: 16px;
      box-sizing: border-box;
    }

    .banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .banner.error {
      background: var(--error-color, #db4437);
      color: #fff;
    }
    .banner button {
      color: inherit;
    }

    .tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      margin-bottom: 16px;
    }
    .tab {
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
      cursor: pointer;
    }
    .tab.active {
      color: var(--primary-color, #03a9f4);
      border-bottom-color: var(--primary-color, #03a9f4);
    }

    .actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .spacer {
      flex: 1;
    }

    button {
      font: inherit;
      cursor: pointer;
    }

    button.primary,
    button.danger:not(.icon-button),
    .actions-row button,
    .dialog-footer button {
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      border-radius: 8px;
      padding: 8px 14px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button.primary,
    .dialog-footer button.primary {
      background: var(--primary-color, #03a9f4);
      border-color: var(--primary-color, #03a9f4);
      color: #fff;
    }
    /* :not(.icon-button) keeps this out of the circular icon-button.danger
       delete buttons below, which have their own (transparent-background)
       danger styling. */
    button.danger:not(.icon-button),
    .dialog-footer button.danger {
      background: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
      color: #fff;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }

    select.user-picker {
      border-radius: 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      padding: 8px 10px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
    }

    .icon-button {
      border: none;
      background: none;
      padding: 6px;
      border-radius: 50%;
      display: inline-flex;
      color: var(--secondary-text-color, #727272);
    }
    .icon-button:hover {
      background: rgba(0, 0, 0, 0.06);
    }
    .icon-button.danger {
      color: var(--error-color, #db4437);
    }

    .action-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #727272);
      border-radius: 999px;
      padding: 4px 10px 4px 8px;
      font: inherit;
      font-size: 12px;
      white-space: nowrap;
    }
    .action-chip ha-icon {
      --mdc-icon-size: 16px;
    }
    .action-chip:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.06);
    }
    .action-chip:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .empty {
      color: var(--secondary-text-color, #727272);
      text-align: center;
      padding: 32px 0;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .card {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      box-shadow: var(
        --ha-card-box-shadow,
        0 2px 4px rgba(0, 0, 0, 0.1)
      );
      padding: 16px;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .card-title {
      flex: 1;
      min-width: 0;
    }
    .card-title .name {
      font-size: 16px;
      font-weight: 500;
    }
    .card-title .meta {
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
      text-transform: capitalize;
    }
    .card-actions {
      display: flex;
      gap: 2px;
    }

    .assignee-list {
      margin-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .assignee-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .assignee-row:last-child {
      border-bottom: none;
    }
    .assignee-row.privilege-row {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }
    .assignee-name {
      flex: 1;
      font-size: 14px;
    }
    .row-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 6px;
      margin-left: auto;
    }
    .category-actions {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .assignee-main {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .block-steppers {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .block-steppers-label {
      font-size: 12px;
      color: var(--secondary-text-color, #727272);
      margin-right: 2px;
    }
    .stepper {
      display: inline-flex;
      align-items: stretch;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      overflow: hidden;
      height: 32px;
    }
    .stepper button {
      border: none;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      width: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .stepper button ha-icon {
      --mdc-icon-size: 16px;
    }
    .stepper button:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.06);
    }
    .stepper button:disabled {
      color: var(--disabled-text-color, #bdbdbd);
      cursor: default;
    }
    .stepper button:disabled:hover {
      background: none;
    }
    .stepper-unit {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      padding: 0 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color, #727272);
      border-left: 1px solid var(--divider-color, #e0e0e0);
      border-right: 1px solid var(--divider-color, #e0e0e0);
    }

    .state-chip {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .state-good {
      background: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
    }
    .state-warn {
      background: rgba(255, 152, 0, 0.15);
      color: #ef6c00;
    }
    .state-bad {
      background: rgba(219, 68, 55, 0.12);
      color: var(--error-color, #db4437);
    }
    .state-neutral {
      background: rgba(0, 0, 0, 0.06);
      color: var(--secondary-text-color, #727272);
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 5vh 16px;
      z-index: 10;
      overflow-y: auto;
    }
    .dialog {
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      border-radius: 12px;
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 0 20px;
    }
    .dialog-header h2 {
      font-size: 18px;
      font-weight: 500;
      margin: 0;
    }
    .dialog-body {
      padding: 8px 20px 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 20px 20px;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
    }
    input[type="text"],
    input[type="number"],
    select {
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .form-row label {
      flex: 1;
    }
    .hint {
      font-size: 12px;
      color: var(--secondary-text-color, #727272);
    }

    .icon-field {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .icon-field input {
      flex: 1;
    }

    .checkbox-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 160px;
      overflow-y: auto;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px;
    }
    .checkbox-item {
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }

    .settings-section {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      padding: 16px;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .settings-section h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }
    .settings-toggle {
      font-size: 14px;
    }

    .danger-zone {
      max-width: 420px;
      margin-top: 20px;
      border: 1px solid var(--error-color, #db4437);
      border-radius: 12px;
      padding: 16px;
      background: rgba(219, 68, 55, 0.05);
    }
    .danger-zone h3 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 500;
      color: var(--error-color, #db4437);
    }
    .danger-zone-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .danger-zone-text {
      flex: 1;
      min-width: 180px;
    }
    .danger-zone-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      margin-bottom: 2px;
    }
    .danger-zone .hint {
      margin: 0;
    }
    .danger-text {
      color: var(--error-color, #db4437);
    }

    .points-summary {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 13px;
      color: var(--secondary-text-color, #727272);
      margin-bottom: 12px;
    }
    .points-summary ha-icon {
      --mdc-icon-size: 16px;
      color: var(--primary-color, #03a9f4);
    }
    .points-summary strong {
      color: var(--primary-text-color, #212121);
      font-weight: 500;
    }
    .points-summary-sep {
      opacity: 0.5;
    }

    .user-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .user-identity {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .user-identity .name {
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .user-points-total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
    }
    .user-points-value {
      font-size: 28px;
      font-weight: 600;
      line-height: 1.1;
      color: var(--primary-color, #03a9f4);
    }
    .user-points-label {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color, #727272);
    }

    .points-stats {
      display: flex;
      gap: 16px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .points-stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .points-stat-value {
      font-size: 18px;
      font-weight: 500;
      color: var(--primary-text-color, #212121);
    }
    .points-stat-label {
      font-size: 11px;
      color: var(--secondary-text-color, #727272);
      text-align: center;
    }

    .user-adjust-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
    .user-adjust-input {
      width: 90px;
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
    }

    .points-override-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px;
      max-height: 160px;
      overflow-y: auto;
    }
    .points-override-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .points-override-name {
      font-size: 14px;
      color: var(--primary-text-color, #212121);
    }
    .points-override-input {
      width: 70px;
      font: inherit;
      font-size: 14px;
      color: var(--primary-text-color, #212121);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 6px 8px;
    }
    .points-override-badge {
      font-size: 11px;
      font-weight: 500;
      color: var(--primary-color, #03a9f4);
      background: rgba(3, 169, 244, 0.12);
      border-radius: 999px;
      padding: 2px 7px;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 6px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(3, 169, 244, 0.12);
      color: var(--primary-color, #03a9f4);
      border-radius: 999px;
      padding: 4px 6px 4px 10px;
      font-size: 13px;
    }
    .chip-remove {
      border: none;
      background: none;
      color: inherit;
      cursor: pointer;
      padding: 0 2px;
      font-size: 12px;
    }
    .chip-list input {
      border: none;
      flex: 1;
      min-width: 120px;
      padding: 4px;
    }
    .chip-list input:focus {
      outline: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-chores-panel": SimpleChoresPanel;
  }
}

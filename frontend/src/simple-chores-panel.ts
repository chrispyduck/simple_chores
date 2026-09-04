import { LitElement, html, css, nothing, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  ChoreDefinition,
  ChoreDraft,
  ChoreFrequency,
  CHORE_FREQUENCIES,
  DEFAULT_CHORE_ICON,
  DEFAULT_PRIVILEGE_ICON,
  HomeAssistant,
  PrivilegeBehavior,
  PrivilegeDefinition,
  PrivilegeDraft,
  PRIVILEGE_BEHAVIORS,
  choreToDraft,
  emptyChoreDraft,
  emptyPrivilegeDraft,
  knownAssignees,
  parseChores,
  parsePrivileges,
  privilegeToDraft,
  sanitizeSlug,
} from "./types";

const SERVICE_DOMAIN = "simple_chores";

type Tab = "chores" | "privileges";

interface DialogState {
  kind: "chore" | "privilege";
  original?: string; // slug being edited; undefined when creating
  draft: ChoreDraft | PrivilegeDraft;
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

  protected updated(changed: PropertyValues): void {
    if (changed.has("hass") && !this.hass?.user?.is_admin) {
      // The panel is only registered for admins, but guard anyway in case a
      // token is shared or the frontend caches a stale panel list.
      this._error =
        "You must be an administrator to manage chores and privileges.";
    }
  }

  render() {
    if (!this.hass) return nothing;

    const chores = parseChores(this.hass.states);
    const privileges = parsePrivileges(this.hass.states);
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
        </div>

        ${this._tab === "chores"
          ? this._renderChoresTab(chores, assignees)
          : this._renderPrivilegesTab(privileges, assignees)}
      </div>

      ${this._dialog ? this._renderDialog(chores, assignees) : nothing}
    `;
  }

  // --- Chores tab ----------------------------------------------------

  private _renderChoresTab(chores: ChoreDefinition[], assignees: string[]) {
    return html`
      <div class="actions-row">
        <button class="primary" @click=${this._openCreateChore}>
          <ha-icon icon="mdi:plus"></ha-icon> New chore
        </button>
        <div class="spacer"></div>
        ${this._renderBulkUserPicker(assignees)}
        <button @click=${() => this._resetCompleted()}>Reset completed</button>
        <button @click=${() => this._startNewDay()}>Start new day</button>
      </div>

      ${chores.length === 0
        ? html`<p class="empty">No chores yet. Create one to get started.</p>`
        : html`<div class="card-grid">
            ${chores.map((chore) => this._renderChoreCard(chore))}
          </div>`}
    `;
  }

  private _renderBulkUserPicker(assignees: string[]) {
    return html`
      <select
        class="user-picker"
        title="Limit Reset completed / Start new day to one assignee"
        .value=${this._bulkUser}
        @change=${(e: Event) =>
          (this._bulkUser = (e.target as HTMLSelectElement).value)}
      >
        <option value="">All assignees</option>
        ${assignees.map(
          (a) => html`<option value=${a}>${a}</option>`
        )}
      </select>
    `;
  }

  private _renderChoreCard(chore: ChoreDefinition) {
    const pointsLabel = `${chore.points} point${chore.points === 1 ? "" : "s"}`;
    return html`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${chore.icon || DEFAULT_CHORE_ICON}></ha-icon>
          <div class="card-title">
            <div class="name">${chore.name}</div>
            <div class="meta">
              ${chore.frequency} · ${pointsLabel}
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
          ${chore.assignees.map(
            (a) => html`
              <div class="assignee-row">
                <span class="assignee-name">${a.assignee}</span>
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
            ${privileges.map((p) => this._renderPrivilegeCard(p, assignees))}
          </div>`}
    `;
  }

  private _renderPrivilegeCard(privilege: PrivilegeDefinition, assignees: string[]) {
    void assignees; // reserved for future per-card assignee suggestions
    return html`
      <div class="card">
        <div class="card-header">
          <ha-icon .icon=${privilege.icon || DEFAULT_PRIVILEGE_ICON}></ha-icon>
          <div class="card-title">
            <div class="name">${privilege.name}</div>
            <div class="meta">
              ${privilege.behavior}
              ${privilege.linkedChores.length
                ? html` · linked: ${privilege.linkedChores.join(", ")}`
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
              <div class="assignee-row">
                <span class="assignee-name">${a.assignee}</span>
                <span class="state-chip ${this._privilegeStateClass(a.state)}">
                  ${a.state}${isTemp && a.disableUntil
                    ? html` (${this._formatUntil(a.disableUntil)})`
                    : nothing}
                </span>
                <div class="row-actions">
                  ${privilege.behavior === "manual"
                    ? html`
                        <button
                          class="icon-button"
                          title="Enable"
                          ?disabled=${a.state === "Enabled"}
                          @click=${() =>
                            this._call(SERVICE_DOMAIN, "enable_privilege", {
                              user: a.assignee,
                              privilege_slug: privilege.slug,
                            })}
                        >
                          <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                        </button>
                        <button
                          class="icon-button"
                          title="Disable"
                          ?disabled=${a.state === "Disabled"}
                          @click=${() =>
                            this._call(SERVICE_DOMAIN, "disable_privilege", {
                              user: a.assignee,
                              privilege_slug: privilege.slug,
                            })}
                        >
                          <ha-icon icon="mdi:close-circle-outline"></ha-icon>
                        </button>
                      `
                    : nothing}
                  <button
                    class="icon-button"
                    title="Block for 1 hour"
                    @click=${() =>
                      this._addTemporaryDisable(privilege.slug, a.assignee, isTemp, 60)}
                  >
                    <ha-icon icon="mdi:clock-plus-outline"></ha-icon>
                  </button>
                  <button
                    class="icon-button"
                    title="Block for 1 day"
                    @click=${() =>
                      this._addTemporaryDisable(
                        privilege.slug,
                        a.assignee,
                        isTemp,
                        1440
                      )}
                  >
                    <ha-icon icon="mdi:clock-plus"></ha-icon>
                  </button>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  private _privilegeStateClass(state: string): string {
    if (state === "Enabled") return "state-good";
    if (state === "Temporarily Disabled") return "state-warn";
    return "state-bad";
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

  // --- Dialog ------------------------------------------------------------

  private _renderDialog(chores: ChoreDefinition[], assignees: string[]) {
    if (!this._dialog) return nothing;
    const isChore = this._dialog.kind === "chore";
    const verb = this._dialog.original ? "Edit" : "New";
    const noun = isChore ? "chore" : "privilege";

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
            ${isChore
              ? this._renderChoreForm(assignees)
              : this._renderPrivilegeForm(chores, assignees)}
          </div>
          <div class="dialog-footer">
            <button @click=${this._closeDialog}>Cancel</button>
            <button
              class="primary"
              ?disabled=${this._busy}
              @click=${() =>
                isChore ? this._saveChoreDialog() : this._savePrivilegeDialog()}
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

  private _renderChoreForm(assignees: string[]) {
    const draft = this._dialog!.draft as ChoreDraft;
    const editing = Boolean(this._dialog!.original);
    const previewSlug = editing
      ? draft.slug
      : sanitizeSlug(draft.slug || draft.name);

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
          ?disabled=${editing}
          @input=${(e: Event) => {
            draft.slug = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
        ${editing
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

      ${this._renderIconField(draft.icon, DEFAULT_CHORE_ICON, (icon) => {
        draft.icon = icon;
        this.requestUpdate();
      })}

      ${this._renderAssigneeEditor(draft, assignees)}
    `;
  }

  private _renderPrivilegeForm(chores: ChoreDefinition[], assignees: string[]) {
    const draft = this._dialog!.draft as PrivilegeDraft;
    const editing = Boolean(this._dialog!.original);
    const previewSlug = editing
      ? draft.slug
      : sanitizeSlug(draft.slug || draft.name);

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
          ?disabled=${editing}
          @input=${(e: Event) => {
            draft.slug = (e.target as HTMLInputElement).value;
            this.requestUpdate();
          }}
        />
        ${editing
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
                ${name}
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
        ${suggestions.map((a) => html`<option value=${a}></option>`)}
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

  private _resetCompleted() {
    const data = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(SERVICE_DOMAIN, "reset_completed", data);
  }

  private _startNewDay() {
    const data = this._bulkUser ? { user: this._bulkUser } : {};
    return this._call(SERVICE_DOMAIN, "start_new_day", data);
  }

  private async _deleteChore(chore: ChoreDefinition) {
    const names = chore.assignees.map((a) => a.assignee).join(", ");
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
    const names = privilege.assignees.map((a) => a.assignee).join(", ");
    if (
      !confirm(
        `Delete "${privilege.name}"? This removes it for every assignee (${names}).`
      )
    ) {
      return;
    }
    await this._call(SERVICE_DOMAIN, "delete_privilege", { slug: privilege.slug });
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
    const ok = dialog.original
      ? await this._call(SERVICE_DOMAIN, "update_chore", {
          slug: dialog.original,
          name: draft.name,
          description: draft.description,
          frequency: draft.frequency,
          assignees,
          icon: draft.icon || DEFAULT_CHORE_ICON,
          points: draft.points,
        })
      : await this._call(SERVICE_DOMAIN, "create_chore", {
          name: draft.name,
          slug: sanitizeSlug(draft.slug || draft.name),
          description: draft.description,
          frequency: draft.frequency,
          assignees,
          icon: draft.icon || DEFAULT_CHORE_ICON,
          points: draft.points,
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
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .assignee-row:last-child {
      border-bottom: none;
    }
    .assignee-name {
      flex: 1;
      font-size: 14px;
    }
    .row-actions {
      display: flex;
      gap: 2px;
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

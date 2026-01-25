# Simple Chores

A Home Assistant custom integration for managing household chores.

Why? Because the Grocy integration isn't working and KidsChores is buggy. I'll add features as needed to motivate the kiddos, but this is for adults, too.

## A Note About This Code

This entire codebase was vibe coded with Claude Sonnet 4.5. This is as much an experiment in AI use and its limitations as it is a real HASS integration that provides real value.

## Basics

* All configuration is file-based, in a single yaml file. State is maintained within Home Assistant.
* Chores consist of a name, description, frequency (daily, manual), list of assignees, and slug (used to identify the chore in code).
* Assignees are Home Assistant users and are identified by name, not ID, in the config file.
* Each chore is represented in Home Assistant as a sensor following the format `sensor.simple_chore_{assignee}_{slug}`.
  * Attributes: the sensor includes all configured chore information (full name, description, frequency, points) as sensor attributes.
  * State: chore state is one of: `Pending`, `Complete`, `Not Requested`
  * **Note**: A daily chore must be requested at least once (marked as Pending or Complete) before it becomes a daily chore. Until then, it behaves like a manual chore.
* Each assignee has a summary sensor at `sensor.simple_chore_summary_{assignee}` that tracks:
  * Count of pending/complete/not requested chores
  * Lists of chores in each state
  * **Points tracking**:
    * `total_points`: Lifetime earned points (cumulative)
    * `points_missed`: Cumulative total of all missed opportunities (updated by start_new_day)
    * `points_possible`: Current sum of points from pending + complete chores (calculated in real-time)
* **Points System**: Each chore can have a point value (default: 1). When a chore is marked complete, the assignee earns those points. Points can be set when creating/updating chores. The `start_new_day` service adds pending chore points to the cumulative `points_missed` total before resetting states. The summary sensor calculates `points_possible` in real-time based on current chore states.
* The following actions are defined for interacting with chores:
  * `simple_chores.mark_complete` - Marks a chore as complete and awards points to the assignee. Takes a chore slug and optional user as parameters. If user is not specified, marks complete for all assignees.
  * `simple_chores.mark_pending` - Marks a chore as pending. Takes a chore slug and optional user as parameters. If user is not specified, marks pending for all assignees.
  * `simple_chores.mark_not_requested` - Marks a chore as not requested. Takes a chore slug and optional user as parameters. If user is not specified, marks not requested for all assignees.
  * `simple_chores.reset_completed` - Resets all completed chores to not requested. Takes an optional user parameter to reset only that user's chores.
  * `simple_chores.start_new_day` - Resets completed chores based on frequency. Manual chores reset to not requested, daily chores reset to pending. Calculates daily points statistics before resetting. Takes an optional user parameter.
  * `simple_chores.create_chore` - Dynamically create a new chore at runtime with specified properties including points.
  * `simple_chores.update_chore` - Update an existing chore's properties including name, description, frequency, assignees, points, and icon.
  * `simple_chores.delete_chore` - Remove a chore from the system.
  * `simple_chores.refresh_summary` - Force refresh of summary sensor attributes for one or all assignees.
  * `simple_chores.adjust_points` - Manually adjusts an assignee's earned points by a specified amount (positive or negative). Useful for bonuses, penalties, or corrections.
  * `simple_chores.reset_points` - Reset points tracking for one or all assignees. Always resets daily stats (points_missed, points_possible). Optionally resets total_points with `reset_total: true`.

## Installation

### HACS (Recommended)

1. Make sure [HACS](https://hacs.xyz/) is installed
2. Add this repository as a custom repository in HACS
3. Search for "Simple Chores" in HACS and install it
4. Restart Home Assistant

### Manual Installation

1. Copy the `custom_components/simple_chores` folder to your Home Assistant's `custom_components` directory
2s. Restart Home Assistant

## Configuration

Configuration is file-based using a YAML file in your Home Assistant config directory.

1. Copy `simple_chores.yaml.example` to your Home Assistant config directory as `simple_chores.yaml`
2. Edit the file to define your chores
3. Add the following to your `configuration.yaml`:

```yaml
simple_chores:
```

4. Restart Home Assistant

### Configuration File Format

The configuration file (`simple_chores.yaml`) should be placed in your Home Assistant config directory (the same directory as `configuration.yaml`).

Example configuration:

```yaml
chores:
  - name: "Take Out Trash"
    slug: "take_out_trash"
    description: "Take the trash and recycling bins to the curb"
    frequency: "manual"
    assignees:
      - "john"
      - "jane"

  - name: "Wash Dishes"
    slug: "wash_dishes"
    description: "Wash and put away dishes from dinner"
    frequency: "daily"
    assignees:
      - "john"
      - "jane"
```

**Configuration Fields:**
- `name`: Display name of the chore (required)
- `slug`: Unique identifier for the chore, used in entity IDs (required, lowercase alphanumeric with hyphens/underscores)
- `description`: Description of what the chore involves (optional)
- `frequency`: How often the chore should be done - `daily` or `manual` (required)
  - `daily`: Chore will be reset to Pending each day after being completed (must be requested at least once first)
  - `manual`: Chore will be reset to Not Requested each day after being completed
- `assignees`: List of Home Assistant usernames who can be assigned this chore (required, at least one)
- `points`: Number of points awarded when the chore is completed (optional, default: 1, must be >= 0)
- `icon`: Material Design Icon for the chore (optional, default: `mdi:clipboard-list-outline`)

The configuration file is automatically reloaded when changes are detected (checked every 5 seconds).

### Privileges Configuration

Privileges are rewards that can be earned by completing chores or managed manually. Each privilege creates a sensor at `sensor.simple_chore_privilege_{assignee}_{slug}` with state `Enabled`, `Disabled`, or `Temporarily Disabled`.

Example configuration:

```yaml
privileges:
  - name: "Screen Time"
    slug: "screen_time"
    icon: "mdi:television"
    behavior: "automatic"
    linked_chores:
      - "homework"
      - "clean_room"
    assignees:
      - "john"
      - "jane"

  - name: "Extra Dessert"
    slug: "extra_dessert"
    icon: "mdi:cupcake"
    behavior: "manual"
    assignees:
      - "john"
```

**Privilege Fields:**
- `name`: Display name of the privilege (required)
- `slug`: Unique identifier for the privilege, used in entity IDs (required, lowercase alphanumeric with hyphens/underscores)
- `icon`: Material Design Icon for the privilege (optional, default: `mdi:star`)
- `behavior`: How the privilege state is managed (required)
  - `automatic`: State is determined by linked chore completion - enabled when all linked chores are complete
  - `manual`: State is controlled via services only
- `linked_chores`: List of chore slugs that grant this privilege when completed (optional for `automatic` behavior). If omitted or empty, the privilege is enabled when ALL requested chores (pending or complete) for the assignee are complete.
- `assignees`: List of Home Assistant usernames who can earn this privilege (required, at least one)

The summary sensor for each assignee includes a `privileges` attribute containing all privileges with their current state and metadata.

## Automation Examples

An example automation for daily chore reset is provided in `automations/start_new_day.yaml`. This automation calls the `start_new_day` service at 2:00 AM each day to:
- Reset manual chores from Complete to Not Requested
- Reset daily chores from Complete to Pending (only if they were previously requested)

You can copy this to your Home Assistant automations directory or use it as a reference for creating your own automations.

## Development

This integration is based on the [integration_blueprint template](https://github.com/ludeeus/integration_blueprint).

### Setup Development Environment

1. Clone this repository
2. Open in Visual Studio Code with devcontainer support
3. The devcontainer will automatically set up the development environment
4. Run `scripts/develop` to start Home Assistant with the integration loaded

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This entire integration was written by Claude Sonnet 4.5. I had no hand in it other than writing prompts. I write enough code in my day job that I'm happy supervising an agent in my downtime.
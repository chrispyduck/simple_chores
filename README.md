# Simple Chores

A Home Assistant custom integration for managing household chores.

## Basics

* All configuration is file-based, in a single yaml file. State is maintained within Home Assistant.
* Chores consist of a name, description, frequency (daily, weekly, manual), list of assignees, and slug (used to identify the chore in code).
* Assignees are Home Assistant users and are identified by name, not ID, in the config file.
* Each chore is represented in Home Assistant as a sensor following the format s`sensor.simple_chore_{assignee}_{slug}`.
  * Attributes: the sensor includes all configured chore information (full name, description, frequency) as sensor attributes.
  * State: chore state is one of: `Pending`, `Complete`, `Not Requested`
* The following actions are defined for interacting with chores:
  * `simple_chores.mark_complete` - Marks a chore as complete. Takes a user and chore slug as parameters.
  * `simple_chores.mark_pending` - Markes a chore as pending. Takes a user and chore slug as parameters.
  * `simple_chores.mark_not_requested` - Markes a chore as not requested. Takes a user and chore slug as parameters.s

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
    frequency: "weekly"
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
- `frequency`: How often the chore should be done - `daily`, `weekly`, or `manual` (required)
- `assignees`: List of Home Assistant usernames who can be assigned this chore (required, at least one)

The configuration file is automatically reloaded when changes are detected (checked every 5 seconds).

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

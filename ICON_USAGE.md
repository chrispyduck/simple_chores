# Icon Customization

Each chore can now have a custom Material Design Icon (MDI) that will be displayed in the Home Assistant UI.

## Features

- **Per-chore icons**: Each chore has its own customizable icon
- **Default icon**: If not specified, chores use `mdi:clipboard-list-outline`
- **Icon in attributes**: The icon is also available in sensor attributes for automations
- **Dynamic updates**: Icon updates when chore configuration changes

## Usage

### Creating a Chore with Custom Icon

Use the `simple_chores.create_chore` service:

```yaml
service: simple_chores.create_chore
data:
  name: "Clean Kitchen"
  slug: "clean_kitchen"
  frequency: "daily"
  assignees: "alice,bob"
  icon: "mdi:broom"  # Custom icon
```

### Updating a Chore's Icon

Use the `simple_chores.update_chore` service:

```yaml
service: simple_chores.update_chore
data:
  slug: "clean_kitchen"
  icon: "mdi:dishwasher"  # New icon
```

### Manual Configuration

In your `simple_chores.yaml` file:

```yaml
chores:
  - name: Take Out Trash
    slug: take_out_trash
    frequency: manual
    assignees:
      - alice
      - bob
    icon: mdi:trash-can  # Custom icon

  - name: Water Plants
    slug: water_plants
    frequency: daily
    assignees:
      - charlie
    icon: mdi:watering-can  # Custom icon
```

## Icon Resources

Find Material Design Icons at: https://pictogrammers.com/library/mdi/

Popular chore icons:
- `mdi:broom` - Cleaning
- `mdi:dishwasher` - Dishes
- `mdi:trash-can` - Trash
- `mdi:watering-can` - Plants
- `mdi:vacuum` - Vacuuming
- `mdi:washing-machine` - Laundry
- `mdi:car-wash` - Car maintenance
- `mdi:dog` - Pet care
- `mdi:food` - Cooking
- `mdi:hammer-screwdriver` - Maintenance

## Sensor Attributes

The icon is available in sensor attributes for use in automations:

```yaml
{{ state_attr('sensor.simple_chore_alice_clean_kitchen', 'icon') }}
```

Returns: `mdi:broom`

# Service Actions Implementation

This document describes the service actions implemented for the Simple Chores Home Assistant integration.

## Overview

Service actions have been implemented to allow external automation and scripts to update chore states and manage points:

1. `simple_chores.mark_complete` - Mark a chore as complete for a specific user or all assignees (awards points)
2. `simple_chores.mark_pending` - Mark a chore as pending for a specific user or all assignees
3. `simple_chores.mark_not_requested` - Mark a chore as not requested for a specific user or all assignees
4. `simple_chores.reset_completed` - Reset all completed chores to not requested (optionally for a specific user)
5. `simple_chores.start_new_day` - Reset completed chores based on frequency: manual chores to not requested, daily chores to pending
6. `simple_chores.adjust_points` - Manually adjust an assignee's earned points by a specified amount (positive or negative)

## Service Parameters

### mark_complete, mark_pending, mark_not_requested

- `user` (optional, string): The assignee/user for the chore. If not provided, applies to all assignees of the chore.
- `chore_slug` (required, string): The slug identifier for the chore

### reset_completed, start_new_day

- `user` (optional, string): The assignee/user to reset chores for. If not provided, applies to all users.

### adjust_points

- `user` (required, string): The assignee/user whose points should be adjusted
- `adjustment` (required, integer): The number of points to add (positive) or subtract (negative). Range: -1,000,000,000 to 1,000,000,000

## Usage Examples

### YAML Automation

```yaml
automation:
  - alias: "Mark dishes complete when button pressed"
    trigger:
      - platform: state
        entity_id: input_button.dishes_done
    action:
      - service: simple_chores.mark_complete
        data:
          user: alice
          chore_slug: dishes
```

### Script

```yaml
script:
  mark_chore_pending:
    sequence:
      - service: simple_chores.mark_pending
        data:
          user: "{{ user }}"
          chore_slug: "{{ chore }}"
```

### Service Call in Developer Tools

```yaml
# Mark complete for specific user
service: simple_chores.mark_complete
data:
  user: alice
  chore_slug: vacuum

# Mark complete for all assignees
service: simple_chores.mark_complete
data:
  chore_slug: dishes

# Reset completed chores for all users
service: simple_chores.reset_completed
data: {}

# Start new day (reset based on frequency)
service: simple_chores.start_new_day
data: {}

# Start new day for specific user
service: simple_chores.start_new_day
data:
  user: alice

# Adjust points for an assignee
service: simple_chores.adjust_points
data:
  user: alice
  adjustment: 10

# Deduct points (negative adjustment)
service: simple_chores.adjust_points
data:
  user: bob
  adjustment: -5
```

## Points System

The integration includes a points system to gamify chore completion:

- Each chore has a `points` value (default: 1) that can be configured in the YAML file
- When a chore is marked complete, the assignee earns the configured points
- Points are accumulated and stored persistently in `.storage/simple_chores.points.json`
- Each assignee's total points are displayed in their summary sensor attributes as `total_points`
- Points can be manually adjusted using the `adjust_points` service for bonuses, penalties, or corrections

### Example Points Configuration

```yaml
chores:
  - name: "Clean Bathroom"
    slug: "clean_bathroom"
    frequency: "manual"
    points: 15  # High-effort task
    assignees:
      - "alice"

  - name: "Take Out Trash"
    slug: "take_out_trash"
    frequency: "daily"
    points: 3  # Low-effort task
    assignees:
      - "bob"
```

### Points Automation Examples

Award bonus points for completing all chores:

```yaml
automation:
  - alias: "Bonus for all chores complete"
    trigger:
      - platform: state
        entity_id: sensor.simple_chore_summary_alice
        attribute: pending_count
        to: 0
    condition:
      - condition: template
        value_template: "{{ state_attr('sensor.simple_chore_summary_alice', 'complete_count') > 0 }}"
    action:
      - service: simple_chores.adjust_points
        data:
          user: alice
          adjustment: 20
```

Weekly points reset:

```yaml
automation:
  - alias: "Reset points weekly"
    trigger:
      - platform: time
        at: "00:00:00"
    condition:
      - condition: template
        value_template: "{{ now().weekday() == 0 }}"  # Monday
    action:
      - service: simple_chores.adjust_points
        data:
          user: alice
          adjustment: "{{ -state_attr('sensor.simple_chore_summary_alice', 'total_points') }}"
```

## Implementation Details

### Files Modified

1. **custom_components/simple_chores/services.yaml**
   - Service definitions with parameter schemas
   - User-friendly descriptions for Home Assistant UI

2. **custom_components/simple_chores/services.py**
   - `async_setup_services()` function to register services
   - Five service handlers: `handle_mark_complete`, `handle_mark_pending`, `handle_mark_not_requested`, `handle_reset_completed`, `handle_start_new_day`
   - Voluptuous schema validation for service parameters
   - Support for optional `user` parameter to apply actions to all assignees/users
   - Error handling and logging

3. **custom_components/simple_chores/sensor.py**
   - Modified to store sensors in `hass.data[DOMAIN]["sensors"]` for service access
   - Sensors stored with key format: `{user}_{chore_slug}`

### Error Handling

Services handle the following error cases:

1. **Integration Not Loaded**: Logs error if Simple Chores data not found in `hass.data`
2. **Sensor Not Found**: Logs error if no sensor exists for the given user/chore combination
3. **Invalid Parameters**: Voluptuous schema validation ensures required parameters are provided

All errors are logged but do not raise exceptions, allowing automations to continue.

## Testing

Comprehensive test coverage (161 tests, 84% coverage) includes:

### Service-Specific Tests (tests/test_services.py)

- **Service Registration**: Verifies all five services are registered with correct domain
- **State Updates**: Tests each service correctly updates sensor state
- **Error Cases**: Tests behavior when sensor not found or integration not loaded
- **Integration**: Tests with multiple sensors, different users, and special characters in slugs
- **All Assignees**: Tests marking all assignees when user parameter is omitted
- **Frequency-Based Reset**: Tests start_new_day correctly handles manual vs daily chores

### Test Coverage Summary

- 31 service-specific tests
- Tests for success cases and error conditions
- Integration tests with real sensor setup
- Tests for edge cases (special characters, multiple users, all assignees)

## Service Lookup Pattern

Services locate sensors using the pattern: `{user}_{chore_slug}`

Examples:
- User "alice", chore slug "dishes" → `alice_dishes`
- User "bob", chore slug "vacuum-floors" → `bob_vacuum-floors`

This ensures each user has their own independent state for each chore.

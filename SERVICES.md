# Service Actions Implementation

This document describes the service actions implemented for the Simple Chores Home Assistant integration.

## Overview

Five service actions have been implemented to allow external automation and scripts to update chore states:

1. `simple_chores.mark_complete` - Mark a chore as complete for a specific user or all assignees
2. `simple_chores.mark_pending` - Mark a chore as pending for a specific user or all assignees
3. `simple_chores.mark_not_requested` - Mark a chore as not requested for a specific user or all assignees
4. `simple_chores.reset_completed` - Reset all completed chores to not requested (optionally for a specific user)
5. `simple_chores.start_new_day` - Reset completed chores based on frequency: manual chores to not requested, daily chores to pending

## Service Parameters

### mark_complete, mark_pending, mark_not_requested

- `user` (optional, string): The assignee/user for the chore. If not provided, applies to all assignees of the chore.
- `chore_slug` (required, string): The slug identifier for the chore

### reset_completed, start_new_day

- `user` (optional, string): The assignee/user to reset chores for. If not provided, applies to all users.

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

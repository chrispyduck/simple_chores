# Service Actions Implementation

This document describes the service actions implemented for the Simple Chores Home Assistant integration.

## Overview

Three service actions have been implemented to allow external automation and scripts to update chore states:

1. `simple_chores.mark_complete` - Mark a chore as complete
2. `simple_chores.mark_pending` - Mark a chore as pending
3. `simple_chores.mark_not_requested` - Mark a chore as not requested

## Service Parameters

All services accept the same parameters:

- `user` (required, string): The assignee/user for the chore
- `chore_slug` (required, string): The slug identifier for the chore

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
service: simple_chores.mark_complete
data:
  user: alice
  chore_slug: vacuum
```

## Implementation Details

### Files Modified

1. **custom_components/simple_chores/services.yaml**
   - Service definitions with parameter schemas
   - User-friendly descriptions for Home Assistant UI

2. **custom_components/simple_chores/__init__.py**
   - `async_setup_services()` function to register services
   - Three service handlers: `handle_mark_complete`, `handle_mark_pending`, `handle_mark_not_requested`
   - Voluptuous schema validation for service parameters
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

Comprehensive test coverage (118 tests, 96% coverage) includes:

### Service-Specific Tests (tests/test_services.py)

- **Service Registration**: Verifies all three services are registered with correct domain
- **State Updates**: Tests each service correctly updates sensor state
- **Error Cases**: Tests behavior when sensor not found or integration not loaded
- **Integration**: Tests with multiple sensors, different users, and special characters in slugs

### Test Coverage Summary

- 12 service-specific tests
- Tests for success cases and error conditions
- Integration tests with real sensor setup
- Tests for edge cases (special characters, multiple users)

## Service Lookup Pattern

Services locate sensors using the pattern: `{user}_{chore_slug}`

Examples:
- User "alice", chore slug "dishes" → `alice_dishes`
- User "bob", chore slug "vacuum-floors" → `bob_vacuum-floors`

This ensures each user has their own independent state for each chore.

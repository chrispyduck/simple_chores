# Service Actions Implementation

This document describes the service actions implemented for the Simple Chores Home Assistant integration.

## Overview

Service actions have been implemented to allow external automation and scripts to update chore states, manage points, and control privileges:

### Chore Services

1. `simple_chores.mark_complete` - Mark a chore as complete for a specific user or all assignees (awards points immediately)
2. `simple_chores.mark_pending` - Mark a chore as pending for a specific user or all assignees (deducts points if chore was previously complete)
3. `simple_chores.mark_not_requested` - Mark a chore as not requested for a specific user or all assignees
4. `simple_chores.reset_completed` - Reset all completed chores to not requested (optionally for a specific user)
5. `simple_chores.start_new_day` - Reset completed chores based on frequency: manual chores to not requested, daily chores to pending, once chores are deleted entirely (calculates missed points for pending chores)
6. `simple_chores.create_chore` - Dynamically create a new chore at runtime
7. `simple_chores.update_chore` - Update an existing chore's properties (including points)
8. `simple_chores.delete_chore` - Delete a chore
9. `simple_chores.refresh_summary` - Force refresh of summary sensor attributes
10. `simple_chores.adjust_points` - Manually adjust an assignee's earned points by a specified amount (positive or negative)
11. `simple_chores.reset_points` - Reset points tracking (daily stats and/or total points)

### Privilege Services

12. `simple_chores.enable_privilege` - Enable a privilege for a user or all assignees
13. `simple_chores.disable_privilege` - Disable a privilege for a user or all assignees
14. `simple_chores.temporarily_disable_privilege` - Temporarily disable a privilege for a specified duration
15. `simple_chores.adjust_temporary_disable` - Adjust the duration of a temporary disable
16. `simple_chores.create_privilege` - Dynamically create a new privilege at runtime
17. `simple_chores.update_privilege` - Update an existing privilege's properties
18. `simple_chores.delete_privilege` - Delete a privilege

## Service Parameters

### mark_complete, mark_pending, mark_not_requested

- `user` (optional, string): The assignee/user for the chore. If not provided, applies to all assignees of the chore.
- `chore_slug` (required, string): The slug identifier for the chore

### reset_completed, start_new_day

- `user` (optional, string): The assignee/user to reset chores for. If not provided, applies to all users.

### adjust_points

- `user` (required, string): The assignee/user whose points should be adjusted
- `adjustment` (required, integer): The number of points to add (positive) or subtract (negative). Range: -1,000,000,000 to 1,000,000,000

### reset_points

- `user` (optional, string): The assignee/user whose points should be reset. If not provided, resets points for all users.
- `reset_total` (optional, boolean): Whether to reset total_points (lifetime earned points) to zero. Default: false (only resets points_earned and daily stats)

### enable_privilege, disable_privilege

- `user` (optional, string): The assignee/user for the privilege. If not provided, applies to all assignees.
- `privilege_slug` (required, string): The slug identifier for the privilege

### temporarily_disable_privilege

- `user` (optional, string): The assignee/user for the privilege. If not provided, applies to all assignees.
- `privilege_slug` (required, string): The slug identifier for the privilege
- `duration` (required, integer): Duration in minutes for the temporary disable

### adjust_temporary_disable

- `user` (optional, string): The assignee/user for the privilege. If not provided, applies to all assignees.
- `privilege_slug` (required, string): The slug identifier for the privilege
- `adjustment` (required, integer): Minutes to add (positive) or subtract (negative) from the disable duration

### create_privilege

- `name` (required, string): Display name of the privilege
- `slug` (required, string): Unique identifier for the privilege
- `icon` (optional, string): Material Design Icon (default: "mdi:star")
- `behavior` (optional, string): "automatic" or "manual" (default: "automatic")
- `linked_chores` (optional, string): Comma-separated list of chore slugs
- `assignees` (required, string): Comma-separated list of assignee usernames

### update_privilege

- `slug` (required, string): The slug of the privilege to update
- `name` (optional, string): New display name
- `icon` (optional, string): New icon
- `behavior` (optional, string): New behavior mode
- `linked_chores` (optional, string): New linked chores (comma-separated)
- `assignees` (optional, string): New assignees (comma-separated)

### delete_privilege

- `slug` (required, string): The slug of the privilege to delete

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

# Reset daily points stats (missed/possible) for a specific user
service: simple_chores.reset_points
data:
  user: alice

# Reset all points including lifetime total for a user
service: simple_chores.reset_points
data:
  user: alice
  reset_total: true

# Reset daily stats for all users
service: simple_chores.reset_points
data:
  reset_total: false

# Reset everything for all users
service: simple_chores.reset_points
data:
  reset_total: true
```

## Points System

The integration includes a comprehensive points system to gamify chore completion:

- Each chore has a `points` value (default: 1) that can be configured in the YAML file or set when creating/updating chores
- **Points are awarded when `start_new_day` is called**, not when chores are marked complete
  - Completed chores earn their configured points
  - Pending chores count as missed opportunities
- Points are accumulated and stored persistently in `.storage/simple_chores.points.json`
- Each assignee's summary sensor displays four point-related attributes:
  - `total_points`: Lifetime earned points (cumulative across all time, only reset with `reset_total: true`)
  - `points_earned`: Resettable earned points (updated by `start_new_day`, resets when `reset_points` is called)
  - `points_missed`: **Cumulative total** of all missed points - updated by `start_new_day` service by adding points from pending chores. This tracks all opportunities missed over time.
  - `points_possible`: **Real-time calculation** - sum of points from currently pending + complete chores. Always reflects current state.
- Points can be manually adjusted using the `adjust_points` service for bonuses, penalties, or corrections
- The `start_new_day` service:
  - Awards points for all completed chores (updates `total_points` and `points_earned`)
  - Adds pending chore points to cumulative `points_missed` total
  - Then resets chore states based on frequency (manual → Not Requested, daily → Pending, once → deleted)
- Points tracking can be reset using the `reset_points` service:
  - By default, resets points_earned and cumulative points_missed to zero
  - With `reset_total: true`, also resets lifetime total_points to zero
  - Note: `points_possible` is always calculated dynamically from current chore states

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
      - service: simple_chores.reset_points
        data:
          reset_total: true  # Reset everything
```

Reset daily stats (missed/possible) at start of day:

```yaml
automation:
  - alias: "Reset daily point stats"
    trigger:
      - platform: time
        at: "02:00:00"
    action:
      - service: simple_chores.reset_points
        data:
          reset_total: false  # Keep lifetime total, reset daily stats
```

Notify when points are missed:

```yaml
automation:
  - alias: "Notify points missed"
    trigger:
      - platform: state
        entity_id: sensor.simple_chore_summary_alice
        attribute: points_missed
    condition:
      - condition: template
        value_template: "{{ state_attr('sensor.simple_chore_summary_alice', 'points_missed') | int > 0 }}"
    action:
      - service: notify.mobile_app
        data:
          message: "You missed {{ state_attr('sensor.simple_chore_summary_alice', 'points_missed') }} points worth of chores today!"
```

## Privilege System

Privileges are rewards that can be granted or revoked based on chore completion or manual control.

### Privilege States

- **Enabled**: The privilege is active and available
- **Disabled**: The privilege is revoked
- **Temporarily Disabled**: The privilege is revoked for a specific duration

### Privilege Behaviors

- **automatic**: The privilege state is automatically managed based on linked chore completion. When all linked chores are complete, the privilege is enabled. When any linked chore becomes incomplete, the privilege is disabled.
- **manual**: The privilege state is only changed via service calls. Linked chores are ignored for state management.

### Privilege Sensors

Each privilege creates a sensor with the format: `sensor.simple_chore_privilege_{assignee}_{slug}`

Sensor attributes include:
- `privilege_name`: Display name of the privilege
- `privilege_slug`: Unique identifier
- `assignee`: The user this privilege belongs to
- `behavior`: "automatic" or "manual"
- `linked_chores`: List of chore slugs that affect this privilege
- `icon`: Material Design Icon
- `disable_until`: (when temporarily disabled) ISO timestamp when the disable expires

### Example Privilege Configuration

```yaml
privileges:
  - name: "Screen Time"
    slug: "screen_time"
    icon: "mdi:television"
    behavior: "automatic"
    linked_chores:
      - "wash_dishes"
      - "homework"
    assignees:
      - "kid1"

  - name: "Gaming"
    slug: "gaming"
    icon: "mdi:gamepad-variant"
    behavior: "manual"
    linked_chores: []
    assignees:
      - "kid1"
```

### Privilege Service Examples

Enable a privilege manually:

```yaml
service: simple_chores.enable_privilege
data:
  user: kid1
  privilege_slug: gaming
```

Temporarily disable a privilege:

```yaml
service: simple_chores.temporarily_disable_privilege
data:
  user: kid1
  privilege_slug: screen_time
  duration: 30  # minutes
```

Adjust temporary disable duration:

```yaml
service: simple_chores.adjust_temporary_disable
data:
  user: kid1
  privilege_slug: screen_time
  adjustment: 15  # Add 15 more minutes
```

### Privilege Automation Examples

Turn off TV when privilege is disabled:

```yaml
automation:
  - alias: "Disable TV when screen time revoked"
    trigger:
      - platform: state
        entity_id: sensor.simple_chore_privilege_kid1_screen_time
        to: "Disabled"
    action:
      - service: media_player.turn_off
        target:
          entity_id: media_player.living_room_tv
```

Notify when privilege is temporarily disabled:

```yaml
automation:
  - alias: "Notify privilege timeout"
    trigger:
      - platform: state
        entity_id: sensor.simple_chore_privilege_kid1_screen_time
        to: "Temporarily Disabled"
    action:
      - service: notify.mobile_app_parent
        data:
          message: "Screen time disabled until {{ state_attr('sensor.simple_chore_privilege_kid1_screen_time', 'disable_until') }}"
```

Announce when privilege is enabled by completing chores:

```yaml
automation:
  - alias: "Announce screen time enabled"
    trigger:
      - platform: state
        entity_id: sensor.simple_chore_privilege_kid1_screen_time
        to: "Enabled"
    action:
      - service: tts.speak
        target:
          entity_id: media_player.living_room_speaker
        data:
          message: "Great job! Screen time is now enabled."
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

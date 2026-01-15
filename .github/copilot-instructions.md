# Simple Chores - AI Coding Agent Instructions

## Project Overview
A Home Assistant custom integration for tracking household chores with points, assignments, and daily/manual frequency management.

## Architecture Pattern

### Core Components (custom_components/simple_chores/)
```
ConfigLoader (config_loader.py)
    ↓ loads YAML → SimpleChoresConfig (models.py)
    ↓ provides to
Sensors (sensor.py)
    - ChoreSensor per (assignee, chore) → sensor.simple_chore_{assignee}_{slug}
    - ChoreSummarySensor per assignee → sensor.simple_chore_summary_{assignee}
    ↓ managed by
Services (services.py)
    - 11 services with voluptuous schemas
    - Call _update_summary_sensors() after state changes
    ↓ persist via
PointsStorage (data.py)
    - Wraps Home Assistant Store API
    - Three dictionaries: points, points_missed, points_possible
```

### Key Design Decisions

**Entity Naming Convention:**
- Chore sensors: `sensor.simple_chore_{assignee}_{slug}`
- Summary sensors: `sensor.simple_chore_summary_{assignee}`
- Use `sanitize_entity_id()` from const.py for safe entity IDs

**Service Parameter Pattern:**
- `user` parameter is optional in ALL services
- Defaults to "all users" when omitted
- Always validate against actual assignees in config

**Points System (Critical!):**
- **Points update IMMEDIATELY** when chores are marked complete/pending:
  - `mark_complete`: Awards points to `total_points` and `points_earned`
  - `mark_pending` (from complete): Deducts points from `total_points` and `points_earned`
- `total_points`: Lifetime earned points (stored, only reset with `reset_total: true`)
  - Updated immediately by `mark_complete` and `mark_pending`
- `points_earned`: Resettable earned points (stored, reset by `reset_points` even if `reset_total: false`)
  - Updated immediately by `mark_complete` and `mark_pending`
  - Use for weekly/monthly leaderboards that reset
- `points_missed`: **Cumulative** counter, updated ONLY by `start_new_day` service
  - Accumulates pending chore points before resetting states
  - Use `add_points_missed()` to add to cumulative total
- `points_possible`: **Calculated invariant** in summary sensor
  - **INVARIANT: points_earned + points_missed = points_possible**
  - Never stored, always computed as `points_earned + points_missed`
  - Represents the total opportunity (what was earned + what was missed)

**Summary Sensor Updates:**
Services that modify chore/point state MUST call `_update_summary_sensors(hass, user)`:
- mark_complete, mark_pending, mark_not_requested
- reset_completed, start_new_day
- create_chore, update_chore, delete_chore
- adjust_points, reset_points

**State Reading Pattern (CRITICAL!):**
- **ALWAYS use `sensor._attr_native_value` when reading current sensor state in service handlers**
- **NEVER use `sensor.native_value`** - it may return cached values from the state machine
- The `_attr_native_value` is the actual internal state that reflects the most recent update
- This is especially critical in services that:
  - Check previous state before awarding/deducting points (mark_complete, mark_pending)
  - Check current state before resetting (reset_completed, start_new_day)
  - Read state for summary sensor attribute calculations
- Example: `was_complete = sensor._attr_native_value == ChoreState.COMPLETE.value  # noqa: SLF001`
- The summary sensor's `extra_state_attributes` property also uses this pattern for the same reason

**Event Loop Synchronization:**
- After batch state updates (e.g., `asyncio.gather()`), add `await asyncio.sleep(0)` to yield to event loop
- This ensures state updates are fully processed before reading them elsewhere
- Example in `start_new_day`: yield after sensor updates, then yield after summary updates

## Development Workflow

### Setup & Running
```bash
# Development mode (from /workspaces/simple_chores)
./scripts/develop

# Linting (ruff format + ruff check --fix)
./scripts/lint
```

**Development Script Details:**
- Sets `PYTHONPATH="${PYTHONPATH}:${PWD}/custom_components"`
- Starts HA with `--debug --skip-pip-packages simple_chores`
- Uses config from `./config/` directory

### Testing

**Framework:** pytest 8.3.4 with `pytest-homeassistant-custom-component`

**Test Organization:**
- Class-based: `TestMarkCompleteService`, `TestPointsTracking`, etc.
- Use `hass` fixture (NOT custom mock_hass)
- 60 tests total (53 core + 7 points tracking)

**Mock Patterns:**
```python
# Sensor state mocking
sensor = MagicMock()
sensor.state = STATE_PENDING
sensor.async_write_ha_state = AsyncMock()

# Sensor manager mocking
sensor_manager = MagicMock()
sensor_manager.get_sensor.return_value = sensor
sensor_manager.get_summary_sensor.return_value = summary_sensor
```

**Running Tests:**
```bash
pytest                    # All tests
pytest -v                 # Verbose
pytest --cov              # With coverage
```

**Coverage Goal:** 53% minimum (configured in pyproject.toml)

## Code Patterns

### Service Implementation
1. **Schema Definition** (voluptuous):
```python
SERVICE_MARK_COMPLETE_SCHEMA = vol.Schema({
    vol.Required(ATTR_USER): cv.string,  # or vol.Optional
    vol.Required(ATTR_SLUG): cv.string,
    # ... other params
})
```

2. **Handler Function:**
```python
async def async_handle_mark_complete(call: ServiceCall) -> None:
    """Handle mark_complete service."""
    hass = call.hass
    user = call.data[ATTR_USER]

    # CRITICAL: Use _attr_native_value to read current state
    was_complete = sensor._attr_native_value == ChoreState.COMPLETE.value  # noqa: SLF001

    # ... business logic

    await _update_summary_sensors(hass, user)  # CRITICAL!
```

3. **Registration** in `__init__.py`:
```python
hass.services.async_register(
    DOMAIN,
    SERVICE_MARK_COMPLETE,
    async_handle_mark_complete,
    schema=SERVICE_MARK_COMPLETE_SCHEMA,
)
```

### Configuration Validation (Pydantic)
- Models in `models.py` use Pydantic v2
- Validators: `@field_validator("slug")` for field-level validation
- Cross-field: `@model_validator` for multi-field logic
- Frozen=False: ChoreConfig instances are mutable
- Extra="forbid": Reject unknown fields

### State Management
- ChoreState enum: PENDING, COMPLETE, NOT_REQUESTED
- Frequency enum: DAILY, MANUAL
- State transitions:
  - `start_new_day`: DAILY chores → PENDING
  - `mark_complete`: → COMPLETE
  - `mark_pending`: → PENDING
  - `reset_completed`: COMPLETE → NOT_REQUESTED

### Storage Operations (data.py)
```python
# Initialize
storage = PointsStorage(hass, entry_id)
await storage.async_load()

# Points operations
await storage.add_points(user, amount)
total = await storage.get_points(user)

# Points missed (cumulative!)
await storage.add_points_missed(user, amount)  # Adds to total
await storage.set_points_missed(user, amount)  # Sets absolute value
```

## Common Pitfalls

1. **Using `sensor.native_value` instead of `sensor._attr_native_value`** when reading current state
2. **Forgetting _update_summary_sensors()** after state changes
3. **Storing points_possible** instead of calculating dynamically
4. **Using set_points_missed()** when you should use add_points_missed()
5. **start_new_day order:** Calculate missed points BEFORE resetting states
6. **Testing without hass fixture:** Use pytest-homeassistant-custom-component's hass
7. **Entity ID sanitization:** Always use sanitize_entity_id() for slugs
8. **Missing event loop yields:** Add `await asyncio.sleep(0)` after batch state updates

## File Locations

- **Service schemas & handlers:** custom_components/simple_chores/services.py
- **Constants:** custom_components/simple_chores/const.py (11 SERVICE_ constants)
- **Data models:** custom_components/simple_chores/models.py (Pydantic)
- **Sensors:** custom_components/simple_chores/sensor.py (lines 525-561 for points_possible calc)
- **Storage:** custom_components/simple_chores/data.py (PointsStorage class)
- **Tests:** tests/ directory (test_services.py is largest at 2365 lines)
- **Documentation:** SERVICES.md (user-facing), README.md (overview)

## Key Constants (const.py)
Services: SERVICE_MARK_COMPLETE, SERVICE_MARK_PENDING, SERVICE_MARK_NOT_REQUESTED, SERVICE_RESET_COMPLETED, SERVICE_START_NEW_DAY, SERVICE_CREATE_CHORE, SERVICE_UPDATE_CHORE, SERVICE_DELETE_CHORE, SERVICE_REFRESH_SUMMARY, SERVICE_ADJUST_POINTS, SERVICE_RESET_POINTS

States: STATE_PENDING, STATE_COMPLETE, STATE_NOT_REQUESTED

Attributes: ATTR_USER, ATTR_SLUG, ATTR_NAME, ATTR_DESCRIPTION, ATTR_FREQUENCY, ATTR_ASSIGNEES, ATTR_ICON, ATTR_POINTS, ATTR_AMOUNT, ATTR_RESET_TOTAL, ATTR_RESET_MISSED

## Example: Adding a New Service

1. Add SERVICE_MY_ACTION to const.py
2. Create schema in services.py:
   ```python
   SERVICE_MY_ACTION_SCHEMA = vol.Schema({
       vol.Optional(ATTR_USER): cv.string,
       # ... params
   })
   ```
3. Create handler that calls `await _update_summary_sensors(hass, user)`
4. Register in async_setup_services() in __init__.py
5. Add to services.yaml for HA UI
6. Write test class in test_services.py
7. Update SERVICES.md documentation
8. Update service count in README.md

## Testing Checklist
- [ ] All state transitions tested
- [ ] Summary sensor updates verified
- [ ] Points calculations checked (missed vs possible)
- [ ] User="all users" case covered
- [ ] Edge cases (missing user, invalid slug) handled
- [ ] AsyncMock used for async_write_ha_state
- [ ] Test uses hass fixture, not custom mock

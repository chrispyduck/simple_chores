# Simple Chores Tests

This directory contains comprehensive unit tests for the Simple Chores Home Assistant integration.

## Test Structure

- `test_models.py` - Tests for Pydantic models and data validation
- `test_config_loader.py` - Tests for configuration loading and file watching
- `test_sensor.py` - Tests for sensor platform and entity management
- `test_init.py` - Tests for integration setup and lifecycle
- `conftest.py` - Shared fixtures and test utilities

## Running Tests

### Run all tests
```bash
pytest
```

### Run specific test file
```bash
pytest tests/test_models.py
```

### Run with coverage report
```bash
pytest --cov=custom_components.simple_chores --cov-report=term-missing
```

### Run specific test
```bash
pytest tests/test_models.py::TestChoreConfig::test_valid_chore_config
```

### Run in verbose mode
```bash
pytest -v
```

## Test Coverage

The test suite covers:

### Models (`test_models.py`)
- ✅ ChoreFrequency and ChoreState enum values
- ✅ ChoreConfig validation (slugs, assignees, extra fields)
- ✅ SimpleChoresConfig validation (duplicate slugs, queries)
- ✅ Helper methods (get_chore_by_slug, get_chores_for_assignee)

### Config Loader (`test_config_loader.py`)
- ✅ Configuration file loading (valid, invalid, missing)
- ✅ YAML parsing and Pydantic validation
- ✅ File watching and change detection
- ✅ Callback registration and notification
- ✅ Error handling for malformed configs

### Sensor Platform (`test_sensor.py`)
- ✅ Platform setup and entity registration
- ✅ Sensor manager lifecycle (add/remove/update)
- ✅ ChoreSensor state management
- ✅ State persistence across reloads
- ✅ Multiple assignees per chore
- ✅ Dynamic configuration updates

### Integration Setup (`test_init.py`)
- ✅ async_setup with config loading
- ✅ File watcher initialization
- ✅ Platform discovery and loading
- ✅ Entry unload and cleanup
- ✅ Error handling for config load failures

## Requirements

Tests require the following packages (included in `requirements.txt`):
- pytest>=8.0.0
- pytest-asyncio>=0.23.0
- pytest-cov>=4.1.0
- pytest-homeassistant-custom-component>=0.13.0

## Continuous Integration

These tests are designed to run in CI/CD pipelines. The pytest configuration is in `pyproject.toml`.

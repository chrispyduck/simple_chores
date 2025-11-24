# Icon and Logo Setup

This document explains how icons and logos are configured for the Simple Chores integration.

## Overview

The integration includes comprehensive icon support at multiple levels:

1. **Integration Icon** - Shows in the integrations list
2. **Service Icons** - Shows for each service action
3. **Entity Icons** - Shows for sensor states
4. **Entity Pictures** - Optional logo images for entities

## Files and Locations

### Asset Files (in repository)

Located in `assets/`:

- `logo.svg` - Vector logo (6.6KB) - Public Domain image from liftarn
- `icon.png` - 256×256 pixel PNG
- `icon@2x.png` - 512×512 pixel high-res PNG for retina displays
- `README.md` - Attribution and license information

**Source:** https://freesvg.org/cleaning-tools-vector-image
**License:** Public Domain (CC0 1.0)

### Web-Accessible Files

For the entity pictures to work, logo files must be copied to your Home Assistant's `www` directory:

```
<ha_config>/www/community/simple_chores/
├── logo.svg
├── icon.png
└── icon@2x.png
```

These files are then accessible at: `/local/community/simple_chores/logo.svg`

## Icon Configuration

### Integration Icon

Defined in `manifest.json`:

```json
{
  "icon": "mdi:broom"
}
```

This Material Design Icon shows in the Home Assistant integrations list.

### Service Icons

Defined in `services.yaml`:

- `mark_complete` - `mdi:check-circle` ✓
- `mark_pending` - `mdi:clipboard-list` 📋
- `mark_not_requested` - `mdi:close-circle-outline` ⊘
- `create_chore` - `mdi:plus-circle` ➕
- `update_chore` - `mdi:pencil-circle` ✏️
- `delete_chore` - `mdi:delete-circle` 🗑️

These icons appear in the Home Assistant services UI.

### Entity/Sensor Icons

Defined in `icons.json` and `sensor.py`:

- **Default:** `mdi:clipboard-list-outline` 📋
- **Complete state:** `mdi:check-circle` ✓
- **Pending state:** `mdi:clipboard-list` 📋
- **Not Requested state:** `mdi:clipboard-list-outline` 📋

Icons automatically change based on the chore state.

### Entity Pictures

Configured in `sensor.py`:

```python
self._attr_entity_picture = f"/local/community/simple_chores/logo.svg"
```

This displays the cleaning tools logo for each chore sensor entity, giving them a visual identity beyond just icons.

## Customization

### Using Different Icons

To use different MDI icons, edit:

1. **Integration:** Change `icon` in `manifest.json`
2. **Services:** Change `icon` values in `services.yaml`
3. **Entities:** Change `_attr_icon` values in `sensor.py`

Browse available icons at: https://pictogrammers.com/library/mdi/

### Using Custom Images

To use custom entity pictures:

1. Place your image in `<ha_config>/www/community/simple_chores/`
2. Update the `entity_picture` path in `sensor.py`
3. Restart Home Assistant

Supported formats: SVG, PNG, JPG, GIF

### Per-Person Images

To use different images for each person, modify `sensor.py`:

```python
# Instead of:
self._attr_entity_picture = f"/local/community/simple_chores/logo.svg"

# Use:
self._attr_entity_picture = f"/local/community/simple_chores/avatars/{assignee}.png"
```

Then place avatar images at:
```
<ha_config>/www/community/simple_chores/avatars/
├── alice.png
├── bob.png
└── charlie.png
```

## Troubleshooting

### Icons Not Showing

1. **Integration icon not visible:** Clear browser cache and refresh Home Assistant
2. **Service icons missing:** Restart Home Assistant after changes
3. **Entity pictures not loading:**
   - Verify files exist in `<ha_config>/www/community/simple_chores/`
   - Check file permissions are readable
   - Access directly at `http://<ha_ip>:8123/local/community/simple_chores/logo.svg`
   - Clear browser cache

### Logo Attribution

The logo is properly attributed in `custom_components/simple_chores/assets/README.md`. The image is Public Domain (CC0) and can be used freely.

## Future Enhancements

Potential improvements:

1. **Brand Integration:** Submit icons to Home Assistant's brands repository
2. **Dynamic Icons:** Different icons per chore type
3. **Progress Indicators:** Visual progress bars or percentages
4. **Theme Support:** Light/dark mode icon variants
5. **Animated Icons:** GIF or CSS animations for pending states

# Smooth Tile Transition

A Foundry VTT module that adds smooth transition capabilities to tiles when toggle visibility state. Features fade in/out, pop in/out, slide, scale, and rotation transitions with customizable duration.

## Features

- **Multiple Animation Types**: Fade, pop, slide, scale, and rotate animations
- **Customizable Settings**: Duration, delay, easing, and loop options
- **Flexible Triggers**: Scene activation, click, or manual triggering
- **Easy Configuration**: Simple tab in tile configuration dialog
- **Performance Optimized**: Smooth animations with minimal performance impact
- **Macro Support**: API for programmatic animation control

## Usage

### Basic Setup

1. **Select a tile** on your canvas
2. **Open the tile configuration**
3. **Go to the "Appearance" tab**
4. **Choose your desired settings**
5. **Save the configuration**
6. **Toggle visibility state**

### Transition Types

- **Fade In/Out**: Smooth opacity transitions
- **Pop In/Out**: Scale and opacity combined for dramatic effect
- **Slide In**: Slide from any direction (left, right, top, bottom)
- **Scale In/Out**: Size-based animations
- **Rotate In/Out**: Rotation animations

### Easing Functions

- **Linear**: Constant speed
- **Ease In**: Starts slow, ends fast
- **Ease Out**: Starts fast, ends slow
- **Ease In Out**: Smooth acceleration and deceleration
- **Bounce**: Bouncy effect
- **Elastic**: Elastic spring effect

### Triggers

- **On Scene Visible**: Animation plays when the scene becomes active
- **On Click**: Animation plays when the tile is clicked (requires additional setup)
- **Manual**: Animation must be triggered via macro or API

## Module Settings

### Global Settings

- **Default Animation Duration**: Set the default duration for all animations
- **Default Easing**: Choose the default easing function
- **Enable Animations**: Toggle animations globally on/off
- **Default Animation Delay**: Set default delay before animations start
- **Show Notifications**: Display notifications when animations trigger
- **Debug Mode**: Enable debug logging in console

## Macro API

The module provides a global API for programmatic control:

### Basic Functions

```javascript
// Trigger animation for a specific tile
SmoothTileTransitionAPI.triggerTileAnimation('tileId');

// Trigger all tile animations in the current scene
SmoothTileTransitionAPI.triggerAllTileAnimations();

// Get animation data for a tile
const animationData = SmoothTileTransitionAPI.getTileAnimation('tileId');

// Set animation for a tile programmatically
SmoothTileTransitionAPI.setTileAnimation('tileId', {
    enabled: true,
    type: 'fade-in',
    duration: 1000,
    delay: 0,
    easing: 'ease-in-out',
    loop: false,
    trigger: 'manual'
});
```

### Example Macros

**Trigger Animation for Selected Tile:**
```javascript
const selectedTile = canvas.tiles.controlled[0];
if (selectedTile) {
    SmoothTileTransitionAPI.triggerTileAnimation(selectedTile.id);
} else {
    ui.notifications.warn('No tile selected');
}
```

**Set Fade Animation for All Tiles:**
```javascript
canvas.scene.tiles.forEach(tile => {
    SmoothTileTransitionAPI.setTileAnimation(tile.id, {
        enabled: true,
        type: 'fade-in',
        duration: 2000,
        delay: 0,
        easing: 'ease-in-out',
        loop: false,
        trigger: 'manual'
    });
});
```

**Sequential Animation Trigger:**
```javascript
const tiles = Array.from(canvas.scene.tiles.values());
tiles.forEach((tile, index) => {
    setTimeout(() => {
        SmoothTileTransitionAPI.triggerTileAnimation(tile.id);
    }, index * 500); // 500ms delay between each tile
});
```

## Animation Configuration

### Animation Object Structure

```javascript
{
    enabled: boolean,           // Whether animation is active
    type: string,              // Animation type (fade-in, pop-out, etc.)
    duration: number,          // Duration in milliseconds
    delay: number,             // Delay before animation starts
    easing: string,            // Easing function
    loop: boolean,             // Whether to loop the animation
    trigger: string            // Trigger type (on-visible, on-click, manual)
}
```

### Supported Animation Types

- `fade-in` / `fade-out`
- `pop-in` / `pop-out`
- `slide-in-left` / `slide-in-right` / `slide-in-top` / `slide-in-bottom`
- `scale-in` / `scale-out`
- `rotate-in` / `rotate-out`

### Supported Easing Functions

- `linear`
- `ease-in`
- `ease-out`
- `ease-in-out`
- `bounce`
- `elastic`

## Compatibility

- **Foundry VTT**: Version 13+
- **Systems**: All systems
- **Modules**: Compatible with most modules

## Troubleshooting

### Common Issues

1. **Animations not playing**: Check if animations are enabled in module settings
2. **Performance issues**: Reduce animation duration or disable animations for complex scenes
3. **Tiles not found**: Ensure the tile ID is correct and the tile exists in the current scene

### Debug Mode

Enable debug mode in module settings to see detailed console logs for troubleshooting.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This module is licensed under the MIT License.

## Support

For support, please visit the GitHub repository or contact the author.

## Changelog

### Version 1.0.0
- Initial release
- Basic animation types (fade, pop, slide, scale, rotate)
- Configuration tab in tile dialog
- Macro API support
- Multiple easing functions
- Trigger system
- Performance optimizations 
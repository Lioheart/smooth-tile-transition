import { MODULE_ID } from "./scripts/constants/module.js";

/**
 * Available transition types for tile animations
 * @type {Object}
 */
const TRANSITION_TYPES = {
    NONE: "none",
    FADE_IN_OUT: "fade_in_out",
    ZOOM_IN_OUT: "zoom_in_out"
};

// Store previous visibility states in memory (not in tile flags)
const tileVisibilityStates = new Map();

// Track tiles that are currently animating to prevent multiple animations
const animatingTiles = new Set();

/**
 * Hook to add the fieldset in tile configuration
 * @param {Object} app - The TileConfig application instance
 * @param {HTMLElement} html - The HTML element of the configuration form
 * @param {Object} data - The form data
 */
Hooks.on("renderTileConfig", (app, html, data) => {
    const currentTransition = app.document.getFlag(MODULE_ID, "transitionType") ?? TRANSITION_TYPES.NONE;
    const currentDuration = app.document.getFlag(MODULE_ID, "transitionDuration") ?? 1.0;
    
    const formHtml = `
    <fieldset>
        <legend>Animation Transitions</legend>
        <div class="form-group">
            <label for="flags.${MODULE_ID}.transitionType">Type</label>
            <div class="form-fields">
                <select name="flags.${MODULE_ID}.transitionType">
                    <option value="${TRANSITION_TYPES.NONE}" ${currentTransition === TRANSITION_TYPES.NONE ? 'selected' : ''}>None</option>
                    <option value="${TRANSITION_TYPES.FADE_IN_OUT}" ${currentTransition === TRANSITION_TYPES.FADE_IN_OUT ? 'selected' : ''}>Fade In/Out</option>
                    <option value="${TRANSITION_TYPES.ZOOM_IN_OUT}" ${currentTransition === TRANSITION_TYPES.ZOOM_IN_OUT ? 'selected' : ''}>Zoom In/Out</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="flags.${MODULE_ID}.transitionDuration">Duration (seconds)</label>
            <div class="form-fields">
                <input type="range" 
                       name="flags.${MODULE_ID}.transitionDuration" 
                       value="${currentDuration}" 
                       min="0.1" 
                       max="5.0" 
                       step="0.1" 
                       style="flex: 10;">
                <span style="text-align: center;">${currentDuration}s</span>
            </div>
        </div>
    </fieldset>
    `;
    
    // Insert after the texture.tint field
    const tab = html.querySelector('.tab[data-tab="appearance"]');
    if (tab) {
        tab.insertAdjacentHTML('beforeend', formHtml);
        html.querySelector('.window-content').style.overflow = 'auto';
        // Add event listener to update the display value
        const durationInput = html.querySelector(`[name="flags.${MODULE_ID}.transitionDuration"]`);
        const durationDisplay = durationInput?.nextElementSibling;
        if (durationInput && durationDisplay) {
            durationInput.addEventListener('input', (e) => {
                durationDisplay.textContent = `${e.target.value}s`;
            });
        }
        
        app.setPosition({ height: "auto" });
        console.log('SmoothTileTransition: Fieldset added to tile configuration');
    } else {
        console.log('SmoothTileTransition: texture.tint field not found');
    }
});

/**
 * Hook to handle animations when tiles are refreshed (appearance/disappearance)
 * @param {Tile} tile - The tile object
 */
Hooks.on("refreshTile", (tile) => {
    console.log("SmoothTileTransition: Refresh tile", tile);
    const transitionType = tile.document.getFlag(MODULE_ID, "transitionType");
    
    if (!transitionType || transitionType === TRANSITION_TYPES.NONE) {
        return; // No animation needed
    }
    
    // Check if tile and mesh are available
    if (!tile || !tile.mesh || tile.destroyed) {
        console.log('SmoothTileTransition: Tile or mesh not available for animation');
        return;
    }
    
    // Check if tile is already animating
    if (animatingTiles.has(tile.id)) {
        console.log(`SmoothTileTransition: Tile ${tile.id} is already animating, skipping`);
        return;
    }
    
    const isVisible = tile.document.hidden === false;
    const wasVisible = tileVisibilityStates.get(tile.id);
    
    // Update the visibility state in memory
    tileVisibilityStates.set(tile.id, isVisible);
    
    // If visibility changed, trigger animation
    if (wasVisible !== undefined && wasVisible !== isVisible) {
        if (isVisible) {
            // Tile became visible - play entrance animation
            console.log(`SmoothTileTransition: Entrance animation ${transitionType} for tile ${tile.id}`);
            applyTileAnimation(tile, transitionType, true);
        } else {
            // Tile became hidden - play exit animation
            console.log(`SmoothTileTransition: Exit animation ${transitionType} for tile ${tile.id}`);
            
            // Temporarily make tile visible for animation by manipulating the mesh
            tile.mesh.visible = true;
            
            applyTileAnimation(tile, transitionType, false, () => {
                // Hide tile after animation completes by manipulating the mesh
                tile.mesh.visible = false;
            });
        }
    }
});

/**
 * Hook to handle animations when tiles are updated
 * @param {TileDocument} tile - The tile document
 * @param {Object} updates - The update data
 */
Hooks.on("updateTile", (tile, updates) => {
    // This hook is no longer needed since we use current values at animation time
});

/**
 * Hook to modify the tile HUD when it's rendered
 * @param {TileHUD} hud - The tile HUD application
 * @param {HTMLElement} html - The HTML element of the HUD
 * @param {Object} data - The HUD data
 */
Hooks.on("renderTileHUD", (hud, html, data) => {
    // Check if this tile is currently animating
    const visibilityButton = html.querySelector('[data-action="visibility"]');

    if (animatingTiles.has(hud.object.id)) {
        // Disable the visibility toggle button
        if (visibilityButton) {
            visibilityButton.disabled = true;
        }
    }else{
        if (visibilityButton) {
            visibilityButton.disabled = false;
        }
    }
});

/**
 * Clean up visibility states when tiles are destroyed
 * @param {Tile} tile - The tile object being destroyed
 */
Hooks.on("destroyTile", (tile) => {
    // Remove from memory when tile is destroyed
    tileVisibilityStates.delete(tile.id);
    animatingTiles.delete(tile.id);
    updateTileHUDVisibility(tile.id, false);
});

/**
 * Update the tile HUD visibility button state
 * @param {string} tileId - The tile ID
 * @param {boolean} isAnimating - Whether the tile is currently animating
 */
function updateTileHUDVisibility(tileId, isAnimating) {
    // Find the tile object
    const btn = document.querySelector(`#tile-hud [data-action="visibility"]`);
    console.log('SmoothTileTransition: Update tile HUD visibility', btn);
    if (!btn) return;
    
    // Check if the tile has a HUD and if it's currently rendered
    if (btn) {
        if (isAnimating) {
            // Disable the button during animation
            btn.disabled = true;
        } else {
            // Re-enable the button after animation
            btn.disabled = false;
        }
    }
}

/**
 * Apply PIXI.js animations to tiles
 * @param {Tile} tile - The tile object
 * @param {string} transitionType - The type of transition to apply
 * @param {boolean} isAppearing - Whether the tile is appearing or disappearing
 * @param {Function} onComplete - Callback function when animation completes (for disappearance)
 */
function applyTileAnimation(tile, transitionType, isAppearing, onComplete = null) {
    // Additional safety checks
    if (!tile) {
        console.log('SmoothTileTransition: Tile object is null');
        if (onComplete) onComplete();
        return;
    }
    
    if (!tile.mesh) {
        console.log('SmoothTileTransition: Tile mesh not available');
        if (onComplete) onComplete();
        return;
    }
    
    if (tile.destroyed) {
        console.log('SmoothTileTransition: Tile is already destroyed');
        if (onComplete) onComplete();
        return;
    }
    
    // Get duration from tile flags, default to 1 second
    const duration = (tile.document.getFlag(MODULE_ID, "transitionDuration") ?? 1.0) * 1000;
    
    // Mark tile as animating
    animatingTiles.add(tile.id);
    
    // Update HUD if it's currently rendered
    updateTileHUDVisibility(tile.id, true);
    
    // Store current scale and opacity values from the tile (these are our "original" values for this animation)
    const originalScale = tile.mesh.scale ? { x: tile.mesh.scale.x, y: tile.mesh.scale.y } : null;
    const originalOpacity = tile.document.alpha ?? 1.0;
    
    // For disappearance animations, capture the current opacity before any modifications
    const currentOpacity = isAppearing ? 0 : tile.document.alpha;
    
    // Reset properties to current values with additional safety checks
    try {
        if (isAppearing) {
            // For appearance, start from 0 opacity
            tile.mesh.alpha = 0;
        }
        // Don't reset opacity for disappearance - keep current value
        if (tile.mesh.scale && originalScale) {
            tile.mesh.scale.set(originalScale.x, originalScale.y);
        }
    } catch (error) {
        console.log('SmoothTileTransition: Error resetting tile properties:', error);
        animatingTiles.delete(tile.id);
        if (onComplete) onComplete();
        return;
    }
    
    switch (transitionType) {
        case TRANSITION_TYPES.FADE_IN_OUT:
            if (isAppearing) {
                // Fade In on appearance
                animateProperty(tile.mesh, 'alpha', 0, originalOpacity, duration, () => {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                });
            } else {
                // Fade Out on disappearance - start from current opacity
                animateProperty(tile.mesh, 'alpha', currentOpacity, 0, duration, () => {
                    // Restore original values after fade out
                    try {
                        tile.mesh.alpha = originalOpacity;
                        if (tile.mesh.scale && originalScale) {
                            tile.mesh.scale.set(originalScale.x, originalScale.y);
                        }
                    } catch (error) {
                        console.log('SmoothTileTransition: Error restoring tile properties after fade out:', error);
                    }
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                    if (onComplete) onComplete();
                });
            }
            break;
            
        case TRANSITION_TYPES.ZOOM_IN_OUT:
            if (isAppearing) {
                // Zoom In + Fade In on appearance (0.9 -> 1.0)
                if (tile.mesh.scale && originalScale) {
                    const startScale = 0.9;
                    tile.mesh.alpha = 0;
                    tile.mesh.scale.set(originalScale.x * startScale, originalScale.y * startScale);
                    animateZoomAndFade(tile.mesh, startScale, 1, 0, originalOpacity, duration, originalScale, () => {
                        animatingTiles.delete(tile.id);
                        updateTileHUDVisibility(tile.id, false);
                    });
                } else {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                }
            } else {
                // Zoom Out + Fade Out on disappearance (1.0 -> 0.9)
                if (tile.mesh.scale && originalScale) {
                    animateZoomAndFade(tile.mesh, 1, 0.9, currentOpacity, 0, duration, originalScale, () => {
                        // Restore original values after zoom out
                        try {
                            tile.mesh.alpha = originalOpacity;
                            tile.mesh.scale.set(originalScale.x, originalScale.y);
                        } catch (error) {
                            console.log('SmoothTileTransition: Error restoring tile properties after zoom out:', error);
                        }
                        animatingTiles.delete(tile.id);
                        updateTileHUDVisibility(tile.id, false);
                        if (onComplete) onComplete();
                    });
                } else {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                    if (onComplete) onComplete();
                }
            }
            break;
    }
}

/**
 * Animate a property over time
 * @param {Object} object - The object to animate
 * @param {string} property - The property to animate
 * @param {number} from - Starting value
 * @param {number} to - Ending value
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} onComplete - Callback function when animation completes
 */
function animateProperty(object, property, from, to, duration, onComplete = null) {
    const startTime = Date.now();
    const startValue = from;
    const endValue = to;
    const change = endValue - startValue;
    
    function animate() {
        // Check if object still exists
        if (!object || object.destroyed) {
            console.log('SmoothTileTransition: Animation stopped - object destroyed');
            if (onComplete) onComplete();
            return;
        }
        
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing easeInOut
        const easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        try {
            object[property] = startValue + change * easedProgress;
        } catch (error) {
            console.log('SmoothTileTransition: Error setting property during animation:', error);
            if (onComplete) onComplete();
            return;
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }
    
    animate();
}

/**
 * Animate both scale and alpha simultaneously
 * @param {Object} object - The object to animate
 * @param {number} scaleFrom - Starting scale value
 * @param {number} scaleTo - Ending scale value
 * @param {number} alphaFrom - Starting alpha value
 * @param {number} alphaTo - Ending alpha value
 * @param {number} duration - Animation duration in milliseconds
 * @param {Object} originalScale - The original scale values
 * @param {Function} onComplete - Callback function when animation completes
 */
function animateZoomAndFade(object, scaleFrom, scaleTo, alphaFrom, alphaTo, duration, originalScale, onComplete = null) {
    const startTime = Date.now();
    const scaleChange = scaleTo - scaleFrom;
    const alphaChange = alphaTo - alphaFrom;
    
    function animate() {
        // Check if object still exists
        if (!object || object.destroyed) {
            console.log('SmoothTileTransition: Animation stopped - object destroyed');
            if (onComplete) onComplete();
            return;
        }
        
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing easeInOut
        const easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const currentScale = scaleFrom + scaleChange * easedProgress;
        const currentAlpha = alphaFrom + alphaChange * easedProgress;
        
        try {
            if (object.scale && originalScale) {
                object.scale.set(originalScale.x * currentScale, originalScale.y * currentScale);
            }
            object.alpha = currentAlpha;
        } catch (error) {
            console.log('SmoothTileTransition: Error setting scale/alpha during animation:', error);
            if (onComplete) onComplete();
            return;
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }
    
    animate();
}

console.log('SmoothTileTransition: Module loaded successfully'); 
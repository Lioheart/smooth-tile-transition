import { MODULE_ID } from "./scripts/constants/module.js";

/**
 * Available transition types for tile animations
 * @type {Object}
 */
const TRANSITION_TYPES = {
    NONE: "none",
    FADE_IN_OUT: "fade_in_out",
    ZOOM_IN_OUT: "zoom_in_out",
    ZOOM_OUT_IN: "zoom_out_in",
    SLIDE_FROM_LEFT: "slide_from_left",
    SLIDE_FROM_RIGHT: "slide_from_right",
    SLIDE_FROM_TOP: "slide_from_top",
    SLIDE_FROM_BOTTOM: "slide_from_bottom"
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
        <legend>${game.i18n.localize(`${MODULE_ID}.ui.animationTransitions`)}</legend>
        <div class="form-group">
            <label for="flags.${MODULE_ID}.transitionType">${game.i18n.localize(`${MODULE_ID}.ui.type`)}</label>
            <div class="form-fields">
                <select name="flags.${MODULE_ID}.transitionType">
                    <option value="${TRANSITION_TYPES.NONE}" ${currentTransition === TRANSITION_TYPES.NONE ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.none`)}</option>
                    <option value="${TRANSITION_TYPES.FADE_IN_OUT}" ${currentTransition === TRANSITION_TYPES.FADE_IN_OUT ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.fadeInOut`)}</option>
                    <option value="${TRANSITION_TYPES.ZOOM_IN_OUT}" ${currentTransition === TRANSITION_TYPES.ZOOM_IN_OUT ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.zoomInOut`)}</option>
                    <option value="${TRANSITION_TYPES.ZOOM_OUT_IN}" ${currentTransition === TRANSITION_TYPES.ZOOM_OUT_IN ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.zoomOutIn`)}</option>
                    <option value="${TRANSITION_TYPES.SLIDE_FROM_LEFT}" ${currentTransition === TRANSITION_TYPES.SLIDE_FROM_LEFT ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.slideFromLeft`)}</option>
                    <option value="${TRANSITION_TYPES.SLIDE_FROM_RIGHT}" ${currentTransition === TRANSITION_TYPES.SLIDE_FROM_RIGHT ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.slideFromRight`)}</option>
                    <option value="${TRANSITION_TYPES.SLIDE_FROM_TOP}" ${currentTransition === TRANSITION_TYPES.SLIDE_FROM_TOP ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.slideFromTop`)}</option>
                    <option value="${TRANSITION_TYPES.SLIDE_FROM_BOTTOM}" ${currentTransition === TRANSITION_TYPES.SLIDE_FROM_BOTTOM ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.slideFromBottom`)}</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label for="flags.${MODULE_ID}.transitionDuration">${game.i18n.localize(`${MODULE_ID}.ui.duration`)}</label>
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
        <div class="form-group">
            <label for="flags.${MODULE_ID}.movementIntensity">${game.i18n.localize(`${MODULE_ID}.ui.movementIntensity`)}</label>
            <div class="form-fields">
                <input type="range" 
                       name="flags.${MODULE_ID}.movementIntensity" 
                       value="${app.document.getFlag(MODULE_ID, "movementIntensity") ?? 10}" 
                       min="0" 
                       max="100" 
                       step="1" 
                       style="flex: 10;">
                <span style="text-align: center;">${app.document.getFlag(MODULE_ID, "movementIntensity") ?? 10}%</span>
            </div>
        </div>
        <div class="form-group">
            <label for="flags.${MODULE_ID}.timingFunction">${game.i18n.localize(`${MODULE_ID}.ui.timingFunction`)}</label>
            <div class="form-fields">
                <select name="flags.${MODULE_ID}.timingFunction">
                    <option value="ease" ${(app.document.getFlag(MODULE_ID, "timingFunction") ?? "ease") === "ease" ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.ease`)}</option>
                    <option value="linear" ${(app.document.getFlag(MODULE_ID, "timingFunction") ?? "ease") === "linear" ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.linear`)}</option>
                    <option value="bounce" ${(app.document.getFlag(MODULE_ID, "timingFunction") ?? "ease") === "bounce" ? 'selected' : ''}>${game.i18n.localize(`${MODULE_ID}.ui.bounce`)}</option>
                </select>
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
        
        // Add event listener for movement intensity
        const intensityInput = html.querySelector(`[name="flags.${MODULE_ID}.movementIntensity"]`);
        const intensityDisplay = intensityInput?.nextElementSibling;
        if (intensityInput && intensityDisplay) {
            intensityInput.addEventListener('input', (e) => {
                intensityDisplay.textContent = `${e.target.value}%`;
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
    
    // Get movement intensity from tile flags, default to 10%
    const movementIntensity = (tile.document.getFlag(MODULE_ID, "movementIntensity") ?? 10) / 100;
    
    // Get timing function from tile flags, default to "ease"
    const timingFunction = tile.document.getFlag(MODULE_ID, "timingFunction") ?? "ease";
    
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
                animateProperty(tile.mesh, 'alpha', 0, originalOpacity, duration, timingFunction, () => {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                });
            } else {
                // Fade Out on disappearance - start from current opacity
                animateProperty(tile.mesh, 'alpha', currentOpacity, 0, duration, timingFunction, () => {
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
                // Zoom In + Fade In on appearance (1-intensity -> 1.0)
                if (tile.mesh.scale && originalScale) {
                    const startScale = 1 - movementIntensity;
                    tile.mesh.alpha = 0;
                    tile.mesh.scale.set(originalScale.x * startScale, originalScale.y * startScale);
                    animateZoomAndFade(tile.mesh, startScale, 1, 0, originalOpacity, duration, originalScale, timingFunction, () => {
                        animatingTiles.delete(tile.id);
                        updateTileHUDVisibility(tile.id, false);
                    });
                } else {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                }
            } else {
                // Zoom Out + Fade Out on disappearance (1.0 -> 1-intensity)
                if (tile.mesh.scale && originalScale) {
                    animateZoomAndFade(tile.mesh, 1, 1 - movementIntensity, currentOpacity, 0, duration, originalScale, timingFunction, () => {
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
            
        case TRANSITION_TYPES.ZOOM_OUT_IN:
            if (isAppearing) {
                // Zoom Out + Fade In on appearance (1+intensity -> 1.0)
                if (tile.mesh.scale && originalScale) {
                    const startScale = 1 + movementIntensity;
                    tile.mesh.alpha = 0;
                    tile.mesh.scale.set(originalScale.x * startScale, originalScale.y * startScale);
                    animateZoomAndFade(tile.mesh, startScale, 1, 0, originalOpacity, duration, originalScale, timingFunction, () => {
                        animatingTiles.delete(tile.id);
                        updateTileHUDVisibility(tile.id, false);
                    });
                } else {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                }
            } else {
                // Zoom In + Fade Out on disappearance (1.0 -> 1+intensity)
                if (tile.mesh.scale && originalScale) {
                    animateZoomAndFade(tile.mesh, 1, 1 + movementIntensity, currentOpacity, 0, duration, originalScale, timingFunction, () => {
                        // Restore original values after zoom in
                        try {
                            tile.mesh.alpha = originalOpacity;
                            tile.mesh.scale.set(originalScale.x, originalScale.y);
                        } catch (error) {
                            console.log('SmoothTileTransition: Error restoring tile properties after zoom in:', error);
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
            
        case TRANSITION_TYPES.SLIDE_FROM_LEFT:
            if (isAppearing) {
                // Slide in from left
                const originalX = tile.mesh.x;
                tile.mesh.alpha = 0;
                tile.mesh.x = originalX - (tile.mesh.width * movementIntensity);
                animateSlideAndFade(tile.mesh, 'x', tile.mesh.x, originalX, 0, originalOpacity, duration, timingFunction, () => {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                });
            } else {
                // Slide out to left
                const originalX = tile.mesh.x;
                const targetX = originalX - (tile.mesh.width * movementIntensity);
                animateSlideAndFade(tile.mesh, 'x', originalX, targetX, currentOpacity, 0, duration, timingFunction, () => {
                    // Restore original values
                    try {
                        tile.mesh.alpha = originalOpacity;
                        tile.mesh.x = originalX;
                    } catch (error) {
                        console.log('SmoothTileTransition: Error restoring tile properties after slide out:', error);
                    }
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                    if (onComplete) onComplete();
                });
            }
            break;
            
        case TRANSITION_TYPES.SLIDE_FROM_RIGHT:
            if (isAppearing) {
                // Slide in from right
                const originalX = tile.mesh.x;
                tile.mesh.alpha = 0;
                tile.mesh.x = originalX + (tile.mesh.width * movementIntensity);
                animateSlideAndFade(tile.mesh, 'x', tile.mesh.x, originalX, 0, originalOpacity, duration, timingFunction, () => {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                });
            } else {
                // Slide out to right
                const originalX = tile.mesh.x;
                const targetX = originalX + (tile.mesh.width * movementIntensity);
                animateSlideAndFade(tile.mesh, 'x', originalX, targetX, currentOpacity, 0, duration, timingFunction, () => {
                    // Restore original values
                    try {
                        tile.mesh.alpha = originalOpacity;
                        tile.mesh.x = originalX;
                    } catch (error) {
                        console.log('SmoothTileTransition: Error restoring tile properties after slide out:', error);
                    }
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                    if (onComplete) onComplete();
                });
            }
            break;
            
        case TRANSITION_TYPES.SLIDE_FROM_TOP:
            if (isAppearing) {
                // Slide in from top
                const originalY = tile.mesh.y;
                tile.mesh.alpha = 0;
                tile.mesh.y = originalY - (tile.mesh.height * movementIntensity);
                animateSlideAndFade(tile.mesh, 'y', tile.mesh.y, originalY, 0, originalOpacity, duration, timingFunction, () => {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                });
            } else {
                // Slide out to top
                const originalY = tile.mesh.y;
                const targetY = originalY - (tile.mesh.height * movementIntensity);
                animateSlideAndFade(tile.mesh, 'y', originalY, targetY, currentOpacity, 0, duration, timingFunction, () => {
                    // Restore original values
                    try {
                        tile.mesh.alpha = originalOpacity;
                        tile.mesh.y = originalY;
                    } catch (error) {
                        console.log('SmoothTileTransition: Error restoring tile properties after slide out:', error);
                    }
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                    if (onComplete) onComplete();
                });
            }
            break;
            
        case TRANSITION_TYPES.SLIDE_FROM_BOTTOM:
            if (isAppearing) {
                // Slide in from bottom
                const originalY = tile.mesh.y;
                tile.mesh.alpha = 0;
                tile.mesh.y = originalY + (tile.mesh.height * movementIntensity);
                animateSlideAndFade(tile.mesh, 'y', tile.mesh.y, originalY, 0, originalOpacity, duration, timingFunction, () => {
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                });
            } else {
                // Slide out to bottom
                const originalY = tile.mesh.y;
                const targetY = originalY + (tile.mesh.height * movementIntensity);
                animateSlideAndFade(tile.mesh, 'y', originalY, targetY, currentOpacity, 0, duration, timingFunction, () => {
                    // Restore original values
                    try {
                        tile.mesh.alpha = originalOpacity;
                        tile.mesh.y = originalY;
                    } catch (error) {
                        console.log('SmoothTileTransition: Error restoring tile properties after slide out:', error);
                    }
                    animatingTiles.delete(tile.id);
                    updateTileHUDVisibility(tile.id, false);
                    if (onComplete) onComplete();
                });
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
 * @param {string} timingFunction - The timing function to use
 * @param {Function} onComplete - Callback function when animation completes
 */
function animateProperty(object, property, from, to, duration, timingFunction, onComplete = null) {
    const startTime = Date.now();
    const startValue = from;
    const endValue = to;
    const change = endValue - startValue;
    
    // Easing functions
    const easingFunctions = {
        linear: (t) => t,
        ease: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        bounce: (t) => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    };
    
    // For opacity (fade), always use ease to avoid weird effects
    // For other properties (scale, etc.), use the specified timing function
    const effectiveTimingFunction = (property === 'alpha') ? 'ease' : timingFunction;
    const easing = easingFunctions[effectiveTimingFunction] || easingFunctions.ease;
    
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
        
        // Apply timing function
        const easedProgress = easing(progress);
        
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
 * @param {string} timingFunction - The timing function to use
 * @param {Function} onComplete - Callback function when animation completes
 */
function animateZoomAndFade(object, scaleFrom, scaleTo, alphaFrom, alphaTo, duration, originalScale, timingFunction, onComplete = null) {
    const startTime = Date.now();
    const scaleChange = scaleTo - scaleFrom;
    const alphaChange = alphaTo - alphaFrom;
    
    // Easing functions
    const easingFunctions = {
        linear: (t) => t,
        ease: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        bounce: (t) => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    };
    
    const easing = easingFunctions[timingFunction] || easingFunctions.ease;
    
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
        
        // Apply timing function
        const easedProgress = easing(progress);
        
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

/**
 * Animate slide and fade simultaneously
 * @param {Object} object - The object to animate
 * @param {string} property - The property to animate (e.g., 'x', 'y')
 * @param {number} slideFrom - Starting slide value
 * @param {number} slideTo - Ending slide value
 * @param {number} alphaFrom - Starting alpha value
 * @param {number} alphaTo - Ending alpha value
 * @param {number} duration - Animation duration in milliseconds
 * @param {string} timingFunction - The timing function to use
 * @param {Function} onComplete - Callback function when animation completes
 */
function animateSlideAndFade(object, property, slideFrom, slideTo, alphaFrom, alphaTo, duration, timingFunction, onComplete = null) {
    const startTime = Date.now();
    const slideChange = slideTo - slideFrom;
    const alphaChange = alphaTo - alphaFrom;
    
    // Easing functions
    const easingFunctions = {
        linear: (t) => t,
        ease: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
        bounce: (t) => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    };
    
    // Use specified timing function for slide, but always use ease for alpha
    const slideEasing = easingFunctions[timingFunction] || easingFunctions.ease;
    const alphaEasing = easingFunctions.ease;
    
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
        
        // Apply different timing functions for slide and alpha
        const slideEasedProgress = slideEasing(progress);
        const alphaEasedProgress = alphaEasing(progress);
        
        const currentSlideValue = slideFrom + slideChange * slideEasedProgress;
        const currentAlpha = alphaFrom + alphaChange * alphaEasedProgress;
        
        try {
            object[property] = currentSlideValue;
            object.alpha = currentAlpha;
        } catch (error) {
            console.log('SmoothTileTransition: Error setting slide/alpha during animation:', error);
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
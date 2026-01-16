/**
 * HUD Opacity Controller - CSS Variable-Based Background Opacity System
 *
 * Controls ONLY HUD background alpha and blur - never affects text/icon opacity.
 * Uses CSS custom properties for clean separation of concerns.
 *
 * Slider value (0-100) maps to:
 * - Background alpha: 0.10 → 0.85
 * - Backdrop blur: 4px → 18px
 *
 * @module hud-opacity-controller
 * @version 1.0.0
 */

/**
 * Apply HUD opacity settings using CSS variables
 * Affects ONLY background surfaces, not content
 *
 * @param {number} value0to100 - Slider value (0-100)
 */
export function applyHudOpacity(value0to100) {
  const v = Math.max(0, Math.min(100, Number(value0to100) || 50));

  // Linear mapping for alpha (0.10 → 0.85)
  const alpha = 0.10 + (v / 100) * 0.75;

  // Linear mapping for blur (4px → 18px)
  const blur = 4 + (v / 100) * 14;

  // Apply to document root
  const root = document.documentElement;
  root.style.setProperty('--vibeai-hud-bg-alpha', alpha.toFixed(3));
  root.style.setProperty('--vibeai-hud-blur', `${blur.toFixed(1)}px`);

  console.log(`[HUD Opacity] Applied: alpha=${alpha.toFixed(3)}, blur=${blur.toFixed(1)}px (slider=${v})`);
}

/**
 * Initialize HUD opacity system
 * - Loads saved preference
 * - Injects CSS rules
 * - Sets up slider binding
 *
 * @param {HTMLElement} [sliderElement] - Optional slider element to bind
 * @returns {Promise<number>} - Current opacity value (0-100)
 */
export async function initHudOpacity(sliderElement = null) {
  // Inject CSS rules for background opacity
  injectOpacityCSS();

  // Load saved preference
  let savedValue = 50; // Default to 50%
  try {
    const stored = await chrome.storage.local.get('vibeai_hud_opacity');
    if (typeof stored.vibeai_hud_opacity === 'number') {
      savedValue = stored.vibeai_hud_opacity;
    }
  } catch (err) {
    console.warn('[HUD Opacity] Could not load saved preference:', err);
  }

  // Apply saved value
  applyHudOpacity(savedValue);

  // Bind slider if provided
  if (sliderElement) {
    sliderElement.value = savedValue;
    sliderElement.addEventListener('input', (e) => {
      const value = Number(e.target.value);
      applyHudOpacity(value);

      // Save preference
      try {
        chrome.storage.local.set({ vibeai_hud_opacity: value });
      } catch (err) {
        console.warn('[HUD Opacity] Could not save preference:', err);
      }
    });

    console.log('[HUD Opacity] Slider bound successfully');
  }

  return savedValue;
}

/**
 * Inject CSS rules for background opacity system
 * Uses CSS variables to control background alpha and blur ONLY
 */
function injectOpacityCSS() {
  // Check if already injected
  if (document.getElementById('vibeai-opacity-css')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'vibeai-opacity-css';
  style.textContent = `
    /* HUD Opacity CSS Variables */
    :root {
      --vibeai-hud-bg-alpha: 0.55;
      --vibeai-hud-blur: 12px;
    }

    /* Apply background opacity and blur to HUD surfaces ONLY */
    #vibeai-unified-hud,
    .vibeai-hud-surface,
    #vibeai-inspector,
    #vibeai-toolbar,
    .vibeai-inspector-header,
    .vibeai-toolbar-header {
      background: rgba(12, 18, 28, var(--vibeai-hud-bg-alpha)) !important;
      backdrop-filter: blur(var(--vibeai-hud-blur)) !important;
      -webkit-backdrop-filter: blur(var(--vibeai-hud-blur)) !important;
    }

    /* Light theme background override */
    .theme-light #vibeai-unified-hud,
    .theme-light .vibeai-hud-surface,
    .theme-light #vibeai-inspector,
    .theme-light #vibeai-toolbar {
      background: rgba(255, 255, 255, var(--vibeai-hud-bg-alpha)) !important;
    }

    /* CRITICAL: Ensure text and icons maintain full opacity */
    #vibeai-unified-hud *,
    #vibeai-inspector *,
    #vibeai-toolbar *,
    .vibeai-thread-feed *,
    .vibeai-controls *,
    .thread-card *,
    .vibeai-brand,
    .vibeai-subtitle,
    button,
    .toggle-btn,
    .vibeai-tone-legend {
      opacity: 1 !important;
    }

    /* Thread cards: background uses variable, content stays opaque */
    .thread-card {
      background: rgba(255, 255, 255, calc(var(--vibeai-hud-bg-alpha) * 0.1)) !important;
      backdrop-filter: none !important;
    }

    .theme-dark .thread-card {
      background: rgba(255, 255, 255, calc(var(--vibeai-hud-bg-alpha) * 0.05)) !important;
    }

    /* Scrollable content areas must remain fully opaque for readability */
    .vibeai-thread-feed,
    .vibeai-toolbar-list,
    #vibeai-bookmark-list,
    .thread-card .title,
    .thread-card .preview,
    .thread-card .meta {
      opacity: 1 !important;
      color: inherit !important;
    }
  `;

  document.head.appendChild(style);
  console.log('[HUD Opacity] ✅ CSS rules injected');
}

/**
 * Create opacity slider HTML element
 * Returns ready-to-insert slider with labels
 *
 * @returns {HTMLElement} - Slider container element
 */
export function createOpacitySlider() {
  const container = document.createElement('div');
  container.className = 'vibeai-opacity-control';
  container.innerHTML = `
    <div class="vibeai-opacity-header">
      <span class="vibeai-opacity-label">HUD Transparency</span>
      <span class="vibeai-opacity-value" id="vibeai-opacity-value">50%</span>
    </div>
    <input
      type="range"
      id="vibeai-opacity-slider"
      class="vibeai-opacity-slider"
      min="0"
      max="100"
      step="1"
      value="50"
      aria-label="HUD background transparency"
    />
    <div class="vibeai-opacity-legend">
      <span>Transparent</span>
      <span>Opaque</span>
    </div>
  `;

  // Add inline styles for slider
  const style = document.createElement('style');
  style.textContent = `
    .vibeai-opacity-control {
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.03);
    }

    .vibeai-opacity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 500;
    }

    .vibeai-opacity-label {
      color: rgba(255, 255, 255, 0.9);
    }

    .vibeai-opacity-value {
      color: rgba(0, 198, 255, 0.9);
      font-weight: 600;
    }

    .vibeai-opacity-slider {
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.1);
      outline: none;
      appearance: none;
      -webkit-appearance: none;
    }

    .vibeai-opacity-slider::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00c6ff;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(0, 198, 255, 0.5);
    }

    .vibeai-opacity-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #00c6ff;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 8px rgba(0, 198, 255, 0.5);
    }

    .vibeai-opacity-legend {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
    }

    .theme-light .vibeai-opacity-label,
    .theme-light .vibeai-opacity-legend {
      color: rgba(0, 0, 0, 0.7);
    }
  `;
  container.appendChild(style);

  // Bind value display update
  const slider = container.querySelector('#vibeai-opacity-slider');
  const valueDisplay = container.querySelector('#vibeai-opacity-value');

  slider.addEventListener('input', (e) => {
    valueDisplay.textContent = `${e.target.value}%`;
  });

  return container;
}

// Expose globally for easy access
if (typeof window !== 'undefined') {
  window.VIBEAI_HUD_OPACITY = {
    applyHudOpacity,
    initHudOpacity,
    createOpacitySlider
  };
}

export default {
  applyHudOpacity,
  initHudOpacity,
  createOpacitySlider
};

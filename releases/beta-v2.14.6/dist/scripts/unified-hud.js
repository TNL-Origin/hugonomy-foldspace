/* global chrome */
// 🧱 VibeAI Unified HUD Container (v2.11.10-UNIHUD-ALPHA)
// Runs in main page context (not iframe) to avoid pointer-events conflicts

// Phase VIII.0.2 HOTFIX: Inline utility functions (ES6 imports not supported in content scripts)
// Inlined from hri-utils.js & hud-opacity-controller.js
function normalizeResonance(payload = {}) {
  let rawValue = null;
  if (typeof payload.hri === 'number') rawValue = payload.hri;
  else if (typeof payload.resonance_index === 'number') rawValue = payload.resonance_index;
  else if (typeof payload.hugo_score === 'number') rawValue = payload.hugo_score / 100;
  else if (typeof payload.hugoScore === 'number') rawValue = payload.hugoScore / 100;
  else if (typeof payload.score === 'number') rawValue = payload.score / 100;
  const hri = (typeof rawValue === 'number' && isFinite(rawValue)) ? Math.max(0, Math.min(1, rawValue)) : null;
  return { ...payload, hri, hugoScore: hri !== null ? Math.round(hri * 100) : null };
}

function hriToLegacyScore(hri) {
  if (typeof hri !== 'number' || !isFinite(hri)) return 0;
  return Math.round(Math.max(0, Math.min(1, hri)) * 100);
}

// Pre-Phase A: Fixed HUD opacity (design authority - no user control)
// Optimal values determined: alpha 0.65, blur 14px
function applyFixedHudOpacity() {
  const style = document.createElement('style');
  style.id = 'vibeai-hud-opacity-css';
  style.textContent = `
    :root {
      --vibeai-hud-bg-alpha: 0.65;
      --vibeai-hud-blur: 14px;
    }
    #vibeai-unified-hud,
    .vibeai-hud-surface {
      background: rgba(12, 18, 28, var(--vibeai-hud-bg-alpha)) !important;
      backdrop-filter: blur(var(--vibeai-hud-blur)) !important;
      -webkit-backdrop-filter: blur(var(--vibeai-hud-blur)) !important;
    }
    #vibeai-unified-hud * {
      opacity: 1 !important;
    }
  `;
  if (!document.getElementById('vibeai-hud-opacity-css')) {
    document.head.appendChild(style);
  }
}

// Debug mode flag - SET TO FALSE FOR PRODUCTION/DEMOS
// SECURITY NOTE: Debug APIs expose internal state and allow page scripts to manipulate
// the extension. Always set to false before public release.
// v2.14.3: Use window property DIRECTLY to avoid const collision with content-parser.js
if (!window.VIBEAI_HUD_DEBUG) window.VIBEAI_HUD_DEBUG = false;

// Lightweight debug helper
function dbg(...args) {
  if (window.VIBEAI_HUD_DEBUG) console.debug('[VibeAI DEBUG]', ...args);
}

// Module-scoped bridge token (less visible than attaching to `window`)
let __VIBEAI_BRIDGE_TOKEN_LOCAL = null;

// v2.14.1: Listen for persistent bridge token from parser (dispatched once per page session)
// This avoids leaving the token on `window` while still allowing the parser
// to provide the token when it runs in an isolated world.
window.addEventListener('vibeai:setBridgeToken', (ev) => {
  try {
    const t = ev?.detail?.token;
    if (typeof t === 'string' && t.length >= 8) {
      __VIBEAI_BRIDGE_TOKEN_LOCAL = String(t);
      console.log('[VibeAI HRI] 🔐 Bridge token set');
      // best-effort: remove any global window token if it exists
      try { if (window.__VIBEAI_BRIDGE_TOKEN__) delete window.__VIBEAI_BRIDGE_TOKEN__; } catch (e) {}
    }
  } catch (err) { /* ignore */ }
});

// Cleanup registry: allow registering cleanup functions that run when HUD is destroyed/closed.
const __VIBEAI_CLEANUP_FNS = [];
function registerCleanup(fn) {
  if (typeof fn === 'function') __VIBEAI_CLEANUP_FNS.push(fn);
}
function runCleanup() {
  dbg('running cleanup fns', __VIBEAI_CLEANUP_FNS.length);
  while (__VIBEAI_CLEANUP_FNS.length) {
    try {
      const fn = __VIBEAI_CLEANUP_FNS.pop();
      fn();
    } catch (err) {
      console.warn('[VibeAI HUD] cleanup error', err);
    }
  }
  try {
    // Clear inject-once guard flags to allow future mounts if needed
    window.__VIBEAI__ = window.__VIBEAI__ || {};
    window.__VIBEAI__.hudMounted = false;
    window.__VIBEAI__.hudMounting = false;
  } catch (e) {}
}

// Phase VIII.0: Hugo Orb feature flag - SET TO FALSE to rollback to FoldSpace canvas
// STRATEGIC NOTE: Hugo Orb is the hero visualization addressing Beta Tester Zero feedback
// "What am I looking at?" - provides immediate emotional clarity and visual anchor
const ENABLE_HUGO_ORB = true;

/**
 * Escapes HTML special characters to prevent XSS injection
 * @param {string} str - Raw string that may contain HTML
 * @returns {string} - HTML-safe escaped string
 */
// SECURITY NOTE: All user-sourced content MUST be escaped before insertion into innerHTML
// to prevent XSS attacks. Use escapeHtml() for any data coming from parsed pages or threads.
// DO NOT insert raw t.title, t.content, t.source, IDs, or other parsed data directly.
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

console.log('[VibeAI UniHUD] 🧱 Initializing Unified HUD Container...');

/**
 * Phase VIII.0.2: Draggable HUD System (Steven Beta Feedback - Priority 2)
 * Makes HUD draggable via header, with viewport constraints and position persistence
 * @param {HTMLElement} hudElement - The HUD container element
 * @param {HTMLElement} headerElement - The header element that acts as drag handle
 */
function initDraggableHUD(hudElement, headerElement) {
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let hudStartLeft = 0;
  let hudStartTop = 0;

  // Named handlers so we can remove them during cleanup
  function onHeaderMouseDown(e) {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const rect = hudElement.getBoundingClientRect();
    hudStartLeft = rect.left;
    hudStartTop = rect.top;

    hudElement.style.right = 'auto';
    hudElement.style.transform = 'none';
    hudElement.style.left = hudStartLeft + 'px';
    hudElement.style.top = hudStartTop + 'px';

    headerElement.style.cursor = 'grabbing';
    hudElement.style.transition = 'none';

    e.preventDefault();
  }

  function onDocumentMouseMove(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    let newLeft = hudStartLeft + deltaX;
    let newTop = hudStartTop + deltaY;

    const hudRect = hudElement.getBoundingClientRect();
    const maxLeft = window.innerWidth - hudRect.width;
    const maxTop = window.innerHeight - hudRect.height;

    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    hudElement.style.left = newLeft + 'px';
    hudElement.style.top = newTop + 'px';

    e.preventDefault();
  }

  function onDocumentMouseUp() {
    if (!isDragging) return;

    isDragging = false;
    headerElement.style.cursor = 'move';
    hudElement.style.transition = '';

    const currentLeft = hudElement.style.left;
    const currentTop = hudElement.style.top;

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          vibeai_hud_position_x: currentLeft,
          vibeai_hud_position_y: currentTop
        }, () => {
          console.log(`[VibeAI HUD] Position saved: ${currentLeft}, ${currentTop}`);
        });
      }
    } catch (e) {
      console.warn('[VibeAI HUD] Failed to save position:', e);
    }
  }

  headerElement.addEventListener('mousedown', onHeaderMouseDown);
  document.addEventListener('mousemove', onDocumentMouseMove);
  document.addEventListener('mouseup', onDocumentMouseUp);

  // Register cleanup to remove listeners when HUD is torn down
  registerCleanup(() => {
    try {
      headerElement.removeEventListener('mousedown', onHeaderMouseDown);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      document.removeEventListener('mouseup', onDocumentMouseUp);
      dbg('draggable HUD listeners removed');
    } catch (e) {
      console.warn('[VibeAI HUD] failed removing draggable listeners', e);
    }
  });
}

/**
 * Phase VIII.0.2: Resizable HUD System (Steven Beta Feedback - Priority 3)
 * Adds resize handles to HUD with constraints and persistence
 * @param {HTMLElement} hudElement - The HUD container element
 */
function initResizableHUD(hudElement) {
  // Size constraints per Council specs
  const MIN_WIDTH = 300;
  const MAX_WIDTH = 600;
  const MIN_HEIGHT = 400;
  const MAX_HEIGHT = 900;

  // Create resize handles
  const handles = {
    right: createResizeHandle('right'),
    bottom: createResizeHandle('bottom'),
    corner: createResizeHandle('corner')
  };

  // Append handles to HUD
  Object.values(handles).forEach(handle => hudElement.appendChild(handle));

  function createResizeHandle(type) {
    const handle = document.createElement('div');
    handle.className = `vibeai-resize-handle vibeai-resize-${type}`;

    const baseStyle = `
      position: absolute;
      z-index: 10;
      transition: background-color 0.2s ease;
    `;

    if (type === 'right') {
      handle.style.cssText = baseStyle + `
        top: 0;
        right: 0;
        width: 6px;
        height: 100%;
        cursor: ew-resize;
        background: transparent;
      `;
      handle.addEventListener('mouseenter', () => {
        handle.style.background = 'rgba(0, 212, 255, 0.3)';
      });
      handle.addEventListener('mouseleave', () => {
        handle.style.background = 'transparent';
      });
    } else if (type === 'bottom') {
      handle.style.cssText = baseStyle + `
        left: 0;
        bottom: 0;
        width: 100%;
        height: 6px;
        cursor: ns-resize;
        background: transparent;
      `;
      handle.addEventListener('mouseenter', () => {
        handle.style.background = 'rgba(0, 212, 255, 0.3)';
      });
      handle.addEventListener('mouseleave', () => {
        handle.style.background = 'transparent';
      });
    } else if (type === 'corner') {
      handle.style.cssText = baseStyle + `
        right: 0;
        bottom: 0;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        background: rgba(0, 212, 255, 0.15);
        border-radius: 0 0 12px 0;
      `;
      handle.addEventListener('mouseenter', () => {
        handle.style.background = 'rgba(0, 212, 255, 0.4)';
      });
      handle.addEventListener('mouseleave', () => {
        handle.style.background = 'rgba(0, 212, 255, 0.15)';
      });
    }

    return handle;
  }

  // Resize state
  let isResizing = false;
  let resizeType = null;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let startWidth = 0;
  let startHeight = 0;

  // Mouse down on resize handle
  handles.right.addEventListener('mousedown', startResize('right'));
  handles.bottom.addEventListener('mousedown', startResize('bottom'));
  handles.corner.addEventListener('mousedown', startResize('corner'));

  function startResize(type) {
    return (e) => {
      isResizing = true;
      resizeType = type;
      resizeStartX = e.clientX;
      resizeStartY = e.clientY;

      const rect = hudElement.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;

      hudElement.style.transition = 'none';
      e.preventDefault();
      e.stopPropagation();
    };
  }

  // Mouse move - update size
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStartX;
    const deltaY = e.clientY - resizeStartY;

    let newWidth = startWidth;
    let newHeight = startHeight;

    if (resizeType === 'right' || resizeType === 'corner') {
      newWidth = startWidth + deltaX;
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
    }

    if (resizeType === 'bottom' || resizeType === 'corner') {
      newHeight = startHeight + deltaY;
      newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
    }

    hudElement.style.width = newWidth + 'px';
    if (resizeType === 'bottom' || resizeType === 'corner') {
      hudElement.style.height = newHeight + 'px';
      hudElement.style.maxHeight = newHeight + 'px';
    }

    e.preventDefault();
  });

  // Mouse up - end resize and persist size
  document.addEventListener('mouseup', () => {
    if (!isResizing) return;

    isResizing = false;
    resizeType = null;
    hudElement.style.transition = '';

    // Persist size to storage
    const currentWidth = hudElement.style.width;
    const currentHeight = hudElement.style.height;

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          vibeai_hud_width: currentWidth,
          vibeai_hud_height: currentHeight
        }, () => {
          console.log(`[VibeAI HUD] Size saved: ${currentWidth} × ${currentHeight}`);
        });
      }
    } catch (e) {
      console.warn('[VibeAI HUD] Failed to save size:', e);
    }
  });
}

// 🌗 Theme System - Static Dark Mode (Theme toggle reserved for Tier 2 onboarding)
// v2.14.3: Default to dark for optimal contrast on all pages
let currentTheme = 'dark';
let manualOverride = false;

// Detect system/browser theme preference
async function detectTheme() {
  // v2.14.3: Force dark theme for Steven demo / Tier 1 users
  // Theme customization will be exposed in Tier 2/3 onboarding
  return 'dark';

  // TIER 2 CODE (currently disabled):
  // const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  // try {
  //   const stored = await chrome.storage.local.get('vibeaiTheme');
  //   if (stored.vibeaiTheme) {
  //     manualOverride = true;
  //     return stored.vibeaiTheme;
  //   }
  // } catch {
  //   console.log('[VibeAI Theme] Storage check skipped');
  // }
  // return systemDark.matches ? 'dark' : 'light';
}

// Apply theme to document
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add(`theme-${theme}`);

  // Add switching animation class briefly
  document.documentElement.classList.add('theme-switching');
  setTimeout(() => {
    document.documentElement.classList.remove('theme-switching');
  }, 600);

  console.log(`[VibeAI HUD] 🌗 Theme set to ${theme.toUpperCase()}`);
}

// Toggle theme (manual override)
function toggleTheme() {
  manualOverride = true;
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);

  // Persist preference
  try {
    chrome.storage.local.set({ vibeaiTheme: newTheme });
  } catch (e) {
    console.log('[VibeAI Theme] Could not save preference:', e);
  }
}

// Watch for system theme changes (only if no manual override)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!manualOverride) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});

// 🎨 Phase Δ.9.1 - Empathic Hover Lexicon System
// Lexicon selector (youth / pro / clinical / mythic)
let ACTIVE_LEXICON = 'youth'; // Default to youth-friendly language
let ACTIVE_TONE_MAP = null;

// Load tone map dynamically from extension package
async function loadToneMap(lexicon = ACTIVE_LEXICON) {
  try {
    const url = chrome.runtime.getURL(`src/data/toneMap_${lexicon}.json`);
    const res = await fetch(url);
    ACTIVE_TONE_MAP = await res.json();
    console.log(`[VibeAI Lexicon] ✅ Loaded tone map: ${lexicon}`, ACTIVE_TONE_MAP);
    return true;
  } catch (err) {
    console.error(`[VibeAI Lexicon] ❌ Failed to load tone map: ${lexicon}`, err);
    ACTIVE_TONE_MAP = null;
    return false;
  }
}

// Switch lexicon (with validation and reload)
async function switchLexicon(newLexicon) {
  const validLexicons = ['youth', 'pro', 'clinical', 'mythic'];
  if (!validLexicons.includes(newLexicon)) {
    console.warn(`[VibeAI Lexicon] ⚠️ Invalid lexicon: ${newLexicon}. Valid options: ${validLexicons.join(', ')}`);
    return false;
  }

  console.log(`[VibeAI Lexicon] 🔄 Switching to ${newLexicon} lexicon...`);
  ACTIVE_LEXICON = newLexicon;
  const loaded = await loadToneMap(newLexicon);

  if (loaded) {
    // Save preference
    try {
      await chrome.storage.local.set({ vibeaiLexicon: newLexicon });
    } catch (e) {
      console.log('[VibeAI Lexicon] Could not save preference:', e);
    }

    // Phase Δ9.2: Force tooltip refresh on active canvas instances
    document.querySelectorAll('.vibeai-tooltip').forEach(tip => {
      tip.dataset.lexicon = newLexicon;
    });

    // Trigger tooltip update on canvas if hovering
    const canvasEvent = new CustomEvent('vibeai:lexiconChanged', { detail: { lexicon: newLexicon } });
    document.dispatchEvent(canvasEvent);

    console.log(`[VibeAI Lexicon] ✅ Switched to ${newLexicon} lexicon`);
    return true;
  }
  return false;
}

// Load saved lexicon preference
async function loadLexiconPreference() {
  try {
    const stored = await chrome.storage.local.get('vibeaiLexicon');
    if (stored.vibeaiLexicon) {
      ACTIVE_LEXICON = stored.vibeaiLexicon;
      console.log(`[VibeAI Lexicon] 📖 Restored preference: ${ACTIVE_LEXICON}`);
    }
  } catch {
    console.log('[VibeAI Lexicon] Using default lexicon (youth)');
  }
}

// Expose lexicon switcher globally for console access and debugging
// SECURITY: Only expose in debug mode to prevent page scripts from manipulating extension
if (window.VIBEAI_HUD_DEBUG) {
  window.__vibeai_switchLexicon = switchLexicon;
  console.log('[VibeAI] Debug API enabled: window.__vibeai_switchLexicon');
}

// 🎨 Phase Δ.8 - FoldSpace Canvas Mood Field
// Feature Flags
const FEATURE_FLAGS = {
  ENABLE_CANVAS_MOOD: true  // Set to false for legacy static tiles fallback
};

// Canvas Configuration
const CANVAS_CONFIG = {
  width: 380,
  height: 120,
  emojis: [
    { symbol: '🌊', tone: 'calm', x: 50, baseY: 60 },
    { symbol: '⚡', tone: 'urgent', x: 130, baseY: 60 },
    { symbol: '🔮', tone: 'reflective', x: 210, baseY: 60 },
    { symbol: '⚙️', tone: 'dissonant', x: 290, baseY: 60 },
    { symbol: '✨', tone: 'resonant', x: 370, baseY: 60 }
  ],
  animation: {
    fps: 20,
    bobAmplitude: 8,
    bobSpeed: 0.002,
    glowPulseSpeed: 0.003
  },
  particles: {
    maxCount: 10,
    speed: 0.3,
    fadeRate: 0.98,
    size: 2
  },
  colors: {
    dark: {
      glow: 'rgba(0, 198, 255, 0.6)',
      particle: 'rgba(0, 198, 255, 0.4)',
      inactive: 'rgba(255, 255, 255, 0.3)'
    },
    light: {
      glow: 'rgba(0, 120, 180, 0.6)',
      particle: 'rgba(0, 120, 180, 0.4)',
      inactive: 'rgba(100, 100, 100, 0.3)'
    }
  }
};

// Platform detection
const PLATFORM = (() => {
  const hostname = window.location.hostname || '';
  if (hostname.includes('claude.ai')) return 'claude';
  if (hostname.includes('chatgpt') || hostname.includes('openai')) return 'chatgpt';
  if (hostname.includes('gemini.google')) return 'gemini';
  if (hostname.includes('copilot')) return 'copilot';
  return 'unknown';
})();

// Claude thread selectors (centralized for easy updates)
const CLAUDE_SELECTORS = [
  '[data-test-render-count]',
  '.font-claude-message',
  'div[class*="font-user-message"]',
  'div[class*="font-claude"]',
  '[class*="MessageContent"]'
];

// 🎨 FoldSpaceCanvas Class - Phase Δ.8
class FoldSpaceCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.activeTone = 'calm';
    this.intensity = 0.6; // Phase VIII.0: HRI-driven intensity (0-1)
    this.particles = [];
    this.animationId = null;
    this.startTime = Date.now();
    this.hoveredEmoji = null;
    this.isRunning = false;

    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);

    // Set canvas size
    this.canvas.width = CANVAS_CONFIG.width;
    this.canvas.height = CANVAS_CONFIG.height;

    // Initialize particle pool
    for (let i = 0; i < CANVAS_CONFIG.particles.maxCount; i++) {
      this.particles.push(this.createParticle());
    }

    // Phase Δ.9.1: Tooltip element for empathic hover lexicon
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'vibeai-tooltip';
    Object.assign(this.tooltip.style, {
      position: 'fixed',
      padding: '8px 12px',
      borderRadius: '10px',
      fontSize: '14px',
      lineHeight: '1.5',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '500',
      opacity: '0',
      transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)', // Phase Δ.9.3: Faster transitions (was 0.25s)
      pointerEvents: 'none',
      zIndex: '2147483648', // Phase Δ9.2.3: Above HUD (2147483647 + 1)
      backdropFilter: 'blur(8px) saturate(150%)',
      WebkitBackdropFilter: 'blur(8px) saturate(150%)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      maxWidth: '280px',
      textAlign: 'left'
    });
    document.body.appendChild(this.tooltip);

    // Cursor tracking state (smooth follow)
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // Smooth tooltip tracking (Phase Δ.9.3: Faster easing for snappier response)
    this.tooltipTracker = setInterval(() => {
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.5; // Increased from 0.25 for faster follow
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.5;
      this.tooltip.style.left = `${this.mouse.x}px`;
      this.tooltip.style.top = `${this.mouse.y}px`;
    }, 16); // ~60fps

    console.log('[VibeAI Canvas] Initialized');
  }

  // Phase VIII.0: Set intensity (HRI-driven)
  setIntensity(value) {
    this.intensity = Math.max(0, Math.min(1, value)); // Clamp 0-1
  }

  createParticle() {
    return {
      x: Math.random() * CANVAS_CONFIG.width,
      y: Math.random() * CANVAS_CONFIG.height,
      vx: (Math.random() - 0.5) * CANVAS_CONFIG.particles.speed,
      vy: (Math.random() - 0.5) * CANVAS_CONFIG.particles.speed,
      alpha: Math.random() * 0.5,
      active: false
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Add event listeners
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('click', this.handleClick);

    // Phase Δ9.2: Listen for lexicon changes to refresh tooltip
    document.addEventListener('vibeai:lexiconChanged', () => {
      if (this.hoveredEmoji) {
        this.updateTooltip();
      }
    });

    // Start animation loop
    this.animate();
    console.log('[VibeAI Canvas] Started successfully');
  }

  setActiveTone(tone) {
    if (this.activeTone !== tone) {
      this.activeTone = tone;
      console.log(`[VibeAI Canvas] Active tone: ${tone}`);

      // Activate particles on tone change
      this.particles.forEach((p, i) => {
        if (i < 5) {
          p.active = true;
          p.alpha = 0.6;
        }
      });
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Phase Δ.9.1: Update cursor tracking for tooltip
    this.mouse.targetX = e.clientX + 14;
    this.mouse.targetY = e.clientY + 14;

    this.hoveredEmoji = null;

    CANVAS_CONFIG.emojis.forEach(emoji => {
      const dx = x - emoji.x;
      const dy = y - emoji.baseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Phase Δ.9.3: Larger hover radius for easier triggering (was 20px)
      // Increased to 50px per Council guidance for better discoverability
      if (distance < 50) {
        this.hoveredEmoji = emoji.tone;
        this.canvas.style.cursor = 'pointer';
      }
    });

    if (!this.hoveredEmoji) {
      this.canvas.style.cursor = 'default';
    }

    // Phase Δ.9.1: Update tooltip based on hover state
    this.updateTooltip();
  }

  // Phase VIII.0 Security Fix: Update tooltip content and visibility (DOM-safe, no innerHTML)
  updateTooltip() {
    if (this.hoveredEmoji && ACTIVE_TONE_MAP) {
      const tone = this.hoveredEmoji.toLowerCase();
      const lex = ACTIVE_TONE_MAP[tone];

      if (lex && lex.title && lex.phrase) {
        // Clear tooltip and build DOM nodes (XSS-safe)
        this.tooltip.textContent = '';

        // Title element
        const titleEl = document.createElement('div');
        titleEl.style.fontSize = '15px';
        titleEl.style.fontWeight = '600';
        titleEl.style.marginBottom = '4px';
        titleEl.style.color = String(lex.color || '#888');
        titleEl.textContent = String(lex.title || '');

        // Phrase element
        const phraseEl = document.createElement('div');
        phraseEl.style.fontSize = '13px';
        phraseEl.style.fontWeight = '400';
        phraseEl.style.opacity = '0.9';
        phraseEl.textContent = String(lex.phrase || '');

        this.tooltip.appendChild(titleEl);
        this.tooltip.appendChild(phraseEl);

        // Theme-aware background
        const isDark = currentTheme === 'dark';
        this.tooltip.style.background = isDark ? 'rgba(17, 17, 17, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        this.tooltip.style.color = isDark ? '#ffffff' : '#111111';
        this.tooltip.style.border = `1.5px solid ${String(lex.color || '#888')}`;
        // Pre-Phase A: Viewport boundary detection (synchronous - prevents flash)
        // Force reflow to ensure tooltip dimensions are calculated
        void this.tooltip.offsetHeight;

        // Calculate position BEFORE making visible to eliminate flash/jitter
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate adjusted position to prevent clipping
        let finalX = this.mouse.targetX;
        let finalY = this.mouse.targetY;

        // Check if tooltip would clip right edge
        const wouldClipRight = (finalX + tooltipRect.width) > viewportWidth;
        if (wouldClipRight) {
          finalX = viewportWidth - tooltipRect.width - 10;
        }

        // Check if tooltip would clip bottom edge
        const wouldClipBottom = (finalY + tooltipRect.height) > viewportHeight;
        if (wouldClipBottom) {
          finalY = viewportHeight - tooltipRect.height - 10;
        }

        // Ensure minimum distance from edges
        finalX = Math.max(10, finalX);
        finalY = Math.max(10, finalY);

        // Apply final position (overrides smooth tracking)
        this.tooltip.style.left = `${finalX}px`;
        this.tooltip.style.top = `${finalY}px`;
        this.mouse.x = finalX;
        this.mouse.y = finalY;

        // Show tooltip after position is calculated
        this.tooltip.style.opacity = '1';
        this.tooltip.style.transform = 'translateY(0px) scale(1)';

        console.log(`[VibeAI Lexicon] Tooltip active for tone: ${tone} | ${String(lex.title)}`);
      } else {
        // Fallback if lexicon data missing
        console.warn(`[VibeAI Lexicon] ⚠️ No lexicon data for tone: ${tone}`, ACTIVE_TONE_MAP);
        this.tooltip.textContent = `${tone} (lexicon not loaded)`;
        this.tooltip.style.opacity = '0.7';
      }
    } else {
      // Hide tooltip
      this.tooltip.style.opacity = '0';
      this.tooltip.style.transform = 'translateY(5px) scale(0.95)';
    }
  }

  handleClick(e) {
    if (this.hoveredEmoji) {
      console.log(`[VibeAI Canvas] Clicked tone: ${this.hoveredEmoji}`);
      this.setActiveTone(this.hoveredEmoji);

      // Create ripple effect
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.particles.forEach((p, i) => {
        if (i < 3) {
          p.x = x;
          p.y = y;
          p.active = true;
          p.alpha = 0.8;
          const angle = (i / 3) * Math.PI * 2;
          p.vx = Math.cos(angle) * CANVAS_CONFIG.particles.speed * 2;
          p.vy = Math.sin(angle) * CANVAS_CONFIG.particles.speed * 2;
        }
      });
    }
  }

  animate() {
    if (!this.isRunning) return;

    // Skip if tab is hidden (performance)
    if (document.hidden) {
      this.animationId = requestAnimationFrame(this.animate);
      return;
    }

    const now = Date.now();
    const elapsed = now - this.startTime;

    // Clear canvas
    this.ctx.clearRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);

    // Get theme colors
    const isDark = currentTheme === 'dark';
    const colors = isDark ? CANVAS_CONFIG.colors.dark : CANVAS_CONFIG.colors.light;

    // Draw particles
    this.particles.forEach(p => {
      if (!p.active) return;

      p.x += p.vx;
      p.y += p.vy;
      p.alpha *= CANVAS_CONFIG.particles.fadeRate;

      // Deactivate if too faint
      if (p.alpha < 0.05) {
        p.active = false;
        return;
      }

      // Wrap around edges
      if (p.x < 0) p.x = CANVAS_CONFIG.width;
      if (p.x > CANVAS_CONFIG.width) p.x = 0;
      if (p.y < 0) p.y = CANVAS_CONFIG.height;
      if (p.y > CANVAS_CONFIG.height) p.y = 0;

      // Draw particle
      this.ctx.fillStyle = colors.particle.replace(/[\d.]+\)$/, `${p.alpha})`);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, CANVAS_CONFIG.particles.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw emojis
    CANVAS_CONFIG.emojis.forEach(emoji => {
      const isActive = emoji.tone === this.activeTone;
      const isHovered = emoji.tone === this.hoveredEmoji;

      // Phase Δ.9: Intensity-driven dynamics
      const intensity = this.intensity || 0.6;
      const intensityMod = 0.5 + 0.5 * intensity; // 0.5-1.0 range

      // Calculate bob animation (amplitude scaled by intensity)
      const bobAmplitude = CANVAS_CONFIG.animation.bobAmplitude * intensityMod;
      const bobOffset = Math.sin(elapsed * CANVAS_CONFIG.animation.bobSpeed + emoji.x) * bobAmplitude;
      const y = emoji.baseY + bobOffset;

      // Glow effect for active emoji (size and opacity scaled by intensity)
      if (isActive) {
        const glowPulse = 0.5 + 0.5 * Math.sin(elapsed * CANVAS_CONFIG.animation.glowPulseSpeed);
        const baseGlowSize = 30 + glowPulse * 15;
        const glowSize = baseGlowSize * (0.7 + 0.3 * intensity); // 70%-100% based on intensity

        // Dynamic glow color with intensity-based alpha
        const glowAlpha = 0.3 + 0.3 * intensity; // 0.3-0.6 range
        const glowColor = colors.glow.replace(/[\d.]+\)$/, `${glowAlpha})`);

        const gradient = this.ctx.createRadialGradient(emoji.x, y, 0, emoji.x, y, glowSize);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(emoji.x - glowSize, y - glowSize, glowSize * 2, glowSize * 2);
      }

      // Draw emoji (size slightly affected by intensity)
      const emojiSize = isHovered ? 42 : (32 * (0.95 + 0.05 * intensity));
      this.ctx.font = `${Math.round(emojiSize)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Add shadow for inactive emojis
      if (!isActive) {
        this.ctx.globalAlpha = 0.4;
      }

      this.ctx.fillText(emoji.symbol, emoji.x, y);
      this.ctx.globalAlpha = 1.0;
    });

    // Continue animation loop at ~20 FPS
    setTimeout(() => {
      this.animationId = requestAnimationFrame(this.animate);
    }, 1000 / CANVAS_CONFIG.animation.fps);
  }

  destroy() {
    this.isRunning = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('click', this.handleClick);

    // Phase Δ.9.1: Cleanup tooltip
    if (this.tooltipTracker) {
      clearInterval(this.tooltipTracker);
      this.tooltipTracker = null;
    }

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }

    console.log('[VibeAI Canvas] Destroyed');
  }
}

// 🧠 Phase VIII.0 - HRI Bridge (Hugo Resonance Index: Emotion → Quantified Resonance)

// Tone emotional weight mapping (0.0-1.0 scale, HRI standard)
const HUGO_TONE_WEIGHTS = {
  calm: 0.40,
  urgent: 0.75,
  reflective: 0.60,
  dissonant: 0.30,
  resonant: 0.90
};

// Calculate HRI (Hugo Resonance Index) from text content (0.0-1.0)
function calculateHRI(text, tone = 'calm') {
  if (!text) return 0.50;

  const lower = text.toLowerCase();
  let hri = HUGO_TONE_WEIGHTS[tone] || 0.50;

  // Positive modifiers
  if (lower.match(/great|love|amazing|excellent|perfect|wonderful|fantastic/)) hri += 0.20;
  if (lower.match(/harmony|resonance|aligned|flow|synergy|coherent/)) hri += 0.15;
  if (lower.match(/beautiful|elegant|graceful|smooth|clear/)) hri += 0.10;

  // Urgent/action modifiers
  if (lower.match(/urgent|now|critical|fast|immediately|asap/)) hri += 0.15;
  if (lower.match(/important|priority|deadline|must|need/)) hri += 0.10;

  // Negative modifiers
  if (lower.match(/sad|confus|error|problem|difficult|struggle/)) hri -= 0.20;
  if (lower.match(/frustrat|annoying|wrong|broken|fail/)) hri -= 0.15;
  if (lower.match(/bad|poor|terrible|awful|horrible/)) hri -= 0.10;

  // Reflective modifiers
  if (lower.match(/think|consider|ponder|wonder|maybe|perhaps/)) hri += 0.05;
  if (lower.match(/interest|curious|explore|discover/)) hri += 0.10;

  // Message length factor (longer messages = more engagement)
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 50) hri += 0.10;
  else if (wordCount > 20) hri += 0.05;

  // Clamp to 0.0-1.0 range
  return Math.min(1.0, Math.max(0.0, hri));
}

// Update HRI Bridge (connects parser → canvas/orb → intensity)
// v2.14.1: Made orb-safe with pending state cache to prevent ReferenceError
function updateHRIBridge(text) {
  if (!text) return;

  // Detect tone and calculate HRI
  const tone = detectDominantTone(text);
  const hri = calculateHRI(text, tone);
  const intensity = hri; // HRI is already 0.0-1.0

  // Update global state (Phase VIII.0: dual compatibility)
  window.VIBEAI_LAST_TONE = tone;
  window.VIBEAI_LAST_HRI = hri;
  window.VIBEAI_LAST_SCORE = hriToLegacyScore(hri); // Backward compatibility

  // Phase VIII.0: Update Hugo Orb if enabled
  if (ENABLE_HUGO_ORB) {
    // v2.14.1 FIX #1: Use global window.hugoOrb reference (single source of truth)
    const orb = window.hugoOrb;

    // v2.14.1 FIX #2: If orb not ready yet, cache state for replay after mount
    if (!orb || typeof orb.updateState !== 'function') {
      window.__VIBEAI_PENDING_ORB_STATE__ = { text, tone, hri, intensity };
      console.log('[VibeAI HRI] ⏳ Orb not ready yet, state cached for replay');

      // Safe subtitle update (minimal)
      const hriLabel = document.getElementById('hri-label-output');
      if (hriLabel) {
        hriLabel.textContent = 'Analyzing…';
      }
      return; // Early exit - no crash
    }

    // Orb is ready, proceed with update
    // Create simple emotion distribution based on dominant tone
    const emotionDist = {
      calm: tone === 'calm' ? 0.7 : 0.1,
      urgent: tone === 'urgent' ? 0.7 : 0.1,
      reflective: tone === 'reflective' ? 0.7 : 0.1,
      dissonant: tone === 'dissonant' ? 0.7 : 0.1,
      resonant: tone === 'resonant' ? 0.7 : 0.1
    };

    orb.updateState(hri, emotionDist);

    // Update subtitle label with smooth transition (Tier-1 D1)
    const hriLabel = document.getElementById('hri-label-output');
    if (hriLabel) {
      const hriPercent = Math.round(hri * 100);
      let label = '';
      if (hri >= 0.85) label = `High Resonance (${hriPercent}%)`;
      else if (hri >= 0.60) label = `Stable Flow (${hriPercent}%)`;
      else if (hri >= 0.40) label = `Some Drift (${hriPercent}%)`;
      else label = `Attention Needed (${hriPercent}%)`;

      // Smooth fade transition
      hriLabel.style.transition = 'opacity 0.3s ease';
      hriLabel.style.opacity = '0';
      setTimeout(() => {
        hriLabel.textContent = label;
        hriLabel.style.opacity = '1';
      }, 150);
    }

    // Highlight dominant tone in strip (v2.14.2: preserve color backgrounds, use border)
    const toneItems = document.querySelectorAll('.tone-item');
    const toneColorMap = {
      calm: 'hsla(190, 70%, 55%, 0.12)',
      urgent: 'hsla(25, 80%, 55%, 0.12)',
      reflective: 'hsla(270, 60%, 60%, 0.12)',
      dissonant: 'hsla(0, 20%, 50%, 0.12)',
      resonant: 'hsla(150, 60%, 55%, 0.12)'
    };
    const toneBorderMap = {
      calm: 'hsl(190, 70%, 65%)',
      urgent: 'hsl(25, 80%, 65%)',
      reflective: 'hsl(270, 60%, 70%)',
      dissonant: 'hsl(0, 40%, 60%)',
      resonant: 'hsl(150, 60%, 65%)'
    };

    toneItems.forEach(item => {
      const itemTone = item.getAttribute('data-tone');
      const bgColor = toneColorMap[itemTone] || 'transparent';

      if (itemTone === tone) {
        // Active: bright border + brighter background + bold text
        item.setAttribute('data-active', 'true');
        item.style.opacity = '1';
        item.style.fontWeight = '600';
        item.style.background = bgColor.replace('0.12', '0.25'); // Brighten background
        item.style.border = `2px solid ${toneBorderMap[itemTone] || '#00d4ff'}`;
        item.style.boxShadow = `0 0 8px ${(toneBorderMap[itemTone] || '#00d4ff').replace('hsl', 'hsla').replace(')', ', 0.3)')}`;
      } else {
        // Inactive: subtle color hint
        item.setAttribute('data-active', 'false');
        item.style.opacity = '0.7';
        item.style.fontWeight = '400';
        item.style.background = bgColor;
        item.style.border = '2px solid transparent';
        item.style.boxShadow = 'none';
      }
    });
  }

  // Legacy: Update FoldSpace canvas if present
  if (foldSpaceCanvas && foldSpaceCanvas.setActiveTone) {
    foldSpaceCanvas.setActiveTone(tone);

    // Set intensity for dynamic visual effects
    if (typeof foldSpaceCanvas.setIntensity === 'function') {
      foldSpaceCanvas.setIntensity(intensity);
    } else {
      foldSpaceCanvas.intensity = intensity; // Fallback direct property
    }
  }

  console.log(`[HRI Bridge] Tone: ${tone} | HRI: ${hri.toFixed(3)} | Intensity: ${intensity.toFixed(2)}`);
}

// Tone Detection Heuristic (Phase Δ.8 - enhanced in Phase VIII.0 with HRI)
function detectDominantTone(text) {
  if (!text) return 'calm';

  const lower = text.toLowerCase();

  // Keyword maps for each tone
  const toneKeywords = {
    urgent: ['urgent', 'immediately', 'asap', 'critical', 'emergency', 'now', 'hurry', 'deadline'],
    dissonant: ['error', 'problem', 'issue', 'bug', 'fail', 'broken', 'wrong', 'conflict'],
    resonant: ['perfect', 'excellent', 'amazing', 'brilliant', 'harmony', 'aligned', 'synergy'],
    reflective: ['think', 'consider', 'reflect', 'ponder', 'analyze', 'contemplate', 'perhaps'],
    calm: ['calm', 'peace', 'relax', 'steady', 'gentle', 'slow', 'balanced']
  };

  // Score each tone
  const scores = {};
  for (const [tone, keywords] of Object.entries(toneKeywords)) {
    scores[tone] = keywords.filter(keyword => lower.includes(keyword)).length;
  }

  // Find highest scoring tone
  let maxScore = 0;
  let dominantTone = 'calm';

  for (const [tone, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantTone = tone;
    }
  }

  return dominantTone;
}

// Global canvas instance
let foldSpaceCanvas = null;

// 1. Create unified HUD container
function renderHUDContainer() {
  if (document.getElementById('vibeai-unified-hud')) {
    console.log('[VibeAI UniHUD] Container already exists');
    return document.getElementById('vibeai-unified-hud');
  }

  const hud = document.createElement('div');
  hud.id = 'vibeai-unified-hud';
  hud.style.cssText = `
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    width: 360px;
    max-height: 85vh;
    background: var(--vibeai-hud-bg);
    backdrop-filter: blur(var(--vibeai-hud-blur, 14px)) saturate(180%);
    -webkit-backdrop-filter: blur(var(--vibeai-hud-blur, 14px)) saturate(180%);
    transition: background 0.3s ease, backdrop-filter 0.25s ease, color 0.3s ease;
    border-radius: 12px;
    border: 1px solid var(--vibeai-hud-border);
    box-shadow: 0 20px 45px var(--vibeai-hud-shadow);
    color: var(--vibeai-hud-text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    z-index: 2147483647;
    pointer-events: auto;
    overflow: hidden;
    isolation: isolate;
    display: flex;
    flex-direction: column;
  `;
  // Mark HUD as mounted for inject-once guards
  try {
    window.__VIBEAI__ = window.__VIBEAI__ || {};
    window.__VIBEAI__.hudMounted = true;
    window.__VIBEAI__.hudMounting = false;
  } catch (e) {}

  // Header with controls (traditional browser-style top bar)
  const header = document.createElement('div');
  header.id = 'vibeai-hud-header';
  header.style.cssText = `
    padding: 12px 16px;
    border-bottom: 2px solid rgba(0, 170, 255, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    user-select: none;
  `;
  header.innerHTML = `
    <div id="vibeai-header-title" style="flex: 1; text-align: center;">
      <div style="font-size: 1.15em; font-weight: bold; color: #00d4ff; letter-spacing: 1.5px;">VibeAI Thread Inspector</div>
    </div>
    <div style="display: flex; gap: 6px; align-items: center;">
      <button class="vibeai-icon-btn" id="vibeai-toggle-canvas" title="Hide Canvas" style="font-size: 18px; font-weight: bold; min-width: 32px; min-height: 32px;">—</button>
      <button class="vibeai-icon-btn" id="vibeai-close-hud" title="Close HUD">✕</button>
    </div>
  `;
  hud.appendChild(header);

  // Pre-Phase A: Utility buttons moved to footer for Hugo Orb space optimization

  // ================================
  // BEGIN HUGO ORB STRUCTURE (Phase VIII.0)
  // ================================
  // STRATEGIC CONTEXT: Hugo Orb addresses Beta Tester Zero feedback - "What am I looking at?"
  // This is the HERO visualization that provides immediate emotional clarity
  // Future hooks: Emotion Matching Game, Weather Report, Fortune Cookies, Mood Snapshots

  const headerSection = document.createElement('div');
  headerSection.id = ENABLE_HUGO_ORB ? 'vibeai-hugo-orb-section' : 'vibeai-foldspace-header';
  headerSection.style.cssText = `
    padding: 12px 16px;
    background: var(--vibeai-hud-header-bg);
    border-bottom: 1px solid rgba(0, 170, 255, 0.12);
    display: flex;
    gap: 8px;
    transition: background 0.3s ease;
    align-items: center;
    justify-content: center;
  `;

  if (ENABLE_HUGO_ORB) {
    // ================================
    // HUGO ORB: Hero Visualization (v2.14.1 - Horizontal Layout)
    // ================================
    // Tier-1 Evolution: Orb left, tone strip right (vertical space reclaimed)

    const orbArea = document.createElement('div');
    orbArea.id = 'vibeai-orb-area';
    orbArea.style.cssText = `
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      width: 100%;
      gap: 12px;
    `;

    orbArea.innerHTML = `
      <!-- LEFT: Hugo Orb + Subtitle (compact + future collapse hook) -->
      <div class="vibeai-hugo-orb-block" data-collapsed="false" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        position: relative;
        padding: 10px;
        border-radius: 50%;
        background: radial-gradient(circle at center, rgba(0, 212, 255, 0.08) 0%, transparent 70%);
      ">
        <!-- Hugo Orb Canvas (optimized size: 130px for vertical space) -->
        <div class="hugo-orb-wrapper" style="
          width: 130px;
          height: 130px;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
          animation: vibeai-orb-glow 3s ease-in-out infinite;
        ">
          <canvas class="hugo-orb-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>

        <!-- Subtitle below orb -->
        <div class="hugo-orb-caption" style="text-align: center; width: 130px;">
          <div class="hugo-orb-title" style="font-size: 13px; font-weight: 600; color: #00d4ff; letter-spacing: 0.5px; margin-bottom: 2px;">
            Conversation Resonance
          </div>
          <div class="hugo-orb-subtitle" id="hri-label-output" style="font-size: 11px; color: var(--vibeai-orb-subtitle); font-style: italic; transition: color 0.3s ease;">
            Analyzing...
          </div>
        </div>
      </div>

      <!-- RIGHT: Tone Strip (vertical list) -->
      <div class="vibeai-tone-strip-bar" style="
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
        font-size: 12px;
      ">
        <div class="tone-item" data-tone="calm" title="Calm tone detected in conversation (peaceful, relaxed language)" style="opacity: 0.9; transition: all 0.3s ease; cursor: pointer; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; background: hsla(190, 70%, 55%, 0.12); border: 2px solid transparent;">
          <span style="font-size: 18px;">🌊</span>
          <span style="font-weight: 500; color: var(--vibeai-tone-label); transition: color 0.3s ease;">Calm</span>
        </div>
        <div class="tone-item" data-tone="urgent" title="Urgent tone detected in conversation (time-sensitive, immediate language)" style="opacity: 0.9; transition: all 0.3s ease; cursor: pointer; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; background: hsla(25, 80%, 55%, 0.12); border: 2px solid transparent;">
          <span style="font-size: 18px;">⚡</span>
          <span style="font-weight: 500; color: var(--vibeai-tone-label); transition: color 0.3s ease;">Urgent</span>
        </div>
        <div class="tone-item" data-tone="reflective" title="Reflective tone detected in conversation (thoughtful, contemplative language)" style="opacity: 0.9; transition: all 0.3s ease; cursor: pointer; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; background: hsla(270, 60%, 60%, 0.12); border: 2px solid transparent;">
          <span style="font-size: 18px;">🔮</span>
          <span style="font-weight: 500; color: var(--vibeai-tone-label); transition: color 0.3s ease;">Reflect</span>
        </div>
        <div class="tone-item" data-tone="dissonant" title="Tension detected in conversation (conflicting or unclear language)" style="opacity: 0.9; transition: all 0.3s ease; cursor: pointer; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; background: hsla(0, 20%, 50%, 0.12); border: 2px solid transparent;">
          <span style="font-size: 18px;">⚙️</span>
          <span style="font-weight: 500; color: var(--vibeai-tone-label); transition: color 0.3s ease;">Tension</span>
        </div>
        <div class="tone-item" data-tone="resonant" title="Aligned tone detected in conversation (harmonious, flowing language)" style="opacity: 0.9; transition: all 0.3s ease; cursor: pointer; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 8px; background: hsla(150, 60%, 55%, 0.12); border: 2px solid transparent;">
          <span style="font-size: 18px;">✨</span>
          <span style="font-weight: 500; color: var(--vibeai-tone-label); transition: color 0.3s ease;">Aligned</span>
        </div>
      </div>
    `;

    headerSection.appendChild(orbArea);

  } else {
    // ================================
    // LEGACY FOLDSPACE FALLBACK (Preserved for rollback)
    // ================================

    // Helper to resolve extension asset URLs when available
    function assetUrl(relPath) {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          return chrome.runtime.getURL(relPath);
        }
      } catch { /* ignore */ }
      return relPath;
    }

    // Mood tiles order: calm, urgent, reflective, dissonant, resonant
    const tiles = [
      { key: 'calm', bg: 'linear-gradient(90deg,#00C6FF,#0072FF)' },
      { key: 'urgent', bg: 'linear-gradient(90deg,#FF9900,#FF0033)' },
      { key: 'reflective', bg: 'linear-gradient(90deg,#9B5DE5,#3A0CA3)' },
      { key: 'dissonant', bg: 'linear-gradient(90deg,#556270,#4E4376)' },
      { key: 'resonant', bg: 'linear-gradient(90deg,#00F5A0,#FF0080)' }
    ];

    const tileMeta = {
      calm: { emoji: '🌊', label: 'Calm' },
      urgent: { emoji: '⚡', label: 'Urgent' },
      reflective: { emoji: '🔮', label: 'Reflective' },
      dissonant: { emoji: '⚙️', label: 'Tension' },
      resonant: { emoji: '✨', label: 'Aligned' }
    };

    headerSection.innerHTML = `
      <div id="vibeai-foldspace-canvas-tiles" style="display:flex;gap:6px;align-items:center;justify-content:center;width:100%;">
        ${tiles.map(t => {
          const m = tileMeta[t.key] || { emoji: '🌌', label: t.key };
          return `
          <div class="foldspace-tile" data-tone="${t.key}"
            style="flex:1;height:56px;border-radius:12px;background:${t.bg};
            position:relative;overflow:hidden;display:flex;flex-direction:column;
            align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.2), 0 0 0 2px rgba(255,255,255,0.2);
            gap:2px;cursor:pointer;
            transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            opacity:0.95;">
            <div class="foldspace-tile-symbol"
              style="font-size:26px;line-height:1;
              filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));
              transition:transform 0.3s ease;">${m.emoji}</div>
            <div class="foldspace-tile-label"
              style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.95);
              letter-spacing:0.5px;text-shadow:0 1px 3px rgba(0,0,0,0.5);
              text-transform:uppercase;line-height:1;">${m.label}</div>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  hud.appendChild(headerSection);

  // ================================
  // BEGIN HUGO ORB ENGINE (Phase VIII.0)
  // ================================
  /*
  FUTURE FEATURES (DO NOT IMPLEMENT YET - Phase 2+):
  - Emotion Matching Mini-Game (onboarding calibration - interactive mood matching)
  - Emotional Weather Report (daily summary + email hook - "Today's vibe: Mostly Calm with Urgent bursts")
  - Fortune Cookie Insight (context-aware closing insight - wisdom based on conversation patterns)
  - Mood Snapshot Collage (weekly/monthly shareable visual - Instagram-ready emotional journey)

  The Hugo Orb is the FOUNDATION visual for all of these features.
  Hook points: orb.updateState(), dominantTone detection, aggregate emotional data
  */

  // v2.14.1 FIX #1: Removed local hugoOrb - using window.hugoOrb as single source of truth

  if (ENABLE_HUGO_ORB) {
    /**
     * Creates the Hugo Orb canvas-based visualization engine
     * @param {HTMLCanvasElement} canvas - The canvas element to render into
     * @returns {Object} Orb controller with updateState, stop, start, destroy methods
     */
    function createHugoOrb(canvas) {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const size = 130; // Match wrapper size (Tier-1 Polish: optimized for vertical space)

      // Set canvas resolution for crisp rendering
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;

      // State
      let hri = 0.5; // Hugo Resonance Index (0.0-1.0)
      let emotionDist = {
        calm: 1,
        urgent: 0,
        reflective: 0,
        dissonant: 0,
        resonant: 0
      };
      let running = true;
      let destroyed = false;
      let animationFrameId = null;

      // Tone color mapping (HSL hue values)
      const toneHue = {
        calm: 190,        // Cyan-blue (tranquil waters)
        urgent: 25,       // Orange-red (alert, action)
        reflective: 270,  // Purple (introspection)
        dissonant: 0,     // Red-gray (tension)
        resonant: 150     // Teal-green (harmony)
      };

      // Particle system for ambient halo (scaled for 170px canvas)
      const particles = [];
      const particleCount = 24;
      const baseRadius = size * 0.42; // Scale to canvas size (was 100 for 240px)
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          angle: (Math.PI * 2 * i) / particleCount,
          radius: baseRadius + Math.random() * 14,
          speed: 0.0003 + Math.random() * 0.0005,
          size: 1.5 + Math.random() * 1.5,
          opacity: 0.3 + Math.random() * 0.4
        });
      }

      /**
       * Returns the dominant emotion tone based on distribution
       */
      function dominantTone() {
        return Object.entries(emotionDist)
          .sort((a, b) => b[1] - a[1])[0][0];
      }

      /**
       * Main animation loop
       */
      function draw(timestamp) {
        if (!running) return;

        ctx.clearRect(0, 0, size, size);
        const tone = dominantTone();
        const hue = toneHue[tone] || 190;
        const pulse = Math.sin(timestamp * 0.001) * 0.1; // Gentle pulse

        // ================================
        // LAYER 1: Particle Halo (Ambient)
        // ================================
        particles.forEach((p) => {
          p.angle += p.speed;
          const x = cx + Math.cos(p.angle) * p.radius;
          const y = cy + Math.sin(p.angle) * p.radius;

          ctx.fillStyle = `hsla(${hue}, 70%, 70%, ${p.opacity * hri})`;
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // ================================
        // LAYER 2: Fluid Core (Radial Gradient)
        // ================================
        const coreRadius = (size * 0.33) + pulse * 7; // Scale to canvas size (was 80 for 240px)
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);

        // Core brightness tied to HRI
        const coreAlpha = 0.3 + (0.5 * hri);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 65%, ${coreAlpha})`);
        gradient.addColorStop(0.6, `hsla(${hue}, 70%, 45%, ${coreAlpha * 0.6})`);
        gradient.addColorStop(1, `hsla(${hue}, 60%, 25%, 0.05)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // ================================
        // LAYER 3: Segmented Rings (Emotion Distribution)
        // ================================
        const ringRadius = size * 0.44; // Scale to canvas size (was 105 for 240px)
        const segmentWidth = 0.12; // Radians per segment
        const segmentGap = 0.05;   // Gap between segments
        let currentAngle = 0;

        // Draw segments for each emotion proportionally
        Object.entries(emotionDist).forEach(([emotionTone, value]) => {
          if (value <= 0) return;

          const segmentCount = Math.round(value * 32); // Max 32 segments per emotion
          const segmentHue = toneHue[emotionTone] || hue;

          ctx.strokeStyle = `hsla(${segmentHue}, 85%, 65%, 0.8)`;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';

          for (let i = 0; i < segmentCount; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius, currentAngle, currentAngle + segmentWidth);
            ctx.stroke();
            currentAngle += segmentWidth + segmentGap;
          }
        });

        // ================================
        // LAYER 4: Outer Ring Glow
        // ================================
        const outerGlowGradient = ctx.createRadialGradient(cx, cy, ringRadius - 10, cx, cy, ringRadius + 15);
        outerGlowGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
        outerGlowGradient.addColorStop(1, `hsla(${hue}, 80%, 60%, ${0.15 * hri})`);

        ctx.fillStyle = outerGlowGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius + 15, 0, Math.PI * 2);
        ctx.fill();

        animationFrameId = requestAnimationFrame(draw);
      }

      // Start animation
      animationFrameId = requestAnimationFrame(draw);

      // Public API
      return {
        /**
         * Updates the orb's emotional state
         * @param {number} newHri - Hugo Resonance Index (0.0-1.0)
         * @param {Object} newDist - Emotion distribution object
         */
        updateState(newHri, newDist) {
          if (typeof newHri === 'number' && isFinite(newHri)) {
            hri = Math.max(0, Math.min(1, newHri));
          }
          if (newDist && typeof newDist === 'object') {
            emotionDist = { ...emotionDist, ...newDist };
          }
        },

        /**
         * Stops the animation loop
         */
        stop() {
          // Pause animation safely
          if (destroyed) return;
          running = false;
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        },

        /**
         * Resumes the animation loop
         */
        start() {
          // Resume animation only if not destroyed and not already running
          if (destroyed) return;
          if (!running) {
            running = true;
            if (!animationFrameId) animationFrameId = requestAnimationFrame(draw);
          }
        },

        /**
         * Destroys the orb (cleanup)
         */
        destroy() {
          // Idempotent destroy
          if (destroyed) return;
          destroyed = true;
          running = false;
          try {
            if (animationFrameId) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
            }
          } catch (e) { console.warn('[VibeAI Orb] error cancelling animation', e); }

          // Clear heavy state to allow GC
          try { particles.length = 0; } catch (e) {}
        },

        /**
         * Returns current dominant tone
         */
        getDominantTone() {
          return dominantTone();
        }
      };
    }

    // Initialize Hugo Orb
    const orbCanvas = headerSection.querySelector('.hugo-orb-canvas');
    if (orbCanvas) {
      // v2.14.1 FIX #1: Store orb globally at window.hugoOrb (single source of truth)
      window.hugoOrb = createHugoOrb(orbCanvas);
      console.log('[VibeAI] 🌀 Hugo Orb initialized (window.hugoOrb available)');

      // v2.14.1 FIX #3: Replay pending state if updates arrived before orb was ready
      const pending = window.__VIBEAI_PENDING_ORB_STATE__;
      if (pending?.text) {
        console.log('[VibeAI HRI] 🔄 Replaying pending state after orb mount');
        updateHRIBridge(pending.text);
        window.__VIBEAI_PENDING_ORB_STATE__ = null;
      }
    } else {
      console.warn('[VibeAI] Hugo Orb canvas not found - orb disabled');
    }

    // Add hover effect to tone strip items (register cleanup to remove listeners)
    const toneItems = Array.from(headerSection.querySelectorAll('.tone-item') || []);
    const __tone_item_handlers = [];
    toneItems.forEach(item => {
      const onEnter = () => {
        item.style.opacity = '1';
        item.style.transform = 'scale(1.05)';
        item.style.background = 'rgba(0, 212, 255, 0.15)';
      };
      const onLeave = () => {
        if (item.getAttribute('data-active') !== 'true') {
          item.style.opacity = '0.6';
          item.style.transform = 'scale(1)';
          item.style.background = 'transparent';
        }
      };
      item.addEventListener('mouseenter', onEnter);
      item.addEventListener('mouseleave', onLeave);
      __tone_item_handlers.push(() => {
        try { item.removeEventListener('mouseenter', onEnter); } catch (e) {}
        try { item.removeEventListener('mouseleave', onLeave); } catch (e) {}
      });
    });

    // Ensure tone item listeners are cleaned up
    registerCleanup(() => {
      __tone_item_handlers.forEach(fn => {
        try { fn(); } catch (e) { console.warn('tone listener cleanup error', e); }
      });
      dbg('tone item listeners removed');
    });

    // Pause/resume orb on page visibility change
    (function(){
      function __vibeai_onVisibility() {
        try {
          if (!window.hugoOrb) return;
          if (document.hidden) {
            window.hugoOrb.stop();
            dbg('visibility hidden - orb stopped');
          } else {
            window.hugoOrb.start();
            dbg('visibility visible - orb started');
          }
        } catch (e) { console.warn('visibility handler error', e); }
      }
      document.addEventListener('visibilitychange', __vibeai_onVisibility);
      registerCleanup(() => document.removeEventListener('visibilitychange', __vibeai_onVisibility));
    })();
  }

  // ================================
  // END HUGO ORB ENGINE
  // ================================

  // Thread feed container
  const threadFeed = document.createElement('div');
  threadFeed.id = 'vibeai-thread-feed-unified';
  threadFeed.style.cssText = `
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 16px;
  `;
  threadFeed.innerHTML = `<p style="text-align: center; color: var(--vibeai-empty-message); padding: 30px 20px; font-style: italic; transition: color 0.3s ease;">🧠 No threads detected yet. Send your first message in the chat — FoldSpace will map the conversation here and threads will appear.</p>`;
  hud.appendChild(threadFeed);

  // Footer with transparency slider (left) and theme toggle (right)
  const footer = document.createElement('div');
  footer.id = 'vibeai-hud-footer';
  footer.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 12px;
    border-top: 1px solid rgba(0, 170, 255, 0.15);
    background: var(--vibeai-hud-footer-bg);
    transition: background 0.3s ease;
  `;
  footer.innerHTML = `
    <div style="display:flex; gap:6px; align-items:center; flex:1;">
      <button id="vibeai-consent" class="footer-btn"
        style="background:none; border:none; color:#00d4ff; cursor:pointer; padding:4px 8px; font-size:0.8em; border-radius:4px; transition:all 0.2s ease;"
        title="View consent preferences">
        Consent
      </button>
      <button id="vibeai-privacy" class="footer-btn"
        style="background:none; border:none; color:#00d4ff; cursor:pointer; padding:4px 8px; font-size:0.8em; border-radius:4px; transition:all 0.2s ease;"
        title="View privacy policy">
        Privacy
      </button>
      <button id="vibeai-report-bug" class="footer-btn"
        style="background:none; border:none; color:#00d4ff; cursor:pointer; padding:4px 8px; font-size:0.8em; border-radius:4px; transition:all 0.2s ease;"
        title="Report a bug or issue">
        Report
      </button>
    </div>
    <div style="display:flex; gap:6px; align-items:center;">
      <!-- v2.14.3: Theme toggle hidden for Tier 1 (reserved for Tier 2/3 onboarding) -->
      <button id="vibeai-theme-toggle"
        title="${currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}"
        style="display:none; background:none; border:none; cursor:pointer; font-size:18px; padding:4px;
        border-radius:6px; transition:all 0.3s ease;
        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        ${currentTheme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button id="vibeai-coach-btn"
        title="VibeAI Coach: Post-send reflection & prompt library"
        style="background:none; border:none; cursor:pointer; font-size:14px; padding:6px 10px;
        border-radius:8px; transition:all 0.3s ease;
        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3)); font-weight:700;
        background: rgba(255,255,255,0.1); color: white; display: flex; align-items: center; gap: 4px;">
        <span>🧠</span>
        <span style="font-size: 12px;">Coach</span>
      </button>
    </div>
  `;
  hud.appendChild(footer);

  document.body.appendChild(hud);
  // Restore saved HUD position/size if available (user sovereignty)
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([
        'vibeai_hud_position_x',
        'vibeai_hud_position_y',
        'vibeai_hud_width',
        'vibeai_hud_height'
      ], (res) => {
        try {
          if (res.vibeai_hud_position_x) {
            hud.style.left = res.vibeai_hud_position_x;
            hud.style.top = res.vibeai_hud_position_y || hud.style.top;
            hud.style.right = 'auto';
            hud.style.transform = 'none';
          }
          if (res.vibeai_hud_width) hud.style.width = res.vibeai_hud_width;
          if (res.vibeai_hud_height) hud.style.height = res.vibeai_hud_height;
        } catch (e) { /* ignore restore errors */ }
      });
    }
  } catch (e) { /* best-effort */ }

  // Phase VIII.0.2: Draggable HUD functionality (Steven beta feedback - Priority 2)
  initDraggableHUD(hud, header);

  // Phase VIII.0.2: Resizable HUD functionality (Steven beta feedback - Priority 3)
  initResizableHUD(hud);

  // Ensure canvas layer is present before HUD toggles attempt to access it
  ensureCanvasLayer();
  injectHUDStyles();
  attachEventListeners();

  // Initialize theme system
  detectTheme().then(theme => {
    applyTheme(theme);
  });

  // Pre-Phase A: Apply fixed HUD opacity (design authority)
  applyFixedHudOpacity();
  console.log('[VibeAI HUD] Fixed opacity applied: α=0.65, blur=14px');

  // 🎨 Phase Δ.9.1 - Load lexicon preference and tone map
  // Phase Δ9.2.2: Wait for lexicon to load BEFORE initializing canvas
  loadLexiconPreference().then(() => {
    return loadToneMap();
  }).then(() => {
    console.log('[VibeAI Lexicon] ✅ Lexicon loaded, initializing canvas...');
    initializeFoldSpaceCanvas();
  }).catch(err => {
    console.warn('[VibeAI Lexicon] Failed to load initial lexicon:', err);
    // Still initialize canvas with fallback
    initializeFoldSpaceCanvas();
  });

  // 🎨 Phase Δ.8 - Initialize FoldSpace Canvas (after lexicon loads)
  function initializeFoldSpaceCanvas() {
    // DEBUG FIX (v2.14.0): HARD-GATE FoldSpaceCanvas when Hugo Orb is enabled
    // Hugo Orb uses a completely different DOM structure and rendering pipeline
    if (ENABLE_HUGO_ORB) {
      console.log('[VibeAI Canvas] Skipping FoldSpaceCanvas init (Hugo Orb active)');
      return;
    }

    if (!FEATURE_FLAGS.ENABLE_CANVAS_MOOD) return;

    const canvasEl = document.getElementById('foldspace-canvas');
    if (canvasEl) {
      try {
        foldSpaceCanvas = new FoldSpaceCanvas(canvasEl);
        foldSpaceCanvas.start();

        // ⚙️ Phase Δ.8.2 - Page-Context Debug Bridge (Cross-Context Communication)
        // SECURITY: Only enable debug APIs when window.VIBEAI_HUD_DEBUG is true
        if (window.VIBEAI_HUD_DEBUG) {
          try {
            // Expose in content script context (for internal debugging)
            window.foldSpaceCanvas = foldSpaceCanvas;

            // Inject debug API into page context (accessible from DevTools console)
            const bridgeScript = document.createElement('script');
            bridgeScript.id = 'vibeai-debug-bridge';
            bridgeScript.textContent = `
              (function() {
                if (window.__vibeai_canvas_debug) {
                  console.log('[VibeAI Canvas] Debug API already exists, skipping injection');
                  return;
                }

                window.__vibeai_canvas_debug = {
                  setActiveTone: function(tone) {
                    const validTones = ['calm', 'urgent', 'reflective', 'dissonant', 'resonant'];
                    if (!validTones.includes(tone)) {
                      console.error('[VibeAI Debug] Invalid tone. Use: ' + validTones.join(', '));
                      return;
                    }
                    const event = new CustomEvent('vibeai:setTone', { detail: { tone: tone } });
                    document.dispatchEvent(event);
                    console.log('[VibeAI Debug] Tone change requested: ' + tone);
                  },
                  getTone: function() {
                    return window.__vibeai_current_tone || 'unknown';
                  },
                  listTones: function() {
                    console.log('Available tones: calm, urgent, reflective, dissonant, resonant');
                    return ['calm', 'urgent', 'reflective', 'dissonant', 'resonant'];
                  },
                  help: function() {
                    console.log('%c🎨 VibeAI Canvas Debug API', 'font-size: 14px; font-weight: bold; color: #00d4ff;');
                    console.log('');
                    console.log('Available commands:');
                    console.log('  __vibeai_canvas_debug.setActiveTone("urgent")  - Change active tone');
                    console.log('  __vibeai_canvas_debug.getTone()                 - Get current tone');
                    console.log('  __vibeai_canvas_debug.listTones()               - List all tones');
                    console.log('  __vibeai_canvas_debug.help()                    - Show this help');
                    console.log('');
                    console.log('Available tones: 🌊 calm, ⚡ urgent, 🔮 reflective, ⚙️ dissonant, ✨ resonant');
                  }
                };

                // Store initial tone
                window.__vibeai_current_tone = 'calm';

                console.log('%c[VibeAI Canvas] 🎨 Debug API Ready', 'color: #00d4ff; font-weight: bold');
                console.log('Type: __vibeai_canvas_debug.help() for usage');
              })();
            `;

            // Inject into page - use both head and documentElement for reliability
            (document.head || document.documentElement).appendChild(bridgeScript);

            // Small delay to ensure script executes, then remove
            setTimeout(() => {
              if (bridgeScript.parentNode) {
                bridgeScript.remove();
              }
              // Phase Δ9.2: Signal that debug bridge is ready
              document.dispatchEvent(new CustomEvent('vibeai:debugBridgeReady'));
            }, 100);

            // Listen for tone change events from page context
            document.addEventListener('vibeai:setTone', (event) => {
              const tone = event.detail.tone;
              if (foldSpaceCanvas && foldSpaceCanvas.setActiveTone) {
                foldSpaceCanvas.setActiveTone(tone);

                // Update current tone in page context
                const updateScript = document.createElement('script');
                updateScript.textContent = `window.__vibeai_current_tone = '${tone}';`;
                (document.head || document.documentElement).appendChild(updateScript);
                setTimeout(() => updateScript.remove(), 10);
              }
            });

            console.log('[VibeAI Canvas] Debug bridge injected (cross-context active)');
          } catch (hookErr) {
            console.warn('[VibeAI Canvas] Failed to inject debug bridge:', hookErr);
          }
        } else {
          console.log('[VibeAI] Running in production mode - debug APIs disabled');
        }

      } catch (err) {
        console.error('[VibeAI Canvas] Failed to initialize:', err);
      }
    }
  } // End initializeFoldSpaceCanvas

  // DEBUG FIX (v2.14.0): CRITICAL - Move HRI initialization OUTSIDE FoldSpaceCanvas
  // This ensures Hugo Orb receives updates even when FoldSpaceCanvas is gated
  // Phase VIII.0: Initialize with HRI Bridge
  if (window.VIBEAI_LAST_THREADS && window.VIBEAI_LAST_THREADS.length > 0) {
    const latest = window.VIBEAI_LAST_THREADS[window.VIBEAI_LAST_THREADS.length - 1];
    if (latest && latest.content) {
      updateHRIBridge(latest.content);
      console.log('[VibeAI HRI] 🎯 Initial HRI sync from existing threads');
    }
  }

  // Phase Δ9.3-Lite: Listen for dynamic thread updates (every 8s from parser)
  // CRITICAL: This event listener must be registered regardless of visualization mode
  // v2.14.1: Enhanced postMessage bridge with comprehensive logging
  // Cross-context bridge: listen for `window.postMessage` from content scripts/parser
  // This guarantees updates even when the parser runs in an isolated world.

  // Guard against duplicate listener registration
  if (!window.__VIBEAI_MESSAGE_LISTENER_REGISTERED__) {
    window.__VIBEAI_MESSAGE_LISTENER_REGISTERED__ = true;

    // v2.14.3: Rate limit state (Pre-Steven hardening)
    let lastMessageTime = 0;

    const messageHandler = (e) => {
      try {
        // v2.14.3: GATE A - Hostname allowlist (Pre-Steven hardening v2)
        const allowedHosts = [
          'chatgpt.com', 'www.chatgpt.com', 'chat.openai.com',
          'claude.ai', 'www.claude.ai',
          'gemini.google.com',
          'copilot.microsoft.com'
        ];
        if (!allowedHosts.includes(location.hostname)) {
          if (window.VIBEAI_HUD_DEBUG) console.warn('[VibeAI HRI] ⚠️ Message blocked: hostname not in allowlist');
          return;
        }

        // v2.14.3: GATE B - Source validation
        if (e.source !== window) return;

        // v2.14.1: Accept both old lowercase and new uppercase message types
        const isVibeAIMessage = e?.data?.type === 'VIBEAI_THREAD_UPDATE' ||
                                e?.data?.type === 'vibeai:threadUpdate';

        if (!e || !e.data || !isVibeAIMessage) return;

        // v2.14.3: GATE C - Schema validation + caps (Pre-Steven hardening)
        const detail = e.data.detail || {};
        if (typeof detail !== 'object') return;
        if (typeof detail.count !== 'number' || !isFinite(detail.count)) return;
        if (detail.threads) {
          if (!Array.isArray(detail.threads)) return;
          if (detail.threads.length > 200) return; // Cap: max 200 threads

          // Validate each thread schema
          for (const t of detail.threads) {
            if (typeof t.id !== 'string' || t.id.length > 120) return;
            if (t.content && typeof t.content === 'string' && t.content.length > 2000) return;
            if (t.preview && typeof t.preview === 'string' && t.preview.length > 500) return;
            if (t.tone && typeof t.tone !== 'string') return;
            if (t.emotionalTones && (!Array.isArray(t.emotionalTones) || t.emotionalTones.length > 5)) return;
          }
        }

        // v2.14.3: GATE D - Rate limit (Pre-Steven hardening)
        const now = Date.now();
        if (now - lastMessageTime < 2000) return; // Ignore updates faster than 2s
        lastMessageTime = now;

        // v2.14.1: Strict bridge token validation (anti-noise gate, NOT cryptographic security)
        // NOTE: Token is delivered via DOM CustomEvent, so page scripts can observe it.
        // This is an anti-spam measure, not a security boundary. See docs/KNOWN_LIMITATIONS.md
        const expectedToken = __VIBEAI_BRIDGE_TOKEN_LOCAL;
        if (expectedToken && e.data.bridgeToken !== expectedToken) {
          console.warn('[VibeAI HRI] ⚠️ Message rejected: invalid bridgeToken');
          return;
        }

        // Process validated message (detail already validated above in GATE C)
        if (detail && detail.content) {
          // v2.14.2: Store enriched threads array (with mood data) for live icons
          if (detail.threads && Array.isArray(detail.threads)) {
            window.VIBEAI_LAST_THREADS = detail.threads;

            // v2.14.2: Re-render thread feed with LIVE mood icons
            if (typeof updateThreadFeed === 'function') {
              updateThreadFeed(detail.threads);
            }
          }

          updateHRIBridge(detail.content);
        }
      } catch (err) {
        console.error('[VibeAI HRI] ❌ window message handler error', err);
      }
    };

    window.addEventListener('message', messageHandler, true);

    // Register cleanup handler to remove listener on HUD destroy
    registerCleanup(() => {
      window.removeEventListener('message', messageHandler, true);
      window.__VIBEAI_MESSAGE_LISTENER_REGISTERED__ = false;
      console.log('[VibeAI HRI] 🧹 postMessage listener cleaned up');
    });

    console.log('[VibeAI HRI] ✅ postMessage listener registered (listening for VIBEAI_THREAD_UPDATE)');
  } else {
    console.warn('[VibeAI HRI] ⚠️ postMessage listener already registered, skipping duplicate');
  }

  document.addEventListener('vibeai:threadUpdate', (e) => {
    if (window.VIBEAI_HUD_DEBUG) console.log('[VibeAI HRI] 📨 threadUpdate event received', { count: e?.detail?.count, hasThreads: Array.isArray(e?.detail?.threads) });
    if (e.detail && e.detail.content) {
      updateHRIBridge(e.detail.content);
      const target = ENABLE_HUGO_ORB ? 'Hugo Orb' : 'Canvas';
      if (window.VIBEAI_HUD_DEBUG) console.log(`[VibeAI HRI] 🔄 ${target} updated from ${e.detail.platform} (${e.detail.count} messages)`);
    } else {
      console.warn('[VibeAI HRI] ⚠️ threadUpdate event missing content', e.detail);
    }
  }, { capture: true });
  console.log('[VibeAI HRI] ✅ Dynamic thread monitoring active (8s interval, capture mode)');

  // DEBUG FIX (v2.14.0): Expose safe debug hooks for testing
  if (window.VIBEAI_HUD_DEBUG) {
    window.__VIBEAI_DEBUG__ = window.__VIBEAI_DEBUG__ || {};
    window.__VIBEAI_DEBUG__.forceHRI = (text) => {
      console.log('[DEBUG] Manual HRI update triggered');
      updateHRIBridge(text || 'This is a test message for debugging HRI pipeline.');
    };
    window.__VIBEAI_DEBUG__.getLast = () => ({
      hri: window.VIBEAI_LAST_HRI,
      tone: window.VIBEAI_LAST_TONE,
      score: window.VIBEAI_LAST_SCORE
    });
    window.__VIBEAI_DEBUG__.dispatchTest = () => {
      document.dispatchEvent(new CustomEvent('vibeai:threadUpdate', {
        detail: {
          content: 'Test message for HRI debugging',
          count: 1,
          platform: 'debug'
        },
        bubbles: true,
        composed: true
      }));
    };

    // v2.14.1 FIX #6: Hugo Orb diagnostic helper
    window.__VIBEAI_DEBUG_ORB__ = () => ({
      hasOrb: !!window.hugoOrb,
      hasUpdateMethod: !!(window.hugoOrb && typeof window.hugoOrb.updateState === 'function'),
      lastHRI: window.VIBEAI_LAST_HRI,
      lastTone: window.VIBEAI_LAST_TONE,
      hasPendingState: !!window.__VIBEAI_PENDING_ORB_STATE__,
      listenerRegistered: window.__VIBEAI_MESSAGE_LISTENER_REGISTERED__
    });

    console.log('[VibeAI DEBUG] 🔧 Debug hooks available: __VIBEAI_DEBUG__.forceHRI(), .getLast(), .dispatchTest(), __VIBEAI_DEBUG_ORB__()');
  }

  console.log('[VibeAI UniHUD] ✅ Unified HUD Container injected');
  return hud;
}

// Ensure there's a foldspace canvas element available (pre-injected placeholder)
function ensureCanvasLayer() {
  try {
    if (document.getElementById('foldspace-canvas')) return;
    const canvas = document.createElement('div');
    canvas.id = 'foldspace-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483646; /* just under the HUD */
      display: block;
    `;
    // Keep it empty for now; real canvas will be injected later by FoldSpaceCanvas when re-integrated
    document.body.appendChild(canvas);
    console.log('[VibeAI UniHUD] ✅ Pre-injected foldspace-canvas placeholder');
  } catch { /* best-effort */ }
}

/**
 * Public injector with optional MutationObserver fallback for hosts that re-render (e.g., ChatGPT)
 * options: { observer: boolean }
 */
function injectUnifiedHUD(options = { observer: true }) {
  try {
    // Inject-once guard: avoid duplicate mounts during SPA reinjection
    try { window.__VIBEAI__ = window.__VIBEAI__ || {}; } catch (e) { window.__VIBEAI__ = {}; }

    if (window.__VIBEAI__.hudMounted) {
      console.log('[VibeAI HUD] mount skipped (already mounted)');
      return document.getElementById('vibeai-unified-hud');
    }

    if (window.__VIBEAI__.hudMounting) {
      console.log('[VibeAI HUD] mount skipped (mounting in progress)');
      return document.getElementById('vibeai-unified-hud') || null;
    }

    // Indicate mount in progress to avoid race conditions
    window.__VIBEAI__.hudMounting = true;

    // Prefer stable body mount to avoid React overwrites
    if (document.getElementById('vibeai-unified-hud')) {
      // Another context created the HUD between our checks
      window.__VIBEAI__.hudMounted = true;
      window.__VIBEAI__.hudMounting = false;
      return document.getElementById('vibeai-unified-hud');
    }

    const hud = renderHUDContainer();
    // Mark success
    try { window.__VIBEAI__.hudMounted = true; window.__VIBEAI__.hudMounting = false; } catch (e) {}

    // Only enable reinjection observer on ChatGPT by default to avoid unnecessary overhead on other platforms
    try {
      const shouldObserve = Boolean(options && options.observer) && PLATFORM === 'chatgpt';
      if (shouldObserve && !window.__vibeai_unified_observer_set) {
        const observer = new MutationObserver(() => {
          try {
            if (!document.getElementById('vibeai-unified-hud')) {
              console.warn('[VibeAI UniHUD] HUD removed from DOM — reinjecting');
              // reinject via unified API so observer can be enabled when needed
              injectUnifiedHUD();
            }
          } catch { /* ignore */ }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.__vibeai_unified_observer_set = true;
        window.__vibeai_unified_observer = observer;
        console.log('[VibeAI UniHUD] MutationObserver enabled for reinjection (ChatGPT)');
      }
    } catch { /* ignore observer errors */ }

    // Show first-time onboarding hint after HUD is mounted
    setTimeout(() => {
      showFirstTimeHint();
    }, 500);

    return hud;
  } catch (err) {
    console.error('[VibeAI UniHUD] injectUnifiedHUD failed', err);
    return null;
  }
}

// Expose a global for other scripts to call if module exports are not used
try { window.injectUnifiedHUD = injectUnifiedHUD; } catch { /* ignore */ }

// Global click-to-scroll handler to support Claude-style message anchors
document.addEventListener('click', (e) => {
  try {
    const item = e.target.closest('.hud-thread-item, .vibeai-thread-card');
    if (!item) return;

    // Prefer data-message-id (Claude) then fallback to data-thread-id
    const messageId = item.dataset.messageId;
    const threadId = item.getAttribute('data-thread-id') || item.dataset.threadId;

    if (messageId) {
      const target = document.querySelector(`[data-message-id="${messageId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    if (threadId) {
      // Delegate to existing scrollToThread logic which accepts our thread ids
      try { scrollToThread(threadId); } catch { /* ignore */ }
    }
  } catch (err) {
    console.warn('[VibeAI UniHUD] click-to-scroll handler error', err);
  }
});

// 2. Inject scoped CSS
function injectHUDStyles() {
  if (document.getElementById('vibeai-unified-hud-styles')) return;

  const style = document.createElement('style');
  style.id = 'vibeai-unified-hud-styles';
  style.textContent = `
    :root {
      --vibeai-hud-bg-alpha: 0.55;
      --vibeai-hud-blur: 14px;
      --vibeai-hud-shadow-opacity: 0.35;
    }

    /* Theme: Dark Mode (default) */
    .theme-dark {
      --vibeai-hud-bg: rgba(15, 23, 42, 0.55);
      --vibeai-hud-text: #ffffff;
      --vibeai-hud-border: rgba(0, 212, 255, 0.4);
      --vibeai-hud-shadow: rgba(0, 0, 0, 0.35);
      --vibeai-hud-header-bg: linear-gradient(135deg, rgba(0,0,0,0.25), rgba(0,0,0,0.15));
      --vibeai-hud-footer-bg: linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.25));
      --vibeai-thread-bg: rgba(255, 255, 255, 0.03);
      --vibeai-thread-hover-bg: rgba(255, 255, 255, 0.08);
      --vibeai-thread-text: rgba(255, 255, 255, 0.9);
      --vibeai-thread-meta: rgba(255, 255, 255, 0.5);
      --vibeai-orb-subtitle: rgba(255, 255, 255, 0.65);
      --vibeai-tone-label: rgba(255, 255, 255, 0.95);
      --vibeai-empty-message: #999999;
      --vibeai-button-text: #ffffff;
    }

    /* Theme: Light Mode */
    .theme-light {
      --vibeai-hud-bg: rgba(255, 255, 255, 0.92);
      --vibeai-hud-text: #1a1a1a;
      --vibeai-hud-border: rgba(0, 170, 255, 0.6);
      --vibeai-hud-shadow: rgba(0, 0, 0, 0.2);
      --vibeai-hud-header-bg: linear-gradient(135deg, rgba(0, 170, 255, 0.12), rgba(0, 212, 255, 0.08));
      --vibeai-hud-footer-bg: linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.08));
      --vibeai-thread-bg: rgba(0, 0, 0, 0.04);
      --vibeai-thread-hover-bg: rgba(0, 170, 255, 0.12);
      --vibeai-thread-text: rgba(0, 0, 0, 0.9);
      --vibeai-thread-meta: rgba(0, 0, 0, 0.6);
      --vibeai-orb-subtitle: rgba(0, 0, 0, 0.7);
      --vibeai-tone-label: rgba(0, 0, 0, 0.9);
      --vibeai-empty-message: #555555;
      --vibeai-button-text: #1a1a1a;
    }

    .vibeai-btn {
      padding: 6px 12px;
      background: rgba(0, 170, 255, 0.15);
      color: #00d4ff;
      border: 1px solid rgba(0, 170, 255, 0.3);
      border-radius: 6px;
      font-size: 0.75em;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .vibeai-btn:hover {
      background: rgba(0, 170, 255, 0.25);
      border-color: rgba(0, 170, 255, 0.5);
      transform: scale(1.05);
    }
    .vibeai-icon-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      background: rgba(0, 170, 255, 0.15);
      color: #00d4ff;
      border: 1px solid rgba(0, 170, 255, 0.3);
      border-radius: 6px;
      font-size: 1em;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .vibeai-icon-btn:hover {
      background: rgba(0, 170, 255, 0.25);
      border-color: rgba(0, 170, 255, 0.5);
      transform: scale(1.1);
    }
    .hud-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      width: 100%;
    }
    .hud-button-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
    }
    .hud-button {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(0,170,255,0.12);
      padding: 6px 8px;
      font-size: 0.82em;
      border-radius: 8px;
      color: var(--vibeai-button-text);
      cursor: pointer;
      transition: background 0.12s ease, transform 0.08s ease, color 0.3s ease;
      white-space: nowrap;
    }
    .hud-button:hover {
      background: rgba(255,255,255,0.12);
      transform: translateY(-1px);
    }
    /* Footer button hover effects */
    .footer-btn:hover,
    #vibeai-consent:hover,
    #vibeai-privacy:hover,
    #vibeai-report-bug:hover {
      background: rgba(0, 212, 255, 0.15) !important;
      transform: translateY(-1px);
    }
    #vibeai-theme-toggle:hover {
      transform: scale(1.1);
    }
    #vibeai-coach-btn:hover {
      background: rgba(255,255,255,0.2) !important;
      transform: translateY(-1px);
    }
    #vibeai-coach-btn.highlight {
      background: linear-gradient(135deg, #ff6b6b, #feca57) !important;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(254, 202, 87, 0.7); }
      50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(254, 202, 87, 0); }
    }
      /* Tile icon image + emoji fallback handling */
      .foldspace-tile-icon {
        width: 28px;
        height: 28px;
        object-fit: contain;
        display: block;
      }
      .foldspace-tile-symbol {
        display: none; /* shown only when image fails (onerror toggles) */
      }
        /* Mini cluster icons + emoji fallback */
        .foldspace-mini-icon {
          width: 18px;
          height: 18px;
          object-fit: contain;
          display: inline-block;
          vertical-align: middle;
        }
        .foldspace-mini-fallback-symbol {
          display: none;
          font-size: 14px;
          line-height: 14px;
          vertical-align: middle;
        }
    .vibeai-thread-card {
      margin: 3px 0;
      padding: 5px 7px;
      background: var(--vibeai-thread-bg);
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 2px solid transparent;
    }
    .vibeai-thread-card:hover {
      background: var(--vibeai-thread-hover-bg);
      border-left-color: #00aaff;
      transform: translateX(3px);
      box-shadow: 0 4px 12px rgba(0, 170, 255, 0.2);
    }
    .vibeai-thread-card .title {
      font-weight: 600;
      font-size: 0.75em;
      margin-bottom: 1px;
      color: var(--vibeai-thread-text);
      line-height: 1.15;
    }
    .vibeai-thread-card .preview {
      font-size: 0.68em;
      line-height: 1.2;
      color: var(--vibeai-thread-meta);
      margin-bottom: 1px;
    }
    .vibeai-thread-card .meta {
      font-size: 0.62em;
      color: var(--vibeai-thread-meta);
      font-style: italic;
      line-height: 1.1;
    }
    #vibeai-thread-feed-unified::-webkit-scrollbar {
      width: 6px;
    }
    #vibeai-thread-feed-unified::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }
    #vibeai-thread-feed-unified::-webkit-scrollbar-thumb {
      background: rgba(0, 170, 255, 0.3);
      border-radius: 10px;
    }
    #vibeai-thread-feed-unified::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 170, 255, 0.5);
    }

    /* 🌗 Theme Toggle Button */
    #vibeai-theme-toggle:hover {
      transform: scale(1.15) rotate(15deg);
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    }

    /* Coherence Pulse Animation (on theme switch) */
    @keyframes coherence-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }

    .theme-switching .foldspace-tile {
      animation: coherence-pulse 0.6s ease-in-out;
    }

    /* Smooth theme transitions */
    #vibeai-unified-hud,
    .foldspace-tile,
    .vibeai-thread-card,
    .vibeai-btn {
      transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                  color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                  box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                  border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;
  document.head.appendChild(style);
  console.log('[VibeAI UniHUD] ✅ Styles injected');
}

// 3. Event listeners
function attachEventListeners() {
  // Pre-Phase A: Removed reanalyze button (auto-scan every 8s makes manual reanalyze unnecessary)
  const toggleCanvasBtn = document.getElementById('vibeai-toggle-canvas');
  const closeBtn = document.getElementById('vibeai-close-hud');
  const consentBtn = document.getElementById('vibeai-consent');
  const privacyBtn = document.getElementById('vibeai-privacy');
  const reportBugBtn = document.getElementById('vibeai-report-bug');
  const themeToggleBtn = document.getElementById('vibeai-theme-toggle');
  const coachBtn = document.getElementById('vibeai-coach-btn');

  if (toggleCanvasBtn) {
    let hudMinimized = false;
    toggleCanvasBtn.addEventListener('click', () => {
      const hud = document.getElementById('vibeai-unified-hud');
      if (hud) {
        hudMinimized = !hudMinimized;

        if (hudMinimized) {
          // Minimize: collapse to bottom tab
          hud.style.width = '200px';
          hud.style.height = '52px';
          hud.style.maxHeight = '52px';
          hud.style.top = 'auto';
          hud.style.bottom = '24px';
          hud.style.right = '24px';
          hud.style.transform = 'none';
          hud.style.borderRadius = '26px';
          hud.style.overflow = 'hidden';

          // Hide all content except header
          const utils = document.getElementById('vibeai-utils');
          const canvas = document.getElementById('vibeai-foldspace-header');
          const threadFeed = document.getElementById('vibeai-thread-feed-unified');
          const footer = document.getElementById('vibeai-hud-footer');
          const headerTitle = document.getElementById('vibeai-header-title');
          const closeBtn = document.getElementById('vibeai-close-hud');

          if (utils) utils.style.display = 'none';
          if (canvas) canvas.style.display = 'none';
          if (threadFeed) threadFeed.style.display = 'none';
          if (footer) footer.style.display = 'none';
          if (closeBtn) closeBtn.style.display = 'none';

          // Phase VIII.0: Pause Hugo Orb animation when minimized
          if (ENABLE_HUGO_ORB && window.hugoOrb) {
            window.hugoOrb.stop();
          }

          // Show "VibeAI" text in minimized mode
          if (headerTitle) {
            headerTitle.style.display = 'block';
            headerTitle.style.flex = '1';
            headerTitle.style.textAlign = 'left';
            headerTitle.innerHTML = '<div style="font-size: 0.95em; font-weight: bold; color: #00d4ff; letter-spacing: 1px;">VibeAI</div>';
          }

          toggleCanvasBtn.textContent = '□';
          toggleCanvasBtn.style.fontSize = '20px';
          toggleCanvasBtn.style.background = 'rgba(0, 170, 255, 0.3)';
          toggleCanvasBtn.style.color = '#00d4ff';
          toggleCanvasBtn.title = 'Maximize HUD';
          console.log('[VibeAI UniHUD] HUD minimized to bottom tab');
        } else {
          // Maximize: restore full HUD
          hud.style.width = '360px';
          hud.style.height = 'auto';
          hud.style.maxHeight = '85vh';
          hud.style.top = '50%';
          hud.style.bottom = 'auto';
          hud.style.right = '20px';
          hud.style.transform = 'translateY(-50%)';
          hud.style.borderRadius = '16px';
          hud.style.overflow = 'visible';

          // Show all content
          const utils = document.getElementById('vibeai-utils');
          const canvas = document.getElementById('vibeai-foldspace-header');
          const threadFeed = document.getElementById('vibeai-thread-feed-unified');
          const footer = document.getElementById('vibeai-hud-footer');
          const headerTitle = document.getElementById('vibeai-header-title');
          const closeBtn = document.getElementById('vibeai-close-hud');

          if (utils) utils.style.display = 'flex';
          if (canvas) canvas.style.display = 'flex';
          if (threadFeed) threadFeed.style.display = 'block';
          if (footer) footer.style.display = 'flex';
          if (closeBtn) closeBtn.style.display = 'block';

          // Phase VIII.0: Resume Hugo Orb animation when maximized
          if (ENABLE_HUGO_ORB && window.hugoOrb) {
            window.hugoOrb.start();
          }

          // Restore original title
          if (headerTitle) {
            headerTitle.style.display = 'block';
            headerTitle.style.flex = '1';
            headerTitle.style.textAlign = 'center';
            headerTitle.innerHTML = '<div style="font-size: 1.15em; font-weight: bold; color: #00d4ff; letter-spacing: 1.5px;">VibeAI Thread Inspector</div>';
          }

          toggleCanvasBtn.textContent = '—';
          toggleCanvasBtn.style.fontSize = '18px';
          toggleCanvasBtn.style.background = '';
          toggleCanvasBtn.style.color = '';
          toggleCanvasBtn.title = 'Minimize HUD';
          console.log('[VibeAI UniHUD] HUD maximized');
        }
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const hud = document.getElementById('vibeai-unified-hud');
      if (hud) {
        hud.style.display = 'none';
        console.log('[VibeAI UniHUD] HUD hidden');

        // Run registered cleanup functions (remove listeners, intervals, observers)
        try {
          runCleanup();
        } catch (e) { console.warn('[VibeAI HUD] runCleanup failed', e); }

        // Phase VIII.0: Cleanup Hugo Orb on close
        // v2.14.1 FIX #1: Use window.hugoOrb reference
        if (ENABLE_HUGO_ORB && window.hugoOrb) {
          try { window.hugoOrb.destroy(); } catch (e) { console.warn('hugoOrb.destroy error', e); }
          try { window.hugoOrb = null; } catch (e) {}
          console.log('[VibeAI HUD] 🧹 Hugo Orb cleaned up');
        }

        // Legacy: Cleanup FoldSpace canvas on close
        if (foldSpaceCanvas) {
          try { foldSpaceCanvas.destroy(); } catch (e) { console.warn('foldSpaceCanvas.destroy error', e); }
          foldSpaceCanvas = null;
        }
      }
    });
  }

  if (consentBtn) {
    consentBtn.addEventListener('click', () => {
      console.log('[VibeAI UniHUD] 📋 Consent clicked - showing consent modal');
      showConsentModal();
    });
  }

  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
      console.log('[VibeAI UniHUD] 🔒 Privacy clicked - opening privacy statement');
      showPrivacyModal();
    });
  }

  if (reportBugBtn) {
    reportBugBtn.addEventListener('click', () => {
      console.log('[VibeAI UniHUD] 🐛 Report Bug clicked');
      window.open('https://github.com/TNL-Origin/hugonomy-foldspace/issues/new', '_blank');
    });
  }

  // Theme toggle button
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      toggleTheme();
      // Update button icon
      themeToggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
      themeToggleBtn.title = `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`;
    });
  }

  // Phase VIII.1 Coach: Coach button opens Lexicon Panel
  if (coachBtn) {
    coachBtn.addEventListener('click', () => {
      console.log('[VibeAI Coach] 🧠 Opening Coach Lexicon Panel...');

      // Remove highlight when clicked
      coachBtn.classList.remove('highlight');

      // Wire to VibeCoach
      if (window.VibeCoach && typeof window.VibeCoach.showLexiconPanel === 'function') {
        window.VibeCoach.showLexiconPanel();
      } else {
        console.warn('[VibeAI Coach] Coach not loaded yet');
      }
    });

    // Expose function to highlight button when coaching triggers
    window.highlightCoachButton = () => {
      if (coachBtn) {
        coachBtn.classList.add('highlight');
        // Auto-remove highlight after 5 seconds
        setTimeout(() => {
          coachBtn.classList.remove('highlight');
        }, 5000);
      }
    };
  }

    // --- HUD Drag & Resize Handlers (user sovereignty) ---
    try {
      const headerElem = document.getElementById('vibeai-hud-header');
      const hudEl = document.getElementById('vibeai-unified-hud');
      if (headerElem && hudEl) {
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        headerElem.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return; // only left button
          isDragging = true;
          const rect = hudEl.getBoundingClientRect();
          dragOffsetX = e.clientX - rect.left;
          dragOffsetY = e.clientY - rect.top;
          headerElem.style.cursor = 'grabbing';
          e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          requestAnimationFrame(() => {
            const newX = e.clientX - dragOffsetX;
            const newY = e.clientY - dragOffsetY;
            const maxX = Math.max(0, window.innerWidth - hudEl.offsetWidth);
            const maxY = Math.max(0, window.innerHeight - hudEl.offsetHeight);
            hudEl.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
            hudEl.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
            hudEl.style.right = 'auto';
            hudEl.style.transform = 'none';
          });
        });

        document.addEventListener('mouseup', () => {
          if (!isDragging) return;
          isDragging = false;
          headerElem.style.cursor = 'move';
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({
                vibeai_hud_position_x: hudEl.style.left,
                vibeai_hud_position_y: hudEl.style.top
              });
            }
          } catch (e) { /* ignore */ }
        });

        // Resize handles
        const resizeHandleRight = document.createElement('div');
        resizeHandleRight.className = 'vibeai-resize-handle-right';
        resizeHandleRight.style.cssText = `
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          cursor: ew-resize;
          background: transparent;
          z-index: 2147483649;
        `;

        const resizeHandleBottom = document.createElement('div');
        resizeHandleBottom.className = 'vibeai-resize-handle-bottom';
        resizeHandleBottom.style.cssText = `
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 8px;
          cursor: ns-resize;
          background: transparent;
          z-index: 2147483649;
        `;

        hudEl.appendChild(resizeHandleRight);
        hudEl.appendChild(resizeHandleBottom);

        let isResizing = false;
        let resizeDir = null;

        resizeHandleRight.addEventListener('mousedown', (e) => {
          isResizing = true;
          resizeDir = 'right';
          e.preventDefault();
        });

        resizeHandleBottom.addEventListener('mousedown', (e) => {
          isResizing = true;
          resizeDir = 'bottom';
          e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
          if (!isResizing) return;
          requestAnimationFrame(() => {
            if (resizeDir === 'right') {
              const newWidth = Math.max(300, Math.min(600, e.clientX - hudEl.getBoundingClientRect().left));
              hudEl.style.width = newWidth + 'px';
            }
            if (resizeDir === 'bottom') {
              const newHeight = Math.max(400, Math.min(900, e.clientY - hudEl.getBoundingClientRect().top));
              hudEl.style.height = newHeight + 'px';
            }
          });
        });

        document.addEventListener('mouseup', () => {
          if (!isResizing) return;
          isResizing = false;
          resizeDir = null;
          try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({
                vibeai_hud_width: hudEl.style.width,
                vibeai_hud_height: hudEl.style.height
              });
            }
          } catch (e) { /* ignore */ }
        });
      }
    } catch (e) {
      console.warn('[VibeAI UniHUD] Drag/resize init failed', e);
    }

  // Phase VIII.0 Fix: Opacity slider binding removed - handled by initHudOpacity() in hud-opacity-controller.js
  // This prevents duplicate event listeners and ensures single source of truth for opacity control
}

// 4. Update thread feed
function updateThreadFeed(threads) {
  const feedEl = document.getElementById('vibeai-thread-feed-unified') || document.getElementById('vibeai-thread-feed');
  if (!feedEl) return;

  if (!threads || threads.length === 0) {
    feedEl.innerHTML = `<p style="text-align: center; color: #999; padding: 30px 20px; font-style: italic;">🧠 No threads detected yet. <br><small style="display: block; margin-top: 8px; font-size: 0.9em; opacity: 0.6;">Start chatting to see AI-analyzed threads appear here.</small></p>`;
    return;
  }

  // Phase VIII.0: Update HRI Bridge with latest thread
  if (threads.length > 0) {
    const latest = threads[threads.length - 1];
    if (latest && latest.content) {
      updateHRIBridge(latest.content);
    }
  }

  // Helper to render a small FoldSpace mini-canvas showing 1..N mood glyphs for the thread.
  // We intentionally omit textual labels (Resonant/Tense/etc.) to keep the UI visual-only per spec.
  function foldspaceMiniHTML(thread, maxEmojis = 5) {
    // Prefer an explicit emotionalTones array if present: e.g. ['calm','urgent','resonant']
    const tones = Array.isArray(thread.emotionalTones) && thread.emotionalTones.length > 0
      ? thread.emotionalTones.slice(0, maxEmojis)
      : null;

    // Phase VIII.0: Normalize resonance data (supports legacy hugoScore/score fields)
    const normalized = normalizeResonance(thread);
    const hri = normalized.hri;
    const evc = Number(thread.evc ?? NaN);
    const hsvi = Number(thread.hsvi ?? NaN);
    const tag = (thread.tag || thread.source || '').toLowerCase();

    const pickFromMetrics = () => {
      const out = [];
      if (hri !== null) {
        // HRI thresholds: 0.85+ = resonant, 0.60+ = calm, else drift
        if (hri >= 0.85) out.push('resonant');
        else if (hri >= 0.60) out.push('calm');
        else out.push('drift');
      }
      if (!Number.isNaN(hsvi) && hsvi >= 50) out.push('tense');
      if (!Number.isNaN(evc) && evc < 0.3) out.push('dissonant');
      if (tag) out.push(tag);
      return out.slice(0, maxEmojis);
    };

    const mapped = tones && tones.length > 0
      ? tones
      : (thread.tone ? [thread.tone] : pickFromMetrics());

    // Debug: Log what we're rendering for this thread
    if (window.VIBEAI_HUD_DEBUG) console.log(`[Renderer] foldspaceMiniHTML: tones=${JSON.stringify(tones)}, thread.tone=${thread.tone}, mapped=${JSON.stringify(mapped)}`);

    // Map mood keys to representative emoji (aligned with tone strip)
    const moodMap = {
      calm: '🌊',        // Matches tone strip
      urgent: '⚡',      // Matches tone strip
      reflective: '🔮', // Matches tone strip
      dissonant: '⚙️',  // Matches tone strip (Tension)
      resonant: '✨',    // Matches tone strip (Aligned)
      // Legacy/fallback keys
      drift: '🌫️',
      tense: '⚡',
      default: '🌌'
    };

    // Color mapping to match Hugo Orb tone colors (HSL hue values)
    const toneColors = {
      calm: 'hsl(190, 70%, 55%)',        // Cyan-blue (tranquil waters)
      urgent: 'hsl(25, 80%, 55%)',       // Orange-red (alert, action)
      reflective: 'hsl(270, 60%, 60%)',  // Purple (introspection)
      dissonant: 'hsl(0, 20%, 50%)',     // Red-gray (tension)
      resonant: 'hsl(150, 60%, 55%)',    // Teal-green (harmony)
      drift: 'hsl(200, 20%, 60%)',
      tense: 'hsl(25, 80%, 55%)',
      default: 'hsl(230, 30%, 50%)'
    };

    const emojis = (mapped && mapped.length) ? mapped : ['default'];

    const containerStyle = 'display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;width:68px;height:48px;border-radius:8px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));padding:6px;margin-right:8px;flex:0 0 auto;';

    // Render up to maxEmojis as a small cluster of native emoji with color-coded backgrounds
    const items = (emojis.slice(0, maxEmojis)).map(k => {
      const key = (k || 'default').toLowerCase();
      const emoji = moodMap[key] || moodMap.default;
      const bgColor = toneColors[key] || toneColors.default;
      return `<span class="foldspace-mini-emoji" role="img" aria-label="${key}" ` +
               `style="display:inline-flex;align-items:center;justify-content:center;` +
               `font-size:20px;width:24px;height:24px;` +
               `background:${bgColor};` +
               `border-radius:4px;` +
               `text-shadow:0 1px 3px rgba(0,0,0,0.3);` +
               `filter:drop-shadow(0 1px 2px rgba(0,0,0,0.25));` +
               `transition:transform 0.2s ease;">` +
               `${emoji}</span>`;
    }).join('');

    return `<div class="foldspace-mini" title="Mood" style="${containerStyle}">${items}</div>`;
  }

  feedEl.innerHTML = threads.map(t => {
    // SECURITY: Escape all user-sourced content to prevent XSS
    const rawTitle = t.title || autoTitle(t.content);
    const rawPreview = (t.content || '').slice(0, 100);
    const rawSource = t.source || 'unknown';
    const rawThreadId = t.id || '';
    const rawTimestamp = t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '';

    const title = escapeHtml(rawTitle);
    const preview = escapeHtml(rawPreview);
    const source = escapeHtml(rawSource);
    const threadId = escapeHtml(rawThreadId);
    const timestamp = escapeHtml(rawTimestamp);

    const foldMini = foldspaceMiniHTML(t, 5);

    return `<div class='vibeai-thread-card' data-thread-id='${threadId}' style='cursor: pointer; display:flex; gap:8px; align-items:flex-start;'>
              ${foldMini}
              <div style='flex:1'>
                <div class='title'>${title}</div>
                <div class='preview'>${preview}…</div>
                <div class='meta'>${source} • ${timestamp}</div>
              </div>
            </div>`;
  }).join('');

  // Add click-to-scroll event listeners
  feedEl.querySelectorAll('.vibeai-thread-card').forEach(card => {
    card.addEventListener('click', () => {
      const threadId = card.getAttribute('data-thread-id');
      scrollToThread(threadId);
    });
  });

  console.log(`[VibeAI UniHUD] ✅ Rendered ${threads.length} threads`);
}

// Helper: auto-title from first 5 words
function autoTitle(content) {
  if (!content) return 'Untitled Thread';
  const words = content.trim().split(/\s+/).slice(0, 5);
  return words.join(' ') + (content.split(/\s+/).length > 5 ? '...' : '');
}

// Scroll to thread on click
function scrollToThread(threadId) {
  console.log(`[VibeAI UniHUD] 🎯 Scrolling to thread: ${threadId}`);

  // Detect platform
  const _HOSTNAME = window.location.hostname;
  const platform = threadId.split('-')[0];

  // Extract index from thread ID (format: "platform-index")
  const match = threadId.match(/-(\d+)$/);
  if (!match) {
    console.warn(`[VibeAI UniHUD] ⚠️ Invalid thread ID format: ${threadId}`);
    return;
  }

  const index = parseInt(match[1], 10);
  let targetElement = null;

  // Get the corresponding DOM node based on platform
  if (platform === 'chatgpt') {
    const nodes = document.querySelectorAll('.markdown, .text-base');
    targetElement = nodes[index];
  } else if (platform === 'gemini') {
    const nodes = document.querySelectorAll('[data-message-content], article, .response-container');
    targetElement = nodes[index];
  } else if (platform === 'copilot') {
    const nodes = document.querySelectorAll(
      '.ac-textBlock, .cib-message-content, [class*="message"], [class*="response-message"], [data-content], .text-message-content'
    );
    targetElement = nodes[index];
  } else if (platform === 'claude') {
    // Use centralized selector list for easier updates
    const nodes = document.querySelectorAll(CLAUDE_SELECTORS.join(', '));
    targetElement = nodes[index];
  }

  if (targetElement) {
    // Scroll to element
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    // Add highlight effect
    targetElement.style.setProperty('outline', '3px solid #00d4ff', 'important');
    targetElement.style.setProperty('background-color', 'rgba(0, 212, 255, 0.1)', 'important');
    targetElement.style.setProperty('border-radius', '8px', 'important');
    targetElement.style.setProperty('transition', 'all 0.3s ease', 'important');

    console.log(`[VibeAI UniHUD] ✅ Scrolled to thread: ${threadId}`);

    // Remove highlight after 2 seconds
    setTimeout(() => {
      targetElement.style.removeProperty('outline');
      targetElement.style.removeProperty('background-color');
      targetElement.style.removeProperty('border-radius');
      console.log(`[VibeAI UniHUD] 🌊 Highlight faded: ${threadId}`);
    }, 2000);
  } else {
    console.warn(`[VibeAI UniHUD] ⚠️ Thread element not found: ${threadId} (index: ${index})`);
  }
}

// 5. Listen to storage changes (guarded for non-extension environments)
// DISABLED v2.14.2: Legacy storage listener conflicts with postMessage enriched threads
// The postMessage bridge (line 1971) now sends enriched threads with tone data.
// Storage-based updates would overwrite with legacy threads lacking emotionalTones/tone properties.
// if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
//   chrome.storage.onChanged.addListener((changes) => {
//     if (changes.lastThreads && changes.lastThreads.newValue) {
//       updateThreadFeed(changes.lastThreads.newValue);
//     }
//   });
// }

// 5.5 First-Time Onboarding Hint
function showFirstTimeHint() {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      console.warn('[VibeAI] chrome.storage.local not available for first-time hint.');
      return;
    }
  } catch (e) {
    console.warn('[VibeAI] chrome.storage.local check failed:', e);
    return;
  }

  // DEBUG FIX (v2.14.1): Session-based display - shows on every new page load
  // Show on every page until dismissed (per session, not permanent)
  if (window.__vibeai_onboard_shown) {
    // Already shown this session, skip
    return;
  }
  window.__vibeai_onboard_shown = true;

  // Render the onboarding hint
  renderOnboardingHint();
}

function renderOnboardingHint() {

  // Make sure HUD exists before attaching hint
  const hudRoot = document.getElementById('vibeai-unified-hud');
  if (!hudRoot) {
    console.warn('[VibeAI] HUD root not found, cannot show first-time hint.');
    return;
  }

  // Create popover container
  const hint = document.createElement('div');
  hint.id = 'vibeai-first-time-hint';
  hint.style.cssText = `
    position: fixed;
    top: 50%;
    right: 400px;
    transform: translateY(-50%);
    z-index: 2147483646;
    max-width: 280px;
    background: linear-gradient(135deg, #1f2933 0%, #111827 40%, #0f766e 100%);
    color: #f9fafb;
    padding: 16px 18px;
    border-radius: 14px;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    line-height: 1.5;
    border: 1px solid rgba(34, 211, 238, 0.55);
    backdrop-filter: blur(10px);
    animation: vibeai-slide-in 0.25s ease-out;
  `;

  hint.innerHTML = `
    <div style="font-size: 15px; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
      <span style="font-size: 18px;">👋</span>
      <span>Welcome to VibeAI</span>
    </div>
    <div style="margin-bottom: 10px; line-height: 1.5;">
      <strong>VibeAI</strong> tracks the <strong>emotional tone</strong> of your AI conversations in real-time, helping you <strong>communicate clearly</strong> and <strong>improve your prompts</strong> before frustration sets in.
      <br><br>
      <div style="margin-top: 10px; padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; border-left: 3px solid rgba(34, 211, 238, 0.7);">
        <div style="font-weight: 600; margin-bottom: 6px; opacity: 0.95;">Features:</div>
        <div style="font-size: 12px; opacity: 0.85; line-height: 1.7;">
          <div><strong>📊 Live Mood Tracking:</strong> See emotional patterns as you chat</div>
          <div style="margin-top: 4px;"><strong>🧠 Coach:</strong> Get post-send tips to improve urgent/confused prompts</div>
          <div style="margin-top: 4px;"><strong>📚 Prompt Library:</strong> Copy proven templates for better responses</div>
          <div style="margin-top: 4px;"><strong>🎓/💼 Tone Switch:</strong> Student-friendly or professional language</div>
        </div>
      </div>
      <br>
      <span style="opacity: 0.85; font-size: 13px;">💡 <strong>Tip:</strong> Drag any panel header to reposition. Click 🧠 Coach for the full prompt library.</span>
    </div>
    <button id="vibeai-first-time-hint-btn"
      style="
        width: 100%;
        margin-top: 4px;
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.7);
        background: rgba(15, 23, 42, 0.6);
        color: #e5e7eb;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
      "
      onmouseover="this.style.background='rgba(34, 211, 238, 0.15)'; this.style.borderColor='rgba(34, 211, 238, 0.9)';"
      onmouseout="this.style.background='rgba(15, 23, 42, 0.6)'; this.style.borderColor='rgba(148, 163, 184, 0.7)';">
      Got it
    </button>
  `;

  // Append to body (not inside HUD so it floats nearby)
  document.body.appendChild(hint);

  function dismissHint() {
    // DEBUG FIX (v2.14.1): Session-based dismissal - will show again on next page load
    const el = document.getElementById('vibeai-first-time-hint');
    if (el && el.parentElement) {
      el.parentElement.removeChild(el);
    }
    console.log('[VibeAI UniHUD] ✅ Onboarding dismissed (will show again on next page)');
  }

  const btn = document.getElementById('vibeai-first-time-hint-btn');
  if (btn) {
    btn.addEventListener('click', dismissHint);
  }

  // Pre-Phase A: Remove auto-dismiss - user must click "Got it" to dismiss
  // (Removed 12-second timeout)
}

// Optional: simple keyframes for the slide-in animation
try {
  const styleId = 'vibeai-first-time-hint-anim-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes vibeai-slide-in {
        from {
          opacity: 0;
          transform: translateY(-50%) translateX(12px);
        }
        to {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }
      }

      @keyframes vibeai-orb-glow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
        }
        50% {
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
        }
      }
    `;
    document.head.appendChild(style);
  }
} catch (e) {
  console.warn('[VibeAI] Could not inject first-time hint animation style:', e);
}

// 6. Consent Modal
// v2.14.6: P0 Beta Fix - Event delegation + session-only decline + recovery path

// In-memory session decline flag (fallback if chrome.storage.session unavailable)
let __vibeai_declined_this_session = false;

// Show the "Paused" bar with recovery option
function showPausedBar() {
  if (document.getElementById('vibeai-paused-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'vibeai-paused-bar';
  bar.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(15, 15, 20, 0.95);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 2147483640;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    animation: vibeai-slide-in 0.3s ease;
  `;

  bar.innerHTML = `
    <span style="color: #888; font-size: 13px;">🌀 VibeAI is paused</span>
    <button id="vibeai-paused-enable" style="
      padding: 6px 14px;
      background: rgba(0, 170, 255, 0.25);
      color: #00d4ff;
      border: 1px solid rgba(0, 170, 255, 0.4);
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    ">Enable</button>
    <button id="vibeai-paused-dismiss" style="
      padding: 6px 10px;
      background: transparent;
      color: #666;
      border: none;
      font-size: 14px;
      cursor: pointer;
    ">✕</button>
  `;

  document.body.appendChild(bar);

  // Event delegation for paused bar buttons
  bar.addEventListener('click', (e) => {
    const target = e.target;
    if (target.id === 'vibeai-paused-enable') {
      bar.remove();
      // Clear session decline and show consent modal
      __vibeai_declined_this_session = false;
      try {
        if (chrome?.storage?.session) {
          chrome.storage.session.remove('declinedThisSession');
        }
      } catch (err) { /* ignore */ }
      showConsentModal();
    } else if (target.id === 'vibeai-paused-dismiss') {
      bar.remove();
    }
  });

  console.log('[VibeAI UniHUD] ⏸️ Paused bar displayed');
}

function showConsentModal() {
  if (document.getElementById('vibeai-consent-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'vibeai-consent-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 2147483648;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  `;

  modal.innerHTML = `
    <div class="vibeai-consent-card" style="
      background: rgba(15, 15, 20, 0.95);
      border: 2px solid rgba(0, 212, 255, 0.5);
      border-radius: 16px;
      padding: 32px 40px;
      max-width: 520px;
      box-shadow: 0 0 50px rgba(0, 170, 255, 0.6);
      color: #fff;
    ">
      <div style="font-size: 1.6em; font-weight: bold; color: #00d4ff; letter-spacing: 2px; margin-bottom: 8px; text-align: center;">
        VibeAI: A Mirror for Conversations
      </div>
      <div style="font-size: 0.85em; line-height: 1.6; color: #ccc; margin-bottom: 20px;">
        <p style="margin-bottom: 14px; opacity: 0.9;">
          VibeAI shows conversation resonance in real-time—how aligned an exchange feels as it unfolds.
        </p>
        <p style="margin-bottom: 8px; color: #00d4ff; font-weight: 600; font-size: 0.95em;">What it does:</p>
        <ul style="margin-left: 20px; margin-bottom: 14px; line-height: 1.7;">
          <li>Reflects tone and coherence patterns using <strong>simple keyword matching</strong> (not AI or machine learning)</li>
          <li>Visualizes through the Hugo Orb</li>
          <li>Runs locally in your browser (no external servers, no connection to the LLM you're using)</li>
        </ul>
        <p style="margin-bottom: 8px; color: #00d4ff; font-weight: 600; font-size: 0.95em;">What it doesn't do:</p>
        <ul style="margin-left: 20px; margin-bottom: 14px; line-height: 1.7;">
          <li>Use AI or ML to analyze your conversations</li>
          <li>Communicate with ChatGPT, Claude, Gemini, or any LLM</li>
          <li>Evaluate you or your thinking</li>
          <li>Suggest what to say</li>
          <li>Store or transmit data externally</li>
        </ul>
        <p style="font-size: 0.8em; opacity: 0.65; font-style: italic; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px;">
          <strong>Disclaimer:</strong> This is not a medical, mental health, therapeutic, or diagnostic tool. For informational purposes only.
        </p>
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 0.85em; color: #ccc;">
          <input type="checkbox" id="vibeai-consent-checkbox" style="margin-top: 3px; width: 16px; height: 16px; cursor: pointer;">
          <span>I understand VibeAI is a reflection tool, not an evaluation system.</span>
        </label>
      </div>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="vibeai-consent-accept" disabled style="
          padding: 10px 24px;
          background: rgba(0, 170, 255, 0.3);
          color: #00d4ff;
          border: 2px solid rgba(0, 170, 255, 0.5);
          border-radius: 8px;
          font-size: 1em;
          font-weight: 600;
          cursor: not-allowed;
          opacity: 0.4;
          transition: all 0.2s ease;
        ">Start Reflecting</button>
        <button id="vibeai-consent-decline" style="
          padding: 10px 24px;
          background: rgba(255, 79, 79, 0.2);
          color: #ff4f4f;
          border: 2px solid rgba(255, 79, 79, 0.4);
          border-radius: 8px;
          font-size: 1em;
          cursor: pointer;
          transition: all 0.2s ease;
        ">Maybe Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // v2.14.6: Use EVENT DELEGATION on modal container to fix first-load click race
  // This ensures clicks work even if elements were just inserted
  modal.addEventListener('click', (e) => {
    const target = e.target;

    // Handle checkbox change via click (delegation doesn't catch 'change' but click works)
    if (target.id === 'vibeai-consent-checkbox') {
      // Let the native checkbox behavior happen, then update button state
      setTimeout(() => {
        const checkbox = document.getElementById('vibeai-consent-checkbox');
        const acceptBtn = document.getElementById('vibeai-consent-accept');
        if (checkbox && acceptBtn) {
          if (checkbox.checked) {
            acceptBtn.disabled = false;
            acceptBtn.style.cursor = 'pointer';
            acceptBtn.style.opacity = '1';
          } else {
            acceptBtn.disabled = true;
            acceptBtn.style.cursor = 'not-allowed';
            acceptBtn.style.opacity = '0.4';
          }
        }
      }, 0);
    }

    // Handle Accept button click
    if (target.id === 'vibeai-consent-accept' && !target.disabled) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ consentGiven: true }, () => {
          console.log('[VibeAI UniHUD] ✅ User consent granted');
          modal.remove();
          renderHUDContainer();
          setTimeout(() => { showFirstTimeHint(); }, 500);
        });
      } else {
        try { localStorage.setItem('vibeai_consentGiven', 'true'); } catch (err) { /* ignore */ }
        console.log('[VibeAI UniHUD] ✅ User consent granted (local fallback)');
        modal.remove();
        renderHUDContainer();
        setTimeout(() => { showFirstTimeHint(); }, 500);
      }
    }

    // Handle Decline button click - SESSION-ONLY decline (P0 fix)
    if (target.id === 'vibeai-consent-decline') {
      console.log('[VibeAI UniHUD] ⏸️ User clicked Maybe Later (session-only decline)');

      // Set session-only decline flag (NOT permanent consentGiven:false)
      __vibeai_declined_this_session = true;

      // Try chrome.storage.session first (clears on browser close)
      try {
        if (chrome?.storage?.session) {
          chrome.storage.session.set({ declinedThisSession: true });
        }
      } catch (err) { /* ignore - in-memory flag is the fallback */ }

      modal.remove();

      // Show paused bar with recovery option
      setTimeout(() => { showPausedBar(); }, 300);
    }
  });

  // Also add direct listener as backup for checkbox 'change' event
  const checkbox = document.getElementById('vibeai-consent-checkbox');
  const acceptBtn = document.getElementById('vibeai-consent-accept');
  if (checkbox && acceptBtn) {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        acceptBtn.disabled = false;
        acceptBtn.style.cursor = 'pointer';
        acceptBtn.style.opacity = '1';
      } else {
        acceptBtn.disabled = true;
        acceptBtn.style.cursor = 'not-allowed';
        acceptBtn.style.opacity = '0.4';
      }
    });
  }

  console.log('[VibeAI UniHUD] 📋 Consent modal displayed');
}

// 6b. Privacy Modal
function showPrivacyModal() {
  if (document.getElementById('vibeai-privacy-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'vibeai-privacy-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 2147483648;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  `;

  modal.innerHTML = `
    <div style="
      background: rgba(15, 15, 20, 0.95);
      border: 2px solid rgba(0, 212, 255, 0.5);
      border-radius: 16px;
      padding: 32px 40px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 50px rgba(0, 170, 255, 0.6);
      color: #fff;
    ">
      <div style="font-size: 1.6em; font-weight: bold; color: #00d4ff; letter-spacing: 2px; margin-bottom: 12px; text-align: center;">
        🔒 Privacy Statement
      </div>
      <div style="font-size: 0.95em; color: rgba(0, 212, 255, 0.8); text-align: center; margin-bottom: 24px;">
        VibeAI FoldSpace Extension
      </div>
      <div style="font-size: 0.9em; line-height: 1.6; color: #ccc; margin-bottom: 24px;">
        <h3 style="color: #00d4ff; margin-top: 16px; margin-bottom: 12px;">Data Collection</h3>
        <p style="margin-bottom: 12px;">
          VibeAI FoldSpace <strong>does not collect, transmit, or store any personal data on external servers</strong>.
          All analysis happens locally in your browser.
        </p>

        <h3 style="color: #00d4ff; margin-top: 16px; margin-bottom: 12px;">What We Process</h3>
        <ul style="margin-left: 20px; margin-bottom: 12px;">
          <li>Chat thread messages visible on the current page</li>
          <li>Conversation resonance analysis (HRI algorithm)</li>
          <li>Thread metadata (timestamps, platform detection)</li>
        </ul>

        <h3 style="color: #00d4ff; margin-top: 16px; margin-bottom: 12px;">Local Storage Only</h3>
        <p style="margin-bottom: 12px;">
          All processed data is stored using Chrome's <code style="background: rgba(0, 170, 255, 0.2); padding: 2px 6px; border-radius: 4px;">chrome.storage.local</code> API,
          which remains on your device and is never synchronized or uploaded.
        </p>

        <h3 style="color: #00d4ff; margin-top: 16px; margin-bottom: 12px;">Third-Party Access</h3>
        <p style="margin-bottom: 12px;">
          This extension <strong>does not communicate with any external APIs or servers</strong>.
          No analytics, tracking, or telemetry is performed.
        </p>

        <h3 style="color: #00d4ff; margin-top: 16px; margin-bottom: 12px;">Open Source</h3>
        <p style="margin-bottom: 12px;">
          You can review the complete source code at:
          <a href="https://github.com/TNL-Origin/hugonomy-foldspace" target="_blank" style="color: #00d4ff; text-decoration: underline;">
            github.com/TNL-Origin/hugonomy-foldspace
          </a>
        </p>

        <p style="font-size: 0.85em; opacity: 0.7; font-style: italic; margin-top: 20px;">
          Last updated: January 2025
        </p>
      </div>
      <div style="display: flex; justify-content: center;">
        <button id="vibeai-privacy-close" style="
          padding: 10px 24px;
          background: rgba(0, 170, 255, 0.3);
          color: #00d4ff;
          border: 2px solid rgba(0, 170, 255, 0.5);
          border-radius: 8px;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        ">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button (with null safety)
  const closeBtn = document.getElementById('vibeai-privacy-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.remove();
      console.log('[VibeAI UniHUD] 🔒 Privacy modal closed');
    });
  }

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  console.log('[VibeAI UniHUD] 🔒 Privacy modal displayed');
}

// 7. Initial load (guarded)
// DISABLED v2.14.2: Legacy initial load conflicts with postMessage enriched threads
// The postMessage bridge will send enriched threads once parser scans (within 8s).
// Loading from storage would show stale threads without tone data.
// if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && chrome.storage.local.get) {
//   chrome.storage.local.get(['lastThreads'], (data) => {
//     if (data && data.lastThreads) {
//       updateThreadFeed(data.lastThreads);
//     }
//   });
// } else {
//   // Local fallback (best-effort)
//   try {
//     const raw = localStorage.getItem('vibeai_lastThreads');
//     if (raw) updateThreadFeed(JSON.parse(raw));
//   } catch { /* ignore */ }
// }

// 8. Robust initialization window with consent check + fallback reinjection for ChatGPT
// v2.14.6: Updated to handle session-only decline (P0 fix - no more permanent brick state)
function vibeaiSafeInit() {
  try {
    // First check session decline (in-memory flag or chrome.storage.session)
    if (__vibeai_declined_this_session) {
      console.log('[VibeAI UniHUD] Session decline active, showing paused bar');
      setTimeout(() => { showPausedBar(); }, 1000);
      return;
    }

    // Check chrome.storage.session for decline (if available)
    const checkSessionDecline = new Promise((resolve) => {
      try {
        if (chrome?.storage?.session) {
          chrome.storage.session.get(['declinedThisSession'], (sessionData) => {
            resolve(sessionData?.declinedThisSession === true);
          });
        } else {
          resolve(false);
        }
      } catch (err) {
        resolve(false);
      }
    });

    checkSessionDecline.then((sessionDeclined) => {
      if (sessionDeclined) {
        __vibeai_declined_this_session = true;
        console.log('[VibeAI UniHUD] Session decline found in storage, showing paused bar');
        setTimeout(() => { showPausedBar(); }, 1000);
        return;
      }

      // Now check permanent consent state
      chrome.storage.local.get(['consentGiven'], (data) => {
        if (data.consentGiven === true) {
          // Small delay to avoid race with hydrations; enable observer only on ChatGPT
          setTimeout(() => injectUnifiedHUD({ observer: PLATFORM === 'chatgpt' }), 1000);

          // Extra lightweight reinjection loop for hosts that aggressively wipe the DOM (ChatGPT)
          if (PLATFORM === 'chatgpt' && !window.__vibeai_unified_reinject_interval) {
            let attempts = 0;
            window.__vibeai_unified_reinject_interval = setInterval(() => {
              try {
                if (document.getElementById('vibeai-unified-hud')) {
                  clearInterval(window.__vibeai_unified_reinject_interval);
                  window.__vibeai_unified_reinject_interval = null;
                  return;
                }
                attempts += 1;
                if (attempts > 12) { // ~18s of attempts
                  clearInterval(window.__vibeai_unified_reinject_interval);
                  window.__vibeai_unified_reinject_interval = null;
                  return;
                }
                console.warn('[VibeAI UniHUD] Reinjection poll: HUD missing, attempting inject (ChatGPT)');
                injectUnifiedHUD({ observer: true });
              } catch { /* ignore */ }
            }, 1500);

            // Ensure reinject interval is cleared on cleanup
            registerCleanup(() => {
              try {
                if (window.__vibeai_unified_reinject_interval) {
                  clearInterval(window.__vibeai_unified_reinject_interval);
                  window.__vibeai_unified_reinject_interval = null;
                  dbg('reinjection interval cleared');
                }
              } catch (e) { console.warn('failed clearing reinject interval', e); }
            });
          }

        } else if (data.consentGiven === undefined || data.consentGiven === false) {
          // v2.14.6: Treat both undefined AND false as "show consent modal"
          // This fixes the permanent brick state - false is no longer a dead end
          // If user previously had consentGiven:false, they'll now see the modal again
          setTimeout(() => {
            showConsentModal();
          }, 1000);

          // Clean up any legacy consentGiven:false to prevent confusion
          if (data.consentGiven === false) {
            console.log('[VibeAI UniHUD] Clearing legacy consentGiven:false (P0 fix)');
            try {
              chrome.storage.local.remove('consentGiven');
            } catch (err) { /* ignore */ }
          }
        }
      });
    });
  } catch (err) {
    console.warn('[VibeAI UniHUD] vibeaiSafeInit storage check failed', err);
    // Best-effort: if chrome.storage fails, show consent modal
    setTimeout(() => { showConsentModal(); }, 1000);
  }
}

if (document.readyState === 'complete') {
  // Page already loaded
  vibeaiSafeInit();
} else {
  // Listen for the full load event (includes subresources and hydration in many apps)
  window.addEventListener('load', vibeaiSafeInit);
  // And a fallback in case load never fires or hydration is delayed
  setTimeout(vibeaiSafeInit, 3000);
}

// v1.0 Coach: Initialize post-send coaching (runs after VibeAI HUD is ready)
// Only on supported LLM platforms
if (window.VibeCoach && typeof window.VibeCoach.init === 'function') {
  const coachHosts = new Set([
    'chat.openai.com',
    'chatgpt.com',
    'www.chatgpt.com',
    'gemini.google.com',
    'copilot.microsoft.com',
    'claude.ai'
  ]);
  const shouldInitCoach = coachHosts.has(location.hostname);

  if (shouldInitCoach) {
    setTimeout(() => {
      try {
        const initialized = window.VibeCoach.init();
        if (initialized) {
          console.log('[VibeAI Coach] ✅ Post-send coaching initialized');
        } else {
          console.log('[VibeAI Coach] User declined consent');
        }
      } catch (err) {
        console.warn('[VibeAI Coach] Initialization failed:', err);
      }
    }, 2000); // Wait 2s for page hydration
  }
}

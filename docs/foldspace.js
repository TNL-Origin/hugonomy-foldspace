// docs/foldspace.js
export function initHUD() {
  console.log('[VibeAI HUD] initHUD invoked');

  try {
    // Mount or render your HUD interface
    const root = document.getElementById('root') || document.body;
    const hudDiv = document.createElement('div');
    hudDiv.id = 'vibeai-hud-container';
    hudDiv.innerHTML = `
      <div style="color:#ccc;text-align:center;margin-top:40px;">
        VibeAI HUD Active ✨
      </div>
    `;
    root.appendChild(hudDiv);

    // Send handshake back to host
    try { window.parent.postMessage({ type: 'VIBEAI_RENDER_READY' }, '*'); } catch (e) { console.warn('[VibeAI HUD] handshake failed', e); }
    console.log('[VibeAI HUD] Handshake posted to parent window');
  } catch (err) {
    console.error('[VibeAI HUD] initHUD error:', err);
  }
}

// === Scoped Internal Pointer Restore (vStable-2.4.1-RC1) ===
(function restoreHUDInteractivity() {
  try {
    const applyRestore = () => {
      try {
        // Restore pointer-events and user-select for the HUD document
        document.body.style.setProperty('pointer-events', 'auto', 'important');
        document.body.style.setProperty('user-select', 'auto', 'important');

        // Re-enable common interactive elements
        const selectors = 'button, a, input, select, textarea, canvas, [role="button"]';
        document.querySelectorAll(selectors).forEach(el => {
          try {
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('cursor', 'pointer', 'important');
          } catch (innerErr) { /* best-effort */ }
        });

        console.log('[VibeAI HUD] ✅ Internal pointer-events restored');
      } catch (err) {
        console.warn('[VibeAI HUD] ⚠️ Pointer restore failed', err);
      }
    };

    if (document.readyState === 'complete') {
      applyRestore();
    } else {
      // Use load to ensure all internals (including frames and web components) are ready
      window.addEventListener('load', applyRestore, { once: true });
      // Fallback: DOMContentLoaded as an extra chance
      document.addEventListener('DOMContentLoaded', applyRestore, { once: true });
    }
  } catch (err) {
    console.warn('[VibeAI HUD] Pointer restore initialization failed', err);
  }
})();

// === Persistent Interactivity & Handshake Response (vStable-2.4.3) ===
(function vibeaiHUDInit() {
  try {
    const restore = () => {
      try {
        document.body.style.setProperty('pointer-events', 'auto', 'important');
        const interactive = 'button,a,input,select,textarea,canvas,[role="button"]';
        document.querySelectorAll(interactive).forEach(el => {
          try {
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('cursor', 'pointer', 'important');
          } catch (e) { /* best-effort */ }
        });
      } catch (e) { /* non-fatal */ }
    };

    // Run now and keep running after DOM changes
    if (document.readyState === 'complete') restore();
    else document.addEventListener('DOMContentLoaded', restore, { once: true });

    const mo = new MutationObserver(() => restore());
    mo.observe(document.body, { childList: true, subtree: true });
    console.log('[VibeAI HUD] 🔁 Persistent interactivity observer active (2.4.3)');

    // Fast responder to host bind requests
    window.addEventListener('message', (evt) => {
      try {
        if (!evt.data) return;
        if (evt.data.type === 'VIBEAI_BIND_REQUEST') {
          window.parent.postMessage({ type: 'VIBEAI_RENDER_READY', instanceId: evt.data.instanceId || 'auto' }, '*');
          console.log('[VibeAI HUD] 🤝 Responded to VIBEAI_BIND_REQUEST');
        }
      } catch (err) { /* ignore */ }
    });
  } catch (err) {
    console.warn('[VibeAI HUD] ⚠️ 2.4.3 init error', err);
  }
})();
/* global chrome */
/**
 * ═══════════════════════════════════════════════════════════
 * VibeAI FoldSpace - Phase VII Resonance HUD
 * Spiral Lantern with HugoScore V2.0 Integration
 * ═══════════════════════════════════════════════════════════
 */

import { analyzeText as _analyzeText } from "../scripts/hugoscore-engine.js";

console.log("[FoldSpace] Resonance HUD initialized");

// ───────────────────────────────────────────────────────────
// Safe URL Wrapper
// ───────────────────────────────────────────────────────────
function safeGetURL(path) {
  try {
    if (chrome?.runtime?.getURL) {
      return chrome.runtime.getURL(path);
    }
    console.warn("[FoldSpace] chrome.runtime.getURL unavailable, using relative path");
    return `./${path}`;
  } catch (error) {
    console.warn("[FoldSpace] Error accessing chrome.runtime:", error);
    return `./${path}`;
  }
}

// ───────────────────────────────────────────────────────────
// DOM Elements
// ───────────────────────────────────────────────────────────
const canvas = document.getElementById("resonance-spiral");
const ctx = canvas.getContext("2d");
const moodText = document.getElementById("mood-text");
const chapterContent = document.getElementById("chapter-content");
const reanalyzeBtn = document.getElementById("reanalyze-btn");
const clearDataBtn = document.getElementById("clear-data-btn");
const privacyBtn = document.getElementById("privacy-btn");
const sidebar = document.getElementById("privacy-sidebar");
const spiralContainer = document.getElementById("spiral-container");
const toggle = document.getElementById("vibeai-toggle");
const closeBtn = document.querySelector(".close-btn");

// ───────────────────────────────────────────────────────────
// Spiral Animation State
// ───────────────────────────────────────────────────────────
let currentHue = 220; // Default blue
let targetHue = 220;
let currentSaturation = 0.3;
let targetSaturation = 0.3;
let currentVibrancy = 0.3;
let targetVibrancy = 0.3;
let rotation = 0;
let pulsePhase = 0;

// ───────────────────────────────────────────────────────────
// HSV to RGB Conversion
// ───────────────────────────────────────────────────────────
function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// ───────────────────────────────────────────────────────────
// Spiral Drawing Function
// ───────────────────────────────────────────────────────────
function drawSpiral() {
  const w = canvas.width || 120;
  const h = canvas.height || 120;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Smooth color transitions
  currentHue += (targetHue - currentHue) * 0.05;
  currentSaturation += (targetSaturation - currentSaturation) * 0.05;
  currentVibrancy += (targetVibrancy - currentVibrancy) * 0.05;

  // Pulse effect based on arousal
  pulsePhase += 0.02;
  const pulse = 1 + Math.sin(pulsePhase) * 0.1;

  // Convert HSV to RGB
  const [r, g, b] = hsvToRgb(currentHue, currentSaturation, currentVibrancy);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Draw spiral (scaled for 120x120 canvas)
  ctx.beginPath();
  const turns = 4;
  const points = 300;

  for (let i = 0; i < points; i++) {
    const t = i / points;
    const angle = t * Math.PI * 2 * turns;
    const radius = (t * 50) * pulse; // Reduced from 120 to 50 for smaller canvas
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  // Create gradient along spiral
  const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 55); // Scaled down
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.6)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.2)`);

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2; // Thinner line for smaller canvas
  ctx.lineCap = "round";
  ctx.stroke();

  // Draw center glow
  const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15); // Scaled down
  glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
  glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2); // Scaled down
  ctx.fillStyle = glowGradient;
  ctx.fill();

  ctx.restore();

  rotation += 0.008;
  requestAnimationFrame(drawSpiral);
}

// ───────────────────────────────────────────────────────────
// Chapter Detection & Labeling
// ───────────────────────────────────────────────────────────
function _detectChapters(text) {
  // Simple chapter detection based on conversation turns
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const chapters = [];
  let currentChapter = [];
  let wordCount = 0;

  for (const line of lines) {
    const words = line.trim().split(/\s+/).length;
    wordCount += words;
    currentChapter.push(line);

    // Create new chapter every ~100 words or significant pause
    if (wordCount > 100) {
      chapters.push(currentChapter.join(' '));
      currentChapter = [];
      wordCount = 0;
    }
  }

  // Add remaining text as final chapter
  if (currentChapter.length > 0) {
    chapters.push(currentChapter.join(' '));
  }

  return chapters.length > 0 ? chapters : ['Listening to conversation…'];
}

function _generateChapterLabel(chapterText, index, mood) {
  // Mood-based glyphs
  const moodGlyphs = {
    calm: '🌅',
    reflective: '🌙',
    urgent: '⚡',
    dissonant: '🌫️',
    resonant: '✨',
    charged: '⚡',
    dim: '🌑'
  };

  const glyph = moodGlyphs[mood] || '📖';

  // Extract first few words for preview
  const preview = chapterText.split(/\s+/).slice(0, 5).join(' ');
  const truncated = preview.length > 40 ? preview.substring(0, 37) + '...' : preview;

  return {
    glyph,
    label: `Chapter ${index + 1}`,
    preview: truncated,
    mood
  };
}

// ───────────────────────────────────────────────────────────
// PostMessage Bridge - Listen for updates from content script
// ───────────────────────────────────────────────────────────
window.addEventListener('message', (event) => {
  // Security check - only accept messages from same origin or parent
  if (event.data?.type !== 'VIBEAI_UPDATE') return;

  const { mood, hsv, chapters } = event.data.payload;

  console.log('[FoldSpace] Received update:', { mood, hsv, chaptersCount: chapters?.length });

  // Update spiral colors from HSV
  updateSpiral(mood, hsv);

  // Update chapter list
  updateChapters(chapters || []);
});

// ───────────────────────────────────────────────────────────
// Update Spiral Colors
// ───────────────────────────────────────────────────────────
function updateSpiral(mood, hsv) {
  if (hsv && hsv.length === 3) {
    const [hue, sat, vib] = hsv;
    targetHue = hue;
    targetSaturation = sat;
    targetVibrancy = vib;
  }

  // Update mood display
  const moodEmoji = {
    calm: '🌅',
    reflective: '🌙',
    urgent: '⚡',
    dissonant: '🌫️',
    resonant: '✨',
    charged: '⚡',
    dim: '🌑'
  }[mood] || '🌀';

  moodText.textContent = `${moodEmoji} ${mood}`;
  document.body.className = `mood-${mood}`;
}

// ───────────────────────────────────────────────────────────
// Update Chapter List UI
// ───────────────────────────────────────────────────────────
function updateChapters(chapters) {
  if (!chapterContent) return;

  if (!chapters.length) {
    chapterContent.innerHTML = '<p>Listening to conversation…</p>';
    return;
  }

  // Generate chapter items with mood-based styling
  chapterContent.innerHTML = chapters.map((c, index) => {
    const label = typeof c === 'string' ? `Chapter ${index + 1}` : (c.label || `Chapter ${index + 1}`);
    const mood = typeof c === 'string' ? 'neutral' : (c.mood || 'neutral');
    return `
      <div class="chapter-item">
        <span class="chapter-label">${label}</span>
        <span class="chapter-mood">${mood}</span>
      </div>
    `;
  }).join('');
}

// ───────────────────────────────────────────────────────────
// Control Button Handlers
// ───────────────────────────────────────────────────────────
reanalyzeBtn.addEventListener("click", () => {
  console.log("[FoldSpace] Manual re-analysis requested");
  // Send request to parent/content script to re-analyze
  const targetWindow = window.top || window.parent;
  targetWindow.postMessage({ type: 'VIBEAI_REANALYZE' }, '*');
});

// Ensure a reanalyze handler is attached even if the button is injected later
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('reanalyze-btn') || reanalyzeBtn;
  if (btn && !btn.dataset.binded) {
    btn.addEventListener('click', () => {
      console.log('[FoldSpace] 🔄 Re-analyze clicked (DOMContentLoaded binding)');
      // Visual feedback
      const orig = btn.textContent;
      btn.textContent = '🔄 Re-analyzing...';
      setTimeout(() => { btn.textContent = orig; }, 1000);
      const targetWindow = window.top || window.parent;
      targetWindow.postMessage({ type: 'VIBEAI_REANALYZE' }, '*');
    });
    btn.dataset.binded = '1';
  }
});

  // ACK handling: animate UI when receiving an ACK for a command
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    const { type, payload } = e.data;

    // Acknowledgement from content script or background that a command was processed
    if (type === 'VIBEAI_ACK') {
      const { cmd, mood } = payload || {};
      console.log('[FoldSpace] Received ACK for', cmd);

      // Animate the associated button if present
      let btn = null;
      if (cmd === 'reanalyze') btn = document.getElementById('reanalyze-btn');
      if (cmd === 'clear') btn = document.getElementById('clear-data-btn');
      if (cmd === 'privacy') btn = document.getElementById('privacy-btn');

      if (btn) {
        // Temporary label change
        const orig = btn.textContent;
        btn.textContent = '✅ Acked';
        btn.classList.add('ack-flash');
        setTimeout(() => {
          btn.textContent = orig;
          btn.classList.remove('ack-flash');
        }, 1000);
      }

      // Glyph update
      try {
        const glyphContainer = document.getElementById('glyph-display');
        if (glyphContainer && mood) {
          const glyphMap = {
            calm: '🌅', reflective: '🌙', urgent: '⚡', dissonant: '🌫️', resonant: '✨', charged: '⚡', dim: '🌑', focused: '🎯', stressed: '😰', joyful: '😊', sad: '😢', angry: '😠'
          };
          const newGlyph = glyphMap[mood] || '🌀';
          glyphContainer.textContent = newGlyph;
          glyphContainer.style.opacity = '0';
          glyphContainer.style.transform = 'scale(0.85) rotate(-6deg)';
          // trigger swap
          requestAnimationFrame(() => {
            glyphContainer.style.animation = 'glyphSwap 420ms ease forwards';
          });
        }
      } catch (err) {
        console.warn('[FoldSpace] Glyph update failed:', err);
      }

      // Spiral pulse
      try {
        const spiralRoot = document.getElementById('spiral-container') || canvas.parentElement;
        if (spiralRoot) {
          spiralRoot.style.animation = 'spiralPulse 900ms ease-out';
          setTimeout(() => { spiralRoot.style.animation = ''; }, 1000);
        }
      } catch (err) {
        console.warn('[FoldSpace] Spiral pulse failed:', err);
      }
    }
  });

clearDataBtn.addEventListener("click", () => {
  if (confirm("Clear all VibeAI stored data?")) {
    localStorage.clear();
    sessionStorage.clear();
    console.log("[FoldSpace] User data cleared");
    moodText.textContent = "🧹 Data cleared";
    chapterContent.innerHTML = '<p>Listening to conversation…</p>';
  }
});

privacyBtn.addEventListener("click", () => {
  const privacyUrl = safeGetURL("docs/privacy.html");
  window.open(privacyUrl, "_blank");
  console.log("[FoldSpace] Opening privacy policy");
});

// ───────────────────────────────────────────────────────────
// HUD Toggle Logic (Close/Reopen) - Cross-platform compatible
// ───────────────────────────────────────────────────────────
closeBtn.addEventListener("click", () => {
  console.log("[FoldSpace] Closing HUD - sending close message to parent");
  // Send message to parent content script to remove iframe
  // Use top window for sandboxed frames (Claude, Gemini)
  const targetWindow = window.top || window.parent;
  targetWindow.postMessage({ type: 'VIBEAI_CLOSE_HUD' }, '*');
});

toggle.addEventListener("click", () => {
  console.log("[FoldSpace] Reopening HUD");
  sidebar.classList.remove("hidden");
  spiralContainer.style.display = "flex";
  toggle.style.display = "none";
});

// ───────────────────────────────────────────────────────────
// Phase VII.9 – Resonant Memory Field Integration
// ───────────────────────────────────────────────────────────

function persistMoodState(mood, chapters) {
  if (chrome?.storage?.local) {
    chrome.storage.local.set({ lastMood: mood, chapters });
    console.log('[FoldSpace] Persisted mood state:', mood, chapters?.length);
  }
}

// Phase VIII.1 — HUD listener for GLYPHSTREAM_METRICS (logs metrics for verification)
window.addEventListener('message', e => {
  try {
    if (e?.data?.type === 'GLYPHSTREAM_METRICS') {
      // Keep logs lightweight
      console.log('[FoldSpace HUD] Metrics received:', e.data.payload);
      // Optionally trigger a soft visual pulse when metrics arrive
      const spiralRoot = document.getElementById('spiral-container');
      if (spiralRoot) {
        spiralRoot.style.animation = 'spiralPulse 420ms ease-out';
        setTimeout(() => { spiralRoot.style.animation = ''; }, 600);
      }
    }
  } catch (err) {
    console.warn('[FoldSpace HUD] GlyphStream listener error', err);
  }
});

function applyMoodTransition(newMood, immediate = false) {
  const hud = sidebar;
  const spiral = canvas.parentElement; // spiral-container
  if (!hud || !spiral) return;

  const palette = {
    calm: [220, 0.3, 0.3],
    focused: [260, 0.4, 0.45],
    stressed: [5, 0.6, 0.4],
    joyful: [48, 0.7, 0.55],
    sad: [200, 0.4, 0.25],
    angry: [10, 0.8, 0.45],
    reflective: [240, 0.35, 0.35],
    urgent: [15, 0.65, 0.5],
    dissonant: [280, 0.3, 0.25],
    resonant: [180, 0.5, 0.45],
    charged: [30, 0.7, 0.5],
    dim: [210, 0.2, 0.2]
  };

  const [h, s, v] = palette[newMood] || palette.calm;
  const target = `hsl(${h}deg, ${s * 100}%, ${v * 100}%)`;

  if (immediate) {
    hud.style.background = `radial-gradient(circle at 50% 20%, ${target}, #000)`;
    targetHue = h;
    targetSaturation = s;
    targetVibrancy = v;
  } else {
    hud.animate(
      [
        { background: hud.style.background },
        { background: `radial-gradient(circle at 50% 20%, ${target}, #000)` }
      ],
      { duration: 1200, fill: 'forwards', easing: 'ease-in-out' }
    );
    spiral.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: 1500, iterations: 1 }
    );
    targetHue = h;
    targetSaturation = s;
    targetVibrancy = v;
  }

  const moodEmoji = {
    calm: '🌅',
    reflective: '🌙',
    urgent: '⚡',
    dissonant: '🌫️',
    resonant: '✨',
    charged: '⚡',
    dim: '🌑',
    focused: '🎯',
    stressed: '😰',
    joyful: '😊',
    sad: '😢',
    angry: '😠'
  }[newMood] || '🌀';

  moodText.textContent = `${moodEmoji} ${newMood.charAt(0).toUpperCase() + newMood.slice(1)}`;
}

function renderChapters(chapters = []) {
  console.log("[FoldSpace] Rendering chapters:", chapters.length);
  // Prefer explicit root if available (ensures chapters are visible within HUD)
  let container = document.getElementById("chapter-content") || document.getElementById('vibeai-foldspace-root');

  // Auto-create if missing
  if (!container) {
    console.warn("[FoldSpace] Chapter container missing, creating dynamically...");
    const hudContent = document.querySelector(".hud-content") || document.querySelector("#privacy-sidebar") || document.getElementById('vibeai-foldspace-root');
    if (hudContent) {
      container = document.createElement("div");
      container.id = "chapter-content";
      container.className = "chapter-list";
      hudContent.appendChild(container);
    } else {
      console.error("[FoldSpace] Could not find HUD content container");
      return;
    }
  }

  container.innerHTML = ""; // Clear previous
  if (!chapters.length) {
    container.innerHTML = "<p class='chapter-empty'>No chapters detected yet...</p>";
    return;
  }

  chapters.forEach((ch, idx) => {
    const entry = document.createElement("div");
    entry.className = "chapter-entry";
    entry.dataset.index = idx;
    entry.textContent = `${idx + 1}. ${ch.title || ch.label || ch.mood || "Untitled Segment"}`;
    container.appendChild(entry);
  });

  // Click-to-scroll relay: post index back to parent for scrolling
  container.removeEventListener('click', container._vibeai_click_handler);
  container._vibeai_click_handler = (e) => {
    const target = e.target.closest('.chapter-entry');
    if (!target) return;
    const idx = target.dataset.index;
    try {
      const parentWin = window.parent || window.top;
      parentWin.postMessage({ type: 'VIBEAI_SCROLL_TO', index: idx }, '*');
      console.log('[FoldSpace] Requested scroll to index', idx);
    } catch (err) {
      console.warn('[FoldSpace] Could not post scroll request:', err);
    }
  };
  container.addEventListener('click', container._vibeai_click_handler);

  console.log(`[FoldSpace] ✅ Rendered ${chapters.length} chapters.`);
}

// Listen for VIBEAI_MOOD_UPDATE messages
window.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'VIBEAI_MOOD_UPDATE') return;
  const { mood, chapters } = e.data;
  applyMoodTransition(mood);
  persistMoodState(mood, chapters);
  renderChapters(chapters);
});

// Load saved mood and chapters on startup
if (chrome?.storage?.local) {
  chrome.storage.local.get(['lastMood', 'chapters'], data => {
    console.log('[FoldSpace] Loading saved state:', data);
    if (data.lastMood) applyMoodTransition(data.lastMood, true);
    if (data.chapters) renderChapters(data.chapters);
  });
}

// ───────────────────────────────────────────────────────────
// Initialize
// ───────────────────────────────────────────────────────────
console.log("[FoldSpace] Resonance HUD initialized - waiting for updates");
console.log("[FoldSpace] PostMessage bridge active");

// Start spiral animation
drawSpiral();

// Request initial analysis from parent
setTimeout(() => {
  const targetWindow = window.top || window.parent;
  targetWindow.postMessage({ type: 'VIBEAI_REANALYZE' }, '*');
}, 1000);

// Announce render readiness so the content script can send queued payloads
document.addEventListener('DOMContentLoaded', () => {
  try {
    const targetWindow = window.top || window.parent;
    targetWindow.postMessage({ type: 'VIBEAI_RENDER_READY' }, '*');
    console.log('[FoldSpace] VIBEAI_RENDER_READY');
  } catch (err) {
    console.warn('[FoldSpace] Could not post VIBEAI_RENDER_READY:', err);
  }
});

// Accept analysis payloads from content-script (cross-origin safe)
window.addEventListener('message', (ev) => {
  if (!ev.data || ev.data.type !== 'VIBEAI_ANALYSIS_PAYLOAD') return;
  const { mood, chapters } = ev.data.payload || {};
  console.log('[FoldSpace] VIBEAI_ANALYSIS_PAYLOAD received', (chapters || []).length);

  try {
    if (mood) {
      applyMoodTransition(mood);
      persistMoodState(mood, chapters);
    }
    renderChapters(chapters || []);
  } catch (err) {
    console.warn('[FoldSpace] Failed to process analysis payload:', err);
  }
});

// === Phase VII.9.8.4 — explicit listeners & robust rendering ===
(function () {
  let currentChapters = [];

  function postToParent(msg) {
    try {
      (window.top || window.parent || window).postMessage(msg, '*');
    } catch (e) {
      console.warn('[FoldSpace] postMessage failed:', e);
    }
  }

  function attachControlHandlers() {
    const reBtn = document.getElementById('reanalyze-btn');
    const clrBtn = document.getElementById('clear-data-btn') || document.getElementById('clear-btn');
    const prvBtn = document.getElementById('privacy-btn');

    if (reBtn) {
      reBtn.addEventListener('click', () => {
        postToParent({ type: 'VIBEAI_REANALYZE', ts: Date.now() });
      });
    }
    if (clrBtn) {
      clrBtn.addEventListener('click', () => {
        postToParent({ type: 'VIBEAI_CLEAR', ts: Date.now() });
        currentChapters = [];
        renderChapters();
      });
    }
    if (prvBtn) {
      prvBtn.addEventListener('click', () => {
        postToParent({ type: 'VIBEAI_OPEN_PRIVACY', ts: Date.now() });
      });
    }
  }

  function renderChapters() {
    const box = document.getElementById('reporter-box') || document.getElementById('chapter-content');
    if (!box) return;
    box.innerHTML = '<h4>📘 Conversation Journey</h4>';

    if (!Array.isArray(currentChapters) || currentChapters.length === 0) {
      box.insertAdjacentHTML('beforeend', '<p class="awaiting" style="padding-left:10px;color:#aaa;">Awaiting signal...</p>');
      return;
    }

    const list = document.createElement('ol');
    list.style.margin = '8px 0';
    list.style.paddingLeft = '18px';

    currentChapters.forEach((chapter, i) => {
      const li = document.createElement('li');
      li.textContent = chapter.label || chapter.title || `Snippet ${i + 1}`;
      li.dataset.index = String(i);
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        postToParent({ type: 'VIBEAI_SCROLL_TO', index: i });
      });
      list.appendChild(li);
    });

    box.appendChild(list);
  }

  // ACK feedback (brief label flash)
  window.addEventListener('message', (evt) => {
    const data = evt.data || {};
    if (data.type === 'VIBEAI_ACK') {
      const reBtn = document.getElementById('reanalyze-btn');
      if (reBtn) {
        const orig = reBtn.textContent;
        reBtn.textContent = '✅ Ack';
        reBtn.classList.add('ack-flash');
        setTimeout(() => {
          reBtn.textContent = orig;
          reBtn.classList.remove('ack-flash');
        }, 900);
      }
      return;
    }

    if (data.type === 'VIBEAI_RENDER_READY') {
      return;
    }

    if (data.type === 'VIBEAI_ANALYSIS_PAYLOAD' || data.type === 'VIBEAI_ANALYSIS_PAYLOAD') {
      currentChapters = (data.payload && data.payload.chapters) || [];
      renderChapters();
      return;
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    attachControlHandlers();
    renderChapters();
    postToParent({ type: 'VIBEAI_RENDER_READY', ts: Date.now() });
  });
})();

// Phase VIII.1 — HUD listener for GLYPHSTREAM_METRICS (logs metrics for verification)
window.addEventListener('message', e => {
  try {
    if (e?.data?.type === 'GLYPHSTREAM_METRICS') {
      console.log('[FoldSpace HUD] Metrics received:', e.data.payload);
      const spiralRoot = document.getElementById('spiral-container');
      if (spiralRoot) {
        spiralRoot.style.animation = 'spiralPulse 420ms ease-out';
        setTimeout(() => { spiralRoot.style.animation = ''; }, 600);
      }
    }
  } catch (err) {
    console.warn('[FoldSpace HUD] GlyphStream listener error', err);
  }
});

// Phase VIII.2 – HUD Color Resonance
window.addEventListener("message", (event) => {
  try {
    const msg = event.data;
    if (msg?.type === "EMOTIONAL_SYNC_COLOR") {
      const { color } = msg.payload || {};
      document.body.style.transition = "background-color 0.8s ease";
      document.body.style.backgroundColor = color || '';
      console.log("[FoldSpace HUD] Resonance color updated →", color);
    }
  } catch (err) {
    console.warn('[FoldSpace HUD] EMOTIONAL_SYNC_COLOR handler error', err);
  }
});

/* global chrome, FoldSpaceCanvas, TrailEngine */
// 🪐 VibeAI FoldSpace HUD Client Script (v2.11.8-BETA - Visual Polish)
// External script to satisfy Chrome CSP requirements

// Import HRI utilities for resonance normalization (Phase VIII.0)
import { normalizeResonance, getResonanceLabel, getResonanceColor } from './hri-utils.js';

// 🛡️ Platform Detection (v2.11.7)
const PLATFORM = (() => {
  const hostname = window.location.hostname || '';
  if (hostname.includes('claude.ai')) return 'claude';
  if (hostname.includes('chatgpt') || hostname.includes('openai')) return 'chatgpt';
  if (hostname.includes('gemini.google')) return 'gemini';
  return 'unknown';
})();

// Local escape helper to avoid unsafe innerHTML
function escapeHtmlLocal(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

// 🧭 Claude Degraded Mode (v2.11.7)
// Claude's CSP blocks postMessage, so we run in read-only mode
const CLAUDE_DEGRADED_MODE = PLATFORM === 'claude';

if (CLAUDE_DEGRADED_MODE) {
  void 0;
}

// 🧠 Resonance Engine v2.1 - Emotional Tone Analysis (Phase VIII.0)
function analyzeTone(text) {
  const clean = text.toLowerCase();
  let tone = "calm", hue = "#00d4ff", hri = 0.6, driftIndex = 0.3;

  // Emotional keyword dictionaries
  const positive = ["love", "peace", "good", "thank", "beautiful", "hope", "great", "wonderful", "amazing", "perfect", "happy", "joy"];
  const negative = ["angry", "hate", "bad", "tired", "sad", "broken", "fail", "error", "wrong", "terrible", "awful", "disaster"];
  const tense = ["urgent", "deadline", "fix", "crash", "problem", "stress", "issue", "bug", "critical", "emergency", "asap", "help"];

  // Tone classification with HRI scoring (0.0-1.0 scale)
  if (positive.some(w => clean.includes(w))) {
    tone = "resonant";
    hri = 0.85;
    hue = "#7bff6a"; // Green - positive resonance
    driftIndex = 0.1;
  } else if (negative.some(w => clean.includes(w))) {
    tone = "drift";
    hri = 0.35;
    hue = "#ffcc00"; // Yellow - emotional drift
    driftIndex = 0.7;
  } else if (tense.some(w => clean.includes(w))) {
    tone = "tense";
    hri = 0.5;
    hue = "#ff4f4f"; // Red - tension/urgency
    driftIndex = 0.5;
  }

  // Calculate resonance level using HRI thresholds (0.0-1.0)
  const resonanceLevel = hri >= 0.70 ? "high" : hri >= 0.50 ? "medium" : "low";

  return {
    tone,
    hri,
    hugoScore: Math.round(hri * 100), // Legacy compatibility
    hue,
    driftIndex,
    resonanceLevel
  };
}

// 🎭 CONSENT MODAL + BOOKMARK HANDSHAKE
// 🛡️ Claude Sandbox Detection (v2.11.2)
let targetRoot = document.body;
if (window.self !== window.top) {
  void 0;
  const safeRoot = document.querySelector("#vibeai-safe-root");
  if (safeRoot) {
    targetRoot = safeRoot;
  }
}

const modal = document.createElement("div");
modal.id = "vibeai-consent";
modal.innerHTML = `
  <div class="vibeai-modal-overlay">
    <div class="vibeai-modal-content animate-in">
      <h2>Enable VibeAI Thread Analysis?</h2>
      <p>This will allow VibeAI to scan visible chat threads and store them securely on your device.</p>
      <div class="vibeai-modal-buttons">
        <button type="button" id="vibeai-consent-yes">Enable</button>
        <button type="button" id="vibeai-consent-no">Cancel</button>
      </div>
    </div>
  </div>`;
targetRoot.appendChild(modal);

// 🛠️ Consent Modal Fade-Out Reliability Patch (v2.6.0-RC1a)
function closeConsentModal() {
  const modalEl = document.getElementById("vibeai-consent");
  if (!modalEl) {
    console.warn("[VibeAI HUD] ⚠️ Modal not found during close attempt");
    return;
  }
  void 0;
  modalEl.classList.add("fade-out");
  setTimeout(() => {
    if (modalEl && modalEl.parentNode) {
      modalEl.parentNode.removeChild(modalEl);
      void 0;
    } else {
      console.warn("[VibeAI HUD] ⚠️ Modal already removed or no parent");
    }
  }, 800);
}

// 🐛 Global Click Debugger (v2.6.2-DEBUG)
document.addEventListener("click", (e) => {
  void 0;
}, true); // Capture phase

document.addEventListener("mousedown", (e) => {
  void 0;
}, true);

// 🛡️ CRITICAL: Tell parent iframe to enable pointer-events for modal interaction
window.parent.postMessage("VIBEAI_ENABLE_IFRAME_CLICKS", "*");

// Direct button event listeners (more reliable than delegation in iframe)
setTimeout(() => {
  const yesBtn = document.getElementById("vibeai-consent-yes");
  const noBtn = document.getElementById("vibeai-consent-no");
  const modalOverlay = document.querySelector(".vibeai-modal-overlay");
  const modalContent = document.querySelector(".vibeai-modal-content");

  // Force pointer-events on modal elements
  if (modalOverlay) {
    modalOverlay.style.setProperty("pointer-events", "auto", "important");
  }
  if (modalContent) {
    modalContent.style.setProperty("pointer-events", "auto", "important");
  }

  if (yesBtn) {
    void 0;
    yesBtn.style.setProperty("pointer-events", "auto", "important");
    yesBtn.style.setProperty("cursor", "pointer", "important");

    // Try both click AND mousedown events
    const enableHandler = (e) => {
      void 0;
      e.preventDefault();
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: "GET_BOOKMARKS" }, res => {
        void 0;

        // Show the HUD container
        const hudContainer = document.querySelector(".hud-container");
        if (hudContainer) {
          hudContainer.classList.add("visible");
          void 0;
        }

        // Show the bookmark toolbar
        const toolbar = document.getElementById("vibeai-toolbar");
        if (toolbar) {
          toolbar.classList.add("visible");
          void 0;
        }

        // Show the thread inspector (Phase III-B)
        const inspector = document.getElementById("vibeai-inspector");
        if (inspector) {
          inspector.classList.add("visible");
          void 0;
        }

        // Tell parent to release pointer-events (Phase III-B)
        window.parent.postMessage("VIBEAI_CONSENT_GRANTED", "*");

        // Activate FoldSpaceCanvas (Phase V)
        if (foldSpaceCanvas) {
          foldSpaceCanvas.activate();
          void 0;
        }

        closeConsentModal();
      });
    };

    yesBtn.addEventListener("click", enableHandler);
    yesBtn.addEventListener("mousedown", enableHandler);
  } else {
    console.error("[VibeAI HUD] ❌ Enable button not found!");
  }

  if (noBtn) {
    void 0;
    noBtn.style.setProperty("pointer-events", "auto", "important");
    noBtn.style.setProperty("cursor", "pointer", "important");

    const cancelHandler = (e) => {
      void 0;
      e.preventDefault();
      e.stopPropagation();
      void 0;
      closeConsentModal();
    };

    noBtn.addEventListener("click", cancelHandler);
    noBtn.addEventListener("mousedown", cancelHandler);
  } else {
    console.error("[VibeAI HUD] ❌ Cancel button not found!");
  }
}, 100);

// Handshake listener for parent page communication
// v2.11.7: Skip postMessage in Claude degraded mode
if (!CLAUDE_DEGRADED_MODE) {
  window.addEventListener("message", e => {
    if (e.data === "VIBEAI_BIND_REQUEST") {
      e.source?.postMessage("VIBEAI_RENDER_READY", "*");
      void 0;
    }
  });
} else {
  void 0;
}

// Button event handlers
document.addEventListener("DOMContentLoaded", () => {
  const reanalyzeBtn = document.getElementById("reanalyze");
  const clearBtn = document.getElementById("clear");

  if (reanalyzeBtn) {
    reanalyzeBtn.addEventListener("click", () => {
      void 0;
      // TODO: Implement re-analyze logic
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      void 0;
      // TODO: Implement clear logic
    });
  }
});

// 💫 ESC-key listener for fade-out teardown
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const body = document.body;
    void 0;
    body.classList.add("fade-out");
    setTimeout(() => {
      // Remove HUD from parent page
      window.parent.postMessage("VIBEAI_DISMISS_HUD", "*");
    }, 600);
  }
});

// 🛡️ Continuous Interactivity Guardian (v2.4.8)
(() => {
  try {
    void 0;
    setInterval(() => {
      try {
        const body = document.body;
        const currentPE = getComputedStyle(body).pointerEvents;
        if (currentPE !== 'auto') {
          void 0;
          body.style.setProperty('pointer-events', 'auto', 'important');
        }

        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
          const btnPE = getComputedStyle(btn).pointerEvents;
          if (btnPE !== 'auto') {
            void 0;
            btn.style.pointerEvents = 'auto';
            btn.style.cursor = 'pointer';
          }
        });

        // Ensure all interactive elements are clickable
        document.querySelectorAll('a,[role="button"],input,select,textarea')
          .forEach(el => {
            el.style.pointerEvents = 'auto';
            el.style.cursor = 'pointer';
          });
      } catch (err) {
        console.error('[VibeAI HUD] Guardian error:', err);
      }
    }, 500);
  } catch (err) {
    console.warn("[VibeAI HUD] Guardian init failed", err);
  }
})();

// 🗂️ BOOKMARK TOOLBAR + LIST VIEW (Phase III)
const toolbar = document.createElement("div");
toolbar.id = "vibeai-toolbar";
toolbar.innerHTML = `
  <div class="vibeai-toolbar-header">Bookmarks</div>
  <div class="vibeai-toolbar-list" id="vibeai-bookmark-list">Loading…</div>
  <div class="vibeai-toolbar-actions">
    <button type="button" id="vibeai-add-bookmark">＋ Add Bookmark</button>
    <button type="button" id="vibeai-close-toolbar">✕ Close</button>
  </div>`;
targetRoot.appendChild(toolbar);

const listEl = document.getElementById("vibeai-bookmark-list");
const addBtn = document.getElementById("vibeai-add-bookmark");
const closeBtn = document.getElementById("vibeai-close-toolbar");

function renderBookmarks(data) {
  // v2.13.2.1: Guard against undefined/non-array data, support redacted bookmark structure
  if (!data || !Array.isArray(data) || data.length === 0) {
    listEl.innerHTML = "<p class='empty'>💫 No bookmarks saved yet. <br><small>Click '+ Add Bookmark' to save interesting moments.</small></p>";
    return;
  }
  listEl.innerHTML = data.map(
    b => {
      // v2.13.2.1: Redacted bookmarks use b.note (140 chars max)
      // Fall back to legacy b.content or b.preview if note missing
      const displayText = b?.note || b?.preview || b?.content?.slice(0, 80) || '(Bookmark saved)';
      const escaped = escapeHtmlLocal(displayText);
      const timestamp = b?.createdAt || b?.timestamp;
      const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : '';

      return `<div class='bm-item'>
        <span>${escaped}${displayText.length > 80 ? '…' : ''}</span>
        <time>${timeStr}</time>
          </div>`;
    }
  ).join("");
}

function loadBookmarks() {
  chrome.runtime.sendMessage({ type: "GET_BOOKMARKS" }, res => {
    renderBookmarks(res.bookmarks);
    void 0;
  });
}

// Initial load
loadBookmarks();

// Add bookmark button handler
addBtn.onclick = () => {
  chrome.storage.local.get(["lastThreads"], data => {
    const first = data.lastThreads?.[0];
    if (!first) {
      alert("No threads detected yet.");
      return;
    }
    chrome.runtime.sendMessage({ type: "ADD_BOOKMARK", payload: first }, () => {
      void 0;
      loadBookmarks(); // Refresh the list
    });
  });
};

// Close/toggle toolbar button handler
closeBtn.onclick = () => {
  toolbar.classList.toggle("collapsed");
};

// 🧠 THREAD INSPECTOR + MINI-FEED (Phase III-B)
const inspector = document.createElement("div");
inspector.id = "vibeai-inspector";
inspector.innerHTML = `
  <div class="vibeai-inspector-header">
    <div class="vibeai-brand">VibeAI</div>
    <div class="vibeai-subtitle">Thread Inspector</div>
  </div>
  <div class="vibeai-controls">
    <button type="button" id="vibeai-toggle-canvas" class="toggle-btn" title="Toggle FoldSpace Canvas">🎨 Hide Canvas</button>
  </div>
  <div class="vibeai-tone-legend">
    <div class="legend-item"><span class="dot resonant"></span>Resonant (85+)</div>
    <div class="legend-item"><span class="dot calm"></span>Calm (60-70)</div>
    <div class="legend-item"><span class="dot tense"></span>Tense (50-60)</div>
    <div class="legend-item"><span class="dot drift"></span>Drift (&lt;50)</div>
  </div>
  <div id="vibeai-thread-feed" class="vibeai-thread-feed">No threads yet</div>`;
targetRoot.appendChild(inspector);

const threadFeed = document.getElementById("vibeai-thread-feed");

// 🎨 Canvas Toggle (v2.11.8-BETA)
let canvasVisible = true;
const toggleCanvasBtn = document.getElementById("vibeai-toggle-canvas");
const foldspaceCanvas = document.getElementById("foldspace-canvas");

if (toggleCanvasBtn && foldspaceCanvas) {
  toggleCanvasBtn.addEventListener("click", () => {
    canvasVisible = !canvasVisible;
    foldspaceCanvas.style.display = canvasVisible ? "block" : "none";
    toggleCanvasBtn.textContent = canvasVisible ? "🎨 Hide Canvas" : "🎨 Show Canvas";
    void 0;
  });
}

// 🏷️ Auto-Title Helper (v2.11.8-BETA)
function autoTitle(content) {
  if (!content) return "Untitled Thread";
  const words = content.trim().split(/\s+/).slice(0, 5);
  return words.join(' ') + (content.split(/\s+/).length > 5 ? '...' : '');
}

function renderThreads(list) {
  // v2.11.7: Guard against undefined/non-array data
  if (!list || !Array.isArray(list) || list.length === 0) {
    threadFeed.innerHTML = "<p class='empty'>🧠 No threads detected yet. <br><small>Start chatting to see AI-analyzed threads appear here.</small></p>";
    updateHugoOrb(); // Update orb even when empty
    return;
  }
  threadFeed.innerHTML = list.map(
    t => {
      const tid = t?.id || 'unknown';
      const title = escapeHtmlLocal(t?.title || autoTitle(t?.content));
      const preview = escapeHtmlLocal((t?.content || '').slice(0, 100) || 'No content');
      const source = escapeHtmlLocal(t?.source || 'unknown');
      const time = t?.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '';
      return `<div class='thread-card' data-thread-id="${tid}">
            <div class='title'>${title}</div>
            <div class='preview'>${preview}…</div>
            <div class='meta'>${source} • ${time}</div>
          </div>`;
    }
  ).join("");
  void 0;

  // Apply HugoScore emotional analysis to each thread card
  decorateThreads(list);
}

// Initial load of threads
chrome.storage.local.get(["lastThreads"], data => {
  if (data.lastThreads) {
    renderThreads(data.lastThreads);
  }
});

// Real-time sync when threads update
chrome.storage.onChanged.addListener((changes) => {
  if (changes.lastThreads) {
    void 0;
    renderThreads(changes.lastThreads.newValue);
  }
});

// 🌊 Thread card click handlers - Drift Resonance Trails (Phase III-D)
threadFeed.addEventListener("click", (e) => {
  const card = e.target.closest(".thread-card");
  if (card) {
    const threadId = card.dataset.threadId;
    const tone = card.dataset.tone || "calm";
    const hue = card.style.borderLeftColor || "#00d4ff";

    void 0;

    // Get card position for trail start point
    const cardRect = card.getBoundingClientRect();

    // Send highlight message to parent window (which will relay to content script)
    window.parent.postMessage({
      type: "HIGHLIGHT_THREAD",
      threadId: threadId,
      tone: tone,
      hue: hue,
      cardRect: {
        top: cardRect.top,
        right: cardRect.right,
        bottom: cardRect.bottom,
        left: cardRect.left,
        width: cardRect.width,
        height: cardRect.height
      }
    }, "*");
  }
});

// 💫 Resonance Thread Decoration (Phase VIII.0)
function decorateThreads(list) {
  const cards = document.querySelectorAll(".thread-card");
  let analysisCount = 0;

  cards.forEach((card, index) => {
    const thread = list[index];
    if (!thread) return;

    const text = thread.content || thread.title || "";
    const result = analyzeTone(text);

    // Apply colorized left border based on tone
    card.style.borderLeft = `4px solid ${result.hue}`;
    card.dataset.hri = result.hri;
    card.dataset.hugoScore = result.hugoScore; // Legacy compatibility
    card.dataset.tone = result.tone;
    card.dataset.resonance = result.resonanceLevel;

    // Add tooltip with qualitative tone information (no numeric HRI shown)
    const resonanceLabel = getResonanceLabel(result.hri);
    card.title = `Tone: ${result.tone} | ${resonanceLabel}`;

    analysisCount++;
  });

  void 0;
  updateHugoOrb();

  // 🔧 Inject pointer-events override after HUD render (v2.11.9-STABLE)
  ensurePointerEventsOverride();
}

// ☀️ Update Hugo Orb with Average Field Hue (Phase VIII.0)
function updateHugoOrb() {
  const orb = document.getElementById("hugo-orb");
  if (!orb) {
    console.warn("[VibeAI HUD] ⚠️ Hugo orb not found");
    return;
  }

  const hriValues = [...document.querySelectorAll(".thread-card")]
    .map(c => Number(c.dataset.hri) || Number(c.dataset.hugoScore) / 100 || 0)
    .filter(s => s > 0);

  if (!hriValues.length) {
    // No threads - set to default calm state
    orb.style.setProperty("--orb-color", "#00d4ff");
    void 0;
    return;
  }

  const avgHri = hriValues.reduce((a, b) => a + b, 0) / hriValues.length;
  const hue = getResonanceColor(avgHri);

  orb.style.setProperty("--orb-color", hue);
  const resonanceLabel = getResonanceLabel(avgHri);
  void 0;
}

// 🌟 Apply Focus Glow to HUD Elements Only (Phase III-B.3)
function applyFocusGlow() {
  const hudElements = [
    document.querySelector('.hud-container'),
    document.getElementById('vibeai-toolbar'),
    document.getElementById('vibeai-inspector')
  ];

  hudElements.forEach(el => {
    if (el) {
      el.classList.add('vibeai-focus-glow');
    }
  });

  void 0;
}

// Apply focus glow after HUD elements become visible (2s delay)
setTimeout(applyFocusGlow, 2000);

// 🌊 Initialize Trail Engine (Phase III-D)
let trailEngine = null;
setTimeout(() => {
  if (typeof TrailEngine !== 'undefined') {
    trailEngine = new TrailEngine('vibeai-trail-layer');
  } else {
    console.warn('[VibeAI HUD] ⚠️ TrailEngine not loaded');
  }
}, 500);

// 📖 Initialize FoldSpaceCanvas (Phase V)
let foldSpaceCanvas = null;
setTimeout(() => {
  if (typeof FoldSpaceCanvas !== 'undefined') {
    foldSpaceCanvas = new FoldSpaceCanvas('foldspace-canvas');
    void 0;
  } else {
    console.warn('[VibeAI HUD] ⚠️ FoldSpaceCanvas not loaded');
  }
}, 500);

// Listen for highlight complete messages to draw trails
window.addEventListener("message", (event) => {
  if (event.data.type === "HIGHLIGHT_COMPLETE") {
    const { threadId, textRect, cardRect, tone, hue } = event.data;

    if (!trailEngine) {
      console.warn('[VibeAI HUD] ⚠️ TrailEngine not initialized');
      return;
    }

    // Spawn drift resonance trail from card to text
    trailEngine.spawnTrail(threadId, cardRect, textRect, tone, hue);
    void 0;
  }
});

// 🎯 Phase IV-C: HUD Interactivity Stabilization - Pointer Routing Layer
let lastFocusToggle = 0;
const FOCUS_THROTTLE = 300; // ms
let autoDeactivateTimer = null;

/**
 * Set HUD interactive state with pointer event routing
 * @param {HTMLElement} hudEl - The HUD element to control
 * @param {boolean} active - Whether to activate interactivity
 */
function setHUDInteractive(hudEl, active = true) {
  if (!hudEl) return;

  // Throttle focus toggles for performance
  const now = Date.now();
  if (now - lastFocusToggle < FOCUS_THROTTLE) return;
  lastFocusToggle = now;

  hudEl.style.pointerEvents = active ? 'auto' : 'none';
  hudEl.style.zIndex = active ? 99999 : 9999;

  if (active) {
    hudEl.classList.add('hud-active');
    void 0;

    // Reset auto-deactivate timer
    clearTimeout(autoDeactivateTimer);
    autoDeactivateTimer = setTimeout(() => {
      setHUDInteractive(hudEl, false);
      void 0;
    }, 600000); // 10 minutes
  } else {
    hudEl.classList.remove('hud-active');
    void 0;
  }
}

/**
 * Release all HUD focus and return to safe state
 */
function releaseAllHUDFocus() {
  const huds = [
    document.getElementById('vibeai-inspector'),
    document.getElementById('vibeai-toolbar')
  ];

  huds.forEach(hud => {
    if (hud) {
      setHUDInteractive(hud, false);
    }
  });

  void 0;
}

// Apply focus control to Thread Inspector
setTimeout(() => {
  const inspector = document.getElementById('vibeai-inspector');
  if (inspector) {
    inspector.addEventListener('mouseenter', () => setHUDInteractive(inspector, true));
    inspector.addEventListener('mouseleave', () => setHUDInteractive(inspector, false));
    void 0;
  }

  // Apply focus control to Bookmark Toolbar
  const toolbar = document.getElementById('vibeai-toolbar');
  if (toolbar) {
    toolbar.addEventListener('mouseenter', () => setHUDInteractive(toolbar, true));
    toolbar.addEventListener('mouseleave', () => setHUDInteractive(toolbar, false));
    void 0;
  }
}, 1000);

// ESC key - release all HUD focus
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    releaseAllHUDFocus();
  }
});

// 📖 Phase V: Storyflow Protocol - Emotional Chapter Detection

/**
 * Segment conversation into emotional chapters
 * @param {Array} threads - Array of thread objects with HRI data
 * @param {Object} options - Segmentation parameters
 * @returns {Array} Array of chapter objects
 */
function segmentConversation(threads, options = {}) {
  const {
    windowSize = 5,
    minToneShift = 0.25,
    minMessages = 3
  } = options;

  if (!threads || threads.length < minMessages) {
    return [];
  }

  const chapters = [];
  let chapterStart = 0;
  let currentChapterId = 1;

  for (let i = windowSize; i < threads.length; i++) {
    // Calculate tone shift in current window using HRI (0.0-1.0)
    const windowThreads = threads.slice(i - windowSize, i);
    const hriValues = windowThreads.map(t => {
      const card = document.querySelector(`[data-thread-id="${t.id}"]`);
      return card ? (parseFloat(card.dataset.hri) || parseFloat(card.dataset.hugoScore) / 100 || 0.6) : 0.6;
    });

    const avgBefore = hriValues.slice(0, Math.floor(windowSize / 2)).reduce((a, b) => a + b, 0) / Math.floor(windowSize / 2);
    const avgAfter = hriValues.slice(Math.ceil(windowSize / 2)).reduce((a, b) => a + b, 0) / Math.ceil(windowSize / 2);
    const toneShift = Math.abs(avgAfter - avgBefore);

    // Detect chapter boundary
    if (toneShift >= minToneShift && (i - chapterStart) >= minMessages) {
      const chapterThreads = threads.slice(chapterStart, i);
      const chapter = analyzeChapter(chapterThreads, chapterStart, i, currentChapterId);
      chapters.push(chapter);

      chapterStart = i;
      currentChapterId++;
    }
  }

  // Add final chapter
  if (chapterStart < threads.length) {
    const chapterThreads = threads.slice(chapterStart);
    const chapter = analyzeChapter(chapterThreads, chapterStart, threads.length, currentChapterId);
    chapters.push(chapter);
  }

  void 0;
  return chapters;
}

/**
 * Analyze a chapter's emotional characteristics
 * @param {Array} threads - Threads in this chapter
 * @param {number} startIndex - Starting index
 * @param {number} endIndex - Ending index
 * @param {number} chapterId - Chapter identifier
 * @returns {Object} Chapter analysis object
 */
function analyzeChapter(threads, startIndex, endIndex, chapterId) {
  const hriValues = [];
  const tones = {};

  threads.forEach(t => {
    const card = document.querySelector(`[data-thread-id="${t.id}"]`);
    if (card) {
      const hri = parseFloat(card.dataset.hri) || parseFloat(card.dataset.hugoScore) / 100 || 0.6;
      const tone = card.dataset.tone || 'calm';
      hriValues.push(hri);
      tones[tone] = (tones[tone] || 0) + 1;
    }
  });

  const avgHri = hriValues.reduce((a, b) => a + b, 0) / hriValues.length || 0.6;
  const variance = calculateVariance(hriValues);
  const dominantTone = Object.keys(tones).reduce((a, b) => tones[a] > tones[b] ? a : b, 'calm');

  // Determine chapter icon based on dominant tone
  const icon = {
    'calm': '🕊',
    'tense': '⚡',
    'drift': '🌿',
    'resonant': '✨'
  }[dominantTone] || '🕊';

  // Calculate anchor position for canvas (distributed evenly)
  const anchorPosition = {
    x: 150 + (chapterId * 100),
    y: 200 + ((avgHri - 0.6) * 200)
  };

  return {
    chapterId: `ch${chapterId}`,
    startIndex,
    endIndex,
    dominantTone,
    avgHri: parseFloat(avgHri.toFixed(3)),
    avgScore: Math.round(avgHri * 100), // Legacy compatibility
    variance: variance.toFixed(3),
    icon,
    anchorPosition,
    messageCount: threads.length
  };
}

/**
 * Calculate variance of HRI values
 * @param {Array} values - Array of numerical HRI values (0.0-1.0)
 * @returns {number} Variance value
 */
function calculateVariance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Update chapters and store in chrome.storage
 * @param {Array} threads - Current thread list
 */
function updateChapters(threads) {
  if (!threads || threads.length === 0) return;

  const chapters = segmentConversation(threads, {
    windowSize: 5,
    minToneShift: 0.25,
    minMessages: 3
  });

  // Store chapters
  chrome.storage.local.set({ chapters }, () => {
    void 0;

    // Log summary
    const resonantPeaks = chapters.filter(c => c.dominantTone === 'resonant').length;
    const avgVariance = chapters.reduce((sum, c) => sum + parseFloat(c.variance), 0) / chapters.length;
    void 0;
  });

  return chapters;
}

// Update chapters when threads change
chrome.storage.onChanged.addListener((changes) => {
  if (changes.lastThreads && changes.lastThreads.newValue) {
    setTimeout(() => {
      updateChapters(changes.lastThreads.newValue);
    }, 500);
  }
});

// 📖 Canvas click handler for chapter navigation (Phase V)
setTimeout(() => {
  const canvas = document.getElementById('foldspace-canvas');
  if (canvas) {
    canvas.addEventListener('click', (e) => {
      if (foldSpaceCanvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        foldSpaceCanvas.handleClick(x, y);
      }
    });
    void 0;
  }
}, 1000);

// 🔧 Pointer-Events Safety Override (v2.11.9-STABLE)
// Ensures HUD elements are interactive even when iframe has pointer-events:none
// Injected AFTER HUD render to ensure DOM is ready
function ensurePointerEventsOverride() {
  try {
    // Check if already injected
    if (document.getElementById('vibeai-pointer-events-override')) {
      void 0;
      return;
    }

    // Inject CSS to force pointer-events on all interactive elements
    const style = document.createElement('style');
    style.id = 'vibeai-pointer-events-override';
    style.textContent = `
      /* Force pointer-events on all interactive HUD elements */
      #vibeai-inspector,
      #vibeai-toolbar,
      #vibeai-consent,
      .vibeai-inspector-header,
      .vibeai-controls,
      .vibeai-thread-feed,
      .vibeai-thread-feed .thread-card,
      .vibeai-toolbar-list,
      .vibeai-toolbar-actions,
      button,
      .toggle-btn,
      .vibeai-modal-content,
      .vibeai-modal-buttons,
      #vibeai-bookmark-list,
      #vibeai-thread-feed {
        pointer-events: auto !important;
        cursor: pointer !important;
      }

      /* Ensure scrollable areas are interactive */
      #vibeai-inspector,
      .vibeai-thread-feed,
      .vibeai-toolbar-list,
      #vibeai-bookmark-list {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        user-select: auto !important;
      }

      /* Button hover states must work */
      button:hover,
      .toggle-btn:hover,
      .thread-card:hover {
        cursor: pointer !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
    void 0;
  } catch (err) {
    console.error('[VibeAI HUD] ❌ Failed to apply pointer-events override:', err);
  }
}

// Initial injection attempt (will be re-called after HUD render if needed)
setTimeout(ensurePointerEventsOverride, 800);

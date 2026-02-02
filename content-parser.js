/* global chrome */
// 🔍 VibeAI FoldSpace Universal Thread Parser (v2.11.9-ALPHA)
// Supports ChatGPT, Gemini, and Copilot conversation scanning

// v2.14.3: Privacy gate - disable content-bearing logs by default (pre-Steven hardening)
// Use window property DIRECTLY to avoid const collision with unified-hud.js
if (!window.VIBEAI_PARSER_DEBUG) window.VIBEAI_PARSER_DEBUG = false;

window.VIBEAI_PARSER_ACTIVE = true; // Debug flag

void 0;

// v2.14.8: Initialize parser registry and detect platform
const registry = window.__vibeai_parser_registry;
if (!registry) {
  console.error('[VibeAI Parser] ❌ Parser registry not initialized! Check manifest.json load order');
  throw new Error('Parser registry missing');
}

const activeParser = registry.detectAndActivate();
if (!activeParser) {
  console.warn('[VibeAI Parser] ⚠️  No parser for this platform, exiting');
  // Exit early - we don't support this platform
}

// v2.14.4: Optional HugoScore WASM integration (feature-flagged)
// Feature flag is in hugoscore-integration.js: ENABLE_WASM_HUGOSCORE
// Default: OFF (uses lightweight tone detection below)
// To enable: Set ENABLE_WASM_HUGOSCORE = true in scripts/hugoscore-integration.js
let hugoScoreIntegration = null;

// v2.14.1: Persistent bridge token per page session (prevents token mismatch errors)
let VIBEAI_BRIDGE_TOKEN = null;

/**
 * Get or initialize the bridge token (created once per page session)
 * @returns {string} The persistent bridge token
 */
function getBridgeToken() {
  if (!VIBEAI_BRIDGE_TOKEN) {
    VIBEAI_BRIDGE_TOKEN = Math.random().toString(36).slice(2);

    // Dispatch token ONCE so HUD can store it during initialization
    try {
      document.dispatchEvent(new CustomEvent('vibeai:setBridgeToken', {
        detail: { token: VIBEAI_BRIDGE_TOKEN },
        bubbles: true,
        composed: true
      }));
      void 0;
    } catch (err) {
      console.warn('[VibeAI Parser] ⚠️ Could not dispatch bridge token', err);
    }
  }
  return VIBEAI_BRIDGE_TOKEN;
}

/**
 * Detect which platform we're running on
 * v2.14.8: Now uses modular parser registry
 */
function detectPlatform() {
  return registry.getPlatformName() || 'unknown';
}

/**
 * Extract messages based on platform-specific selectors
 */
/**
 * Extract messages based on platform-specific selectors
 * v2.14.8: Uses modular parser registry
 */
function extractMessages() {
  // v2.14.8: Delegate to modular parsers
  const messages = registry.extractMessages();
  
  // Store for debugging (maintained for backward compatibility)
  window.VIBEAI_LAST_THREADS = messages;
  window.VIBEAI_LAST_HRI = window.VIBEAI_LAST_SCORE || 0;
  
  return messages;
}

/**
 * Detect dominant tone from text content (lightweight version)
 * Returns: 'calm', 'urgent', 'reflective', 'dissonant', or 'resonant'
 */
function detectTone(text) {
  const lower = text.toLowerCase();

  // Keyword patterns for each tone
  const patterns = {
    urgent: /\b(urgent|asap|immediately|critical|emergency|now|quick|fast|hurry|deadline)\b/gi,
    dissonant: /\b(error|problem|issue|bug|fail|broken|wrong|conflict|disagree|concern)\b/gi,
    resonant: /\b(perfect|excellent|amazing|brilliant|love|great|awesome|fantastic|wonderful)\b/gi,
    reflective: /\b(think|consider|wonder|perhaps|maybe|feel|seem|interesting|curious)\b/gi,
    calm: /\b(ok|okay|sure|fine|good|yes|thanks|appreciate|understand|noted)\b/gi
  };

  // Count matches for each tone
  const scores = {
    urgent: (lower.match(patterns.urgent) || []).length,
    dissonant: (lower.match(patterns.dissonant) || []).length,
    resonant: (lower.match(patterns.resonant) || []).length,
    reflective: (lower.match(patterns.reflective) || []).length,
    calm: (lower.match(patterns.calm) || []).length
  };

  // Find highest scoring tone
  const entries = Object.entries(scores);
  const max = Math.max(...entries.map(([_, v]) => v));

  if (max === 0) return 'calm'; // Default to calm if no keywords

  const dominant = entries.find(([_, v]) => v === max);
  return dominant ? dominant[0] : 'calm';
}

/**
 * Calculate HRI (Hugo Resonance Index) for text content
 * Returns: 0.0 - 1.0 scale
 */
function calculateHRI(text, tone) {
  const length = text.length;

  // Base HRI from text length (longer = more engaged)
  let baseHRI = Math.min(length / 500, 1.0);

  // Tone modifiers
  const toneWeights = {
    resonant: 0.9,   // High resonance
    calm: 0.7,       // Moderate-high
    reflective: 0.6, // Moderate
    urgent: 0.5,     // Moderate-low
    dissonant: 0.3   // Low resonance
  };

  const toneWeight = toneWeights[tone] || 0.5;

  // Weighted average
  const hri = (baseHRI * 0.4) + (toneWeight * 0.6);

  return Math.max(0.0, Math.min(1.0, hri)); // Clamp 0-1
}

/**
 * Lazy-load HugoScore integration (WASM/JS)
 * Only loads if explicitly requested
 */
async function getHugoScoreAnalyzer() {
  if (hugoScoreIntegration) return hugoScoreIntegration;

  try {
    const module = await import(chrome.runtime.getURL('scripts/hugoscore-integration.js'));
    hugoScoreIntegration = module;

    // Log which implementation is active
    const info = module.getImplementationInfo();
    if (window.VIBEAI_PARSER_DEBUG) {
      void 0;
    }

    return module;
  } catch (error) {
    console.warn('[Parser] Could not load HugoScore integration:', error.message);
    return null;
  }
}

/**
 * Analyze thread with optional WASM-enhanced HugoScore
 * Falls back to lightweight tone detection if WASM disabled or unavailable
 */
async function analyzeThreadContent(text, idx) {
  // Try HugoScore integration first (if available and enabled)
  const analyzer = await getHugoScoreAnalyzer();
  if (analyzer) {
    try {
      const analysis = await analyzer.analyzeText(text);

      // Map HugoScore mood to VibeAI tone
      const moodToTone = {
        'calm': 'calm',
        'urgent': 'urgent',
        'reflective': 'reflective',
        'dissonant': 'dissonant',
        'resonant': 'resonant'
      };

      const tone = moodToTone[analysis.mood] || 'reflective';

      if (window.VIBEAI_PARSER_DEBUG) {
        void 0;
      }

      return {
        tone: tone,
        hri: analysis.hri,
        hugoScoreAnalysis: analysis // Full analysis for advanced features
      };
    } catch (error) {
      console.warn('[Parser] HugoScore analysis failed, using fallback:', error.message);
      // Fall through to lightweight detection
    }
  }

  // Fallback: Use lightweight tone detection
  const tone = detectTone(text);
  const hri = calculateHRI(text, tone);

  if (window.VIBEAI_PARSER_DEBUG) {
    void 0;
  }

  return {
    tone: tone,
    hri: hri,
    hugoScoreAnalysis: null
  };
}

/**
 * Enrich threads with HRI and tone data
 * v2.14.4: Optionally uses WASM-enhanced HugoScore (feature-flagged)
 */
async function enrichThreads(threads) {
  // Process threads sequentially to avoid overwhelming WASM loader
  const enriched = [];

  for (let idx = 0; idx < threads.length; idx++) {
    const thread = threads[idx];
    const analysis = await analyzeThreadContent(thread.content, idx);

    enriched.push({
      ...thread,
      emotionalTones: [analysis.tone], // Array format for foldspaceMiniHTML
      hri: analysis.hri,
      tone: analysis.tone,
      hugoScoreAnalysis: analysis.hugoScoreAnalysis // Optional detailed analysis
    });
  }

  return enriched;
}

/**
 * Send extracted threads to background service worker
 * v2.14.4: Async to support WASM-enhanced HugoScore analysis
 */
// mCopi audit fix: Overlap guard to prevent concurrent analysis calls
let __vibeai_parser_running = false;

async function sendThreadsToBackground() {
  // Skip if previous analysis still running (prevents CPU spikes from overlapping calls)
  if (__vibeai_parser_running) {
    void 0;
    return;
  }

  __vibeai_parser_running = true;
  try {
    const platform = detectPlatform();

    // Claude-specific logging
    if (platform === "claude") {
      if (window.VIBEAI_PARSER_DEBUG) void 0;
    }

    const threads = extractMessages();

  // Phase Δ9.3-Lite: Notify HUD of thread updates for dynamic canvas refresh
  if (threads.length > 0) {
    // v2.14.2: Enrich threads with HRI + tone data (MAKES MOOD ICONS ALIVE!)
    // v2.14.4: Now async to support optional WASM-enhanced analysis
    if (window.VIBEAI_PARSER_DEBUG) void 0;
    const enrichedThreads = await enrichThreads(threads);
    if (window.VIBEAI_PARSER_DEBUG) void 0;
    const latest = enrichedThreads[enrichedThreads.length - 1];

    // v2.14.1: Enhanced postMessage bridge (PRIMARY transport mechanism)
    try {
      // Get persistent bridge token (initialized once per page session)
      const bridgeToken = getBridgeToken();

      const payload = {
        type: 'VIBEAI_THREAD_UPDATE', // Changed to uppercase for clarity
        source: 'vibeai-parser',
        platform: platform,
        ts: Date.now(),
        detail: {
          content: latest.content,
          count: enrichedThreads.length,
          platform: platform,
          // v2.14.2: Send FULL enriched threads array (with HRI, tone, emotionalTones)
          threads: enrichedThreads.map(t => ({
            id: t.id,
            source: t.source,
            content: t.content.slice(0, 500), // Trim for payload size
            timestamp: t.timestamp,
            emotionalTones: t.emotionalTones,
            hri: t.hri,
            tone: t.tone
          }))
        }
      };

      // Attach bridge token for HUD authenticity check
      try { payload.bridgeToken = bridgeToken; } catch (tb) { /* ignore */ }

      window.postMessage(payload, '*');
      void 0;

    } catch (e) {
      console.error('[VibeAI Parser] ❌ postMessage failed:', e);
      // Fallback: try minimal payload
      try {
        window.postMessage({
          type: 'VIBEAI_THREAD_UPDATE',
          source: 'vibeai-parser',
          ts: Date.now(),
          detail: { content: latest.content.slice(0, 500), count: threads.length, platform: platform }
        }, '*');
      } catch (err) {
        console.error('[VibeAI Parser] ❌ Fallback postMessage also failed:', err);
      }
    }

    // FALLBACK ONLY: CustomEvent (does not cross content-script boundary reliably)
    document.dispatchEvent(new CustomEvent('vibeai:threadUpdate', {
      detail: {
        content: latest.content,
        count: threads.length,
        platform: platform
      },
      bubbles: true,
      composed: true
    }));
  }

    chrome.runtime.sendMessage(
      { type: "THREADS_EXTRACTED", payload: threads },
      response => {
        if (chrome.runtime.lastError) {
          console.warn("[VibeAI Parser] ⚠️ Send failed:", chrome.runtime.lastError.message);
        } else if (response && response.status === "OK") {
          void 0;
        }
      }
    );
  } finally {
    // mCopi audit fix: Always reset flag, even if error occurs
    __vibeai_parser_running = false;
  }
}

// Periodic scan every 2.5 seconds (v2.14.7: Reduced from 8s for faster mood updates)
setInterval(sendThreadsToBackground, 2500);

// Initial scan
sendThreadsToBackground();

void 0;

// v2.14.8: Setup mutation observers using modular parsers
// Each parser handles its own observer logic
registry.setupObserver(sendThreadsToBackground);

/**
 * Highlight a thread on the host page
 * @param {string} threadId - Thread identifier
 * @param {string} tone - Emotional tone
 * @param {string} hue - Color for highlight
 */
function highlightThreadOnHost(threadId, tone, hue) {
  try {
    // Remove previous highlight if exists
    if (currentHighlightElement) {
      currentHighlightElement.style.outline = "";
      currentHighlightElement.style.boxShadow = "";
      currentHighlightElement = null;
    }

    // Find the matching element by thread ID
    const platform = detectPlatform();
    let targetElement = null;

    // Extract index from thread ID (format: "platform-index")
    const match = threadId.match(/-(\\d+)$/);
    if (!match) {
      console.warn(`[VibeAI Parser] ⚠️ Invalid thread ID format: ${threadId}`);
      return null;
    }

    const index = parseInt(match[1], 10);

    // Get the corresponding DOM node
    if (platform === "chatgpt") {
      const nodes = document.querySelectorAll(".markdown, .text-base");
      targetElement = nodes[index];
    } else if (platform === "gemini") {
      const nodes = document.querySelectorAll("[data-message-content], article, .response-container");
      targetElement = nodes[index];
    } else if (platform === "copilot") {
      const nodes = document.querySelectorAll(
        ".ac-textBlock, .cib-message-content, [class*='message'], [class*='response-message'], [data-content], .text-message-content"
      );
      targetElement = nodes[index];
    } else if (platform === "claude") {
      const nodes = document.querySelectorAll(
        "[data-test-render-count], .font-claude-message, div[class*='font-user-message'], div[class*='font-claude'], [class*='MessageContent']"
      );
      targetElement = nodes[index];
    }

    if (!targetElement) {
      console.warn(`[VibeAI Parser] ⚠️ Element not found for thread: ${threadId}`);
      return null;
    }

    // Apply highlight glow
    targetElement.style.setProperty("outline", `2px solid ${hue}`, "important");
    targetElement.style.setProperty("box-shadow", `0 0 12px ${hue}`, "important");
    targetElement.style.setProperty("--tone-color", hue);

    // Scroll element into view smoothly
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });

    // Store for cleanup
    currentHighlightElement = targetElement;

    void 0;

    // Auto-remove highlight after 2 seconds
    setTimeout(() => {
      if (currentHighlightElement === targetElement) {
        targetElement.style.outline = "";
        targetElement.style.boxShadow = "";
        currentHighlightElement = null;
        void 0;
      }
    }, 2000);

    // Return element rect for trail drawing
    return targetElement.getBoundingClientRect();

  } catch (err) {
    console.error(`[VibeAI Parser] ❌ Highlight error:`, err);
    return null;
  }
}

// Listen for highlight messages from HUD iframe
window.addEventListener("message", (event) => {
  if (event.data.type === "HIGHLIGHT_THREAD") {
    const { threadId, tone, hue, cardRect } = event.data;
    void 0;

    const textRect = highlightThreadOnHost(threadId, tone, hue);

    // Send rect back to HUD for trail drawing
    if (textRect) {
      event.source.postMessage({
        type: "HIGHLIGHT_COMPLETE",
        threadId,
        textRect: {
          top: textRect.top,
          right: textRect.right,
          bottom: textRect.bottom,
          left: textRect.left,
          width: textRect.width,
          height: textRect.height
        },
        cardRect,
        tone,
        hue
      }, "*");

      void 0;
    }
  }

  // 📖 Phase V: Chapter Navigation - Scroll to chapter on glyph click
  if (event.data.type === "SCROLL_TO_CHAPTER") {
    const { chapterId, startIndex } = event.data;
    void 0;

    const platform = detectPlatform();
    let targetElement = null;

    if (platform === "chatgpt") {
      const nodes = document.querySelectorAll(".markdown, .text-base");
      targetElement = nodes[startIndex];
    } else if (platform === "gemini") {
      const nodes = document.querySelectorAll("[data-message-content], article, .response-container");
      targetElement = nodes[startIndex];
    } else if (platform === "claude") {
      const nodes = document.querySelectorAll(
        "[data-test-render-count], .font-claude-message, div[class*='font-user-message'], div[class*='font-claude'], [class*='MessageContent']"
      );
      targetElement = nodes[startIndex];
    }

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      });
      void 0;
    } else {
      console.warn(`[VibeAI Parser] ⚠️ Chapter element not found at index ${startIndex}`);
    }
  }
});

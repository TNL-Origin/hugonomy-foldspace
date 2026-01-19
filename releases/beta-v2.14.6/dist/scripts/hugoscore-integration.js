/**
 * HugoScore Integration Layer
 * Provides unified interface for HugoScore analysis with WASM/JS fallback
 *
 * Feature Flag: ENABLE_WASM_HUGOSCORE
 * - true: Use WASM implementation (maximum IP protection)
 * - false: Use original JS implementation (baseline)
 */

// ═══════════════════════════════════════════════════════════
// FEATURE FLAG
// ═══════════════════════════════════════════════════════════

/**
 * WASM Feature Flag
 * Set to true to enable WebAssembly implementation
 * Set to false to use original JavaScript implementation
 */
const ENABLE_WASM_HUGOSCORE = false; // Default: OFF (change to true to enable)

// ═══════════════════════════════════════════════════════════
// WASM LOADER (Lazy Import)
// ═══════════════════════════════════════════════════════════

let wasmAnalyzer = null;
let wasmLoadAttempted = false;
let wasmAvailable = false;

/**
 * Lazy-load WASM analyzer
 * Only imports when ENABLE_WASM_HUGOSCORE is true
 */
async function loadWasmAnalyzer() {
  if (wasmLoadAttempted) {
    return wasmAvailable ? wasmAnalyzer : null;
  }

  wasmLoadAttempted = true;

  if (!ENABLE_WASM_HUGOSCORE) {
    console.log('[HugoScore] WASM disabled by feature flag, using JS implementation');
    return null;
  }

  try {
    // Dynamic import of WASM loader
    const wasmModule = await import(chrome.runtime.getURL('scripts/hugoscore-wasm-loader.js'));
    wasmAnalyzer = wasmModule;
    wasmAvailable = true;
    console.log('[HugoScore] ✅ WASM integration loaded successfully');
    return wasmAnalyzer;
  } catch (error) {
    console.warn('[HugoScore] ⚠️ WASM loader failed, falling back to JS:', error.message);
    wasmAvailable = false;
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// ORIGINAL JS ANALYZER (Fallback)
// ═══════════════════════════════════════════════════════════

let jsAnalyzer = null;

/**
 * Load original JS analyzer (fallback)
 */
async function loadJsAnalyzer() {
  if (jsAnalyzer) return jsAnalyzer;

  try {
    const jsModule = await import(chrome.runtime.getURL('scripts/hugoscore-engine.js'));
    jsAnalyzer = jsModule;
    console.log('[HugoScore] JS implementation loaded (fallback)');
    return jsAnalyzer;
  } catch (error) {
    console.error('[HugoScore] ❌ Failed to load JS implementation:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// UNIFIED ANALYSIS INTERFACE
// ═══════════════════════════════════════════════════════════

/**
 * Analyze text using HugoScore algorithm
 * Automatically selects WASM or JS implementation based on feature flag
 *
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} Analysis result with HRI, sentiment, mood, etc.
 */
export async function analyzeText(text) {
  // Try WASM first (if enabled)
  if (ENABLE_WASM_HUGOSCORE) {
    const wasm = await loadWasmAnalyzer();
    if (wasm) {
      try {
        const result = await wasm.analyzeText(text);
        return result;
      } catch (error) {
        console.warn('[HugoScore] WASM analysis failed, falling back to JS:', error.message);
        // Fall through to JS fallback
      }
    }
  }

  // Fallback to original JS implementation
  const js = await loadJsAnalyzer();
  if (js) {
    return js.analyzeText(text);
  }

  // Ultimate fallback: return empty result
  console.error('[HugoScore] ❌ No analyzer available (WASM and JS both failed)');
  return createEmptyResult();
}

/**
 * Get current implementation info (for debugging)
 */
export function getImplementationInfo() {
  return {
    wasmEnabled: ENABLE_WASM_HUGOSCORE,
    wasmAvailable: wasmAvailable,
    wasmLoadAttempted: wasmLoadAttempted,
    jsLoaded: jsAnalyzer !== null,
    currentImplementation: ENABLE_WASM_HUGOSCORE && wasmAvailable ? 'WASM' : 'JS'
  };
}

/**
 * Empty result for error cases
 */
function createEmptyResult() {
  return {
    words: 0,
    sentiment: 0,
    coherence: 50,
    tone: "neutral",
    mood: "reflective",
    hri: 0.5,
    hugoScore: 50,
    valence: 0,
    arousal: 0,
    resonance: 0,
    hsv: [220, 0.3, 0.3],
    confidence: 0,
    crisis: "safe",
    crisisConfidence: 0,
    flags: { shortText: true, longText: false, mixedEmotion: false, highArousal: false }
  };
}

// ═══════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════

export default { analyzeText, getImplementationInfo };

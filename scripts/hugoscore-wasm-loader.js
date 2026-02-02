/**
 * HugoScore WebAssembly Loader
 * Loads and interfaces with the WASM-compiled HugoScore algorithm
 *
 * This file is the bridge between JavaScript and the binary WASM module
 * Patent-pending algorithm (US App No. 63/856,714)
 */

let wasmModule = null;
let wasmReady = false;

// ═══════════════════════════════════════════════════════════
// WASM MODULE INITIALIZATION
// ═══════════════════════════════════════════════════════════

async function initWASM() {
  if (wasmReady) return true;

  try {
    // Get the WASM file URL (works in Chrome extension context)
    const wasmUrl = chrome.runtime.getURL('assembly/build/release.wasm');

    // Fetch the WASM bytes
    const response = await fetch(wasmUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM: ${response.status}`);
    }
    const wasmBytes = await response.arrayBuffer();

    // Get the AssemblyScript loader
    const loaderUrl = chrome.runtime.getURL('assembly/build/release.js');
    const loaderModule = await import(loaderUrl);

    // Instantiate the WASM module using AssemblyScript loader
    wasmModule = await loaderModule.instantiate(
      await WebAssembly.compile(wasmBytes),
      {
        // No imports needed for this module
      }
    );

    wasmReady = true;
    void 0;
    return true;

  } catch (error) {
    console.error('[HugoScore] ❌ WASM initialization failed:', error);
    wasmReady = false;
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════

export async function analyzeText(text = "") {
  // Ensure WASM is loaded
  if (!wasmReady) {
    const initialized = await initWASM();
    if (!initialized) {
      // Fallback to error state
      return createFallbackResult(text, "WASM initialization failed");
    }
  }

  // Empty text handling
  if (!text || text.trim().length === 0) {
    return createEmptyResult();
  }

  try {
    // Call WASM function (analyzeText takes a string, returns StaticArray<f32>)
    const result = wasmModule.analyzeText(text);

    // Unpack the f32 array returned by WASM
    // [0]=words, [1]=sentiment, [2]=coherence, [3]=tone, [4]=mood,
    // [5]=hri, [6]=hugoScore, [7]=valence, [8]=arousal, [9]=resonance,
    // [10]=confidence, [11]=crisis, [12]=crisisConfidence

    const words_out = Math.round(result[0]);
    const sentiment = Math.round(result[1]);
    const coherence = Math.round(result[2]);
    const tone_val = result[3];
    const mood_val = result[4];
    const hri = result[5];
    const hugoScore = Math.round(result[6]);
    const valence = Math.round(result[7]);
    const arousal = Math.round(result[8]);
    const resonance = Math.round(result[9]);
    const confidence = Math.round(result[10]);
    const crisis_val = result[11];
    const crisisConfidence = Math.round(result[12]);

    // Map numeric codes back to strings
    const tone = tone_val > 0.5 ? "positive" : (tone_val < -0.5 ? "negative" : "neutral");

    const moodMap = ["reflective", "calm", "urgent", "dissonant", "resonant"];
    const mood = moodMap[Math.round(mood_val)] || "reflective";

    const crisisMap = ["safe", "uncertain", "risk"];
    const crisis = crisisMap[Math.round(crisis_val)] || "safe";

    // Calculate HSV (same as original)
    const hsv = calculateHSV(valence, arousal, coherence);

    return {
      // Core metrics
      words: words_out,
      sentiment,
      coherence,
      tone,
      mood,

      // Phase VIII.0: HRI (Hugo Resonance Index)
      hri,
      hugoScore,

      // Phase VI enhancements
      valence,
      arousal,
      resonance,

      // Visual mapping
      hsv,

      // Ethical transparency
      confidence,
      crisis,
      crisisConfidence,

      // Metadata
      flags: {
        shortText: words_out < 5,
        longText: words_out > 150,
        mixedEmotion: resonance > 40,
        highArousal: arousal > 70
      }
    };

  } catch (error) {
    console.error('[HugoScore] ❌ WASM analysis error:', error);
    return createFallbackResult(text, "WASM analysis error: " + error.message);
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

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

function createFallbackResult(text, errorMsg) {
  console.error('[HugoScore]', errorMsg);

  // Simple tokenization for word count
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  return {
    words: wordCount,
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
    confidence: 30, // Low confidence due to fallback
    crisis: "safe",
    crisisConfidence: 0,
    flags: { shortText: wordCount < 5, longText: wordCount > 150, mixedEmotion: false, highArousal: false },
    error: errorMsg
  };
}

function calculateHSV(valence, arousal, coherence) {
  // Map circumplex space to HSV color (same as original)
  let hue;

  if (arousal > 70) {
    hue = valence > 0 ? 45 : 0;
  } else if (arousal < 30) {
    hue = valence > 0 ? 180 : 220;
  } else {
    hue = valence > 0 ? 120 : 280;
  }

  const saturation = Math.min(1, (coherence / 100) + (arousal / 200));
  const vibrancy = Math.min(1, (arousal / 100) + (Math.abs(valence) / 200));

  return [
    Math.round(hue),
    Math.round(saturation * 100) / 100,
    Math.round(vibrancy * 100) / 100
  ];
}

/**
 * Legacy compatibility function
 */
export function classifyMood(analysis) {
  const moodMap = {
    "resonant": "calm",
    "urgent": "urgent",
    "charged": "urgent",
    "dissonant": "dissonant",
    "reflective": "reflective",
    "dim": "dissonant"
  };

  return moodMap[analysis.mood] || "reflective";
}

export default { analyzeText, classifyMood };

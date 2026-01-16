/* ============================================================================
  Expanded Lexicon + Negation Handling (Low Regression Risk)

  Public lexicon source:
  - NRC Emotion Lexicon (Mohammad & Turney, 2013)
    See NOTICE_LEXICONS.md for citation + attribution details.

  Design Principles:
  - Baseline behavior unchanged unless EXPANDED_LEXICON_ENABLED = true
  - No runtime network calls (lexicon data bundled in extension)
  - Conservative negation: reduce contribution within short token window
  - Feature flag OFF by default for Pre-Steven launch
  - Additive only: never replaces core lexicon logic

  Version: v2.14.3+
  Last Updated: 2025-12-23
============================================================================ */

// ============================================================================
// FEATURE FLAGS (disabled by default for low regression risk)
// ============================================================================

export const EXPANDED_LEXICON_ENABLED = false; // Pre-Steven default: OFF
export const NEGATION_ENABLED = false;          // Pre-Steven default: OFF

// Conservative negation defaults
const NEGATION_TOKENS = new Set([
  "not", "no", "never", "without", "neither", "nor",
  "barely", "hardly", "scarcely", "seldom"
]);

const NEGATION_WINDOW = 3;          // negate next N tokens
const NEGATION_MULTIPLIER = 0.25;   // reduce contribution inside window

// VibeAI tone keys (must match existing system in content-parser.js)
const TONES = ["calm", "urgent", "reflective", "dissonant", "resonant"];

// ============================================================================
// TOKENIZATION
// ============================================================================

/**
 * Simple tokenizer for tone detection.
 *
 * Design:
 * - Lowercase normalization
 * - Extracts word-like tokens
 * - Handles contractions (can't, won't, etc.)
 * - Removes punctuation
 *
 * @param {string} text - Raw message text
 * @returns {string[]} - Array of lowercase tokens
 */
export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];

  const lower = text.toLowerCase();

  // Match words including contractions (can't -> "can't")
  // This regex allows apostrophes within words
  const tokens = lower.match(/[a-z]+(?:'[a-z]+)?/g);

  return tokens || [];
}

// ============================================================================
// NEGATION DETECTION
// ============================================================================

/**
 * Builds a boolean array marking tokens within negation windows.
 *
 * Algorithm:
 * 1. Scan tokens left-to-right
 * 2. When negation token found, mark next N tokens as negated
 * 3. Handles contractions ending in "n't" (can't, won't, isn't)
 *
 * Example:
 *   "I am not frustrated at all"
 *   -> ["i", "am", "not", "frustrated", "at", "all"]
 *   -> [F, F, F, T, T, T]  (frustrated/at/all are in negation window)
 *
 * @param {string[]} tokens - Tokenized text
 * @returns {boolean[]} - Negation mask (true if token is negated)
 */
export function computeNegationMask(tokens) {
  const negated = new Array(tokens.length).fill(false);

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    // Check if this is a negation token
    const isNeg =
      NEGATION_TOKENS.has(tok) ||
      tok.endsWith("n't");  // catches can't, won't, isn't, etc.

    if (!isNeg) continue;

    // Mark next N tokens as negated
    for (let j = i + 1; j <= i + NEGATION_WINDOW && j < tokens.length; j++) {
      negated[j] = true;
    }
  }

  return negated;
}

// ============================================================================
// NRC LEXICON LOADING (lazy, cached)
// ============================================================================

let _nrcMapPromise = null;

/**
 * Loads NRC lexicon data bundled with the extension.
 *
 * Format: { "word": ["anger", "fear", "positive", ...], ... }
 *
 * Performance:
 * - Lazy load (only when feature enabled)
 * - Cached in memory after first load
 * - Converted to Map<string, Set<string>> for O(1) lookups
 *
 * @returns {Promise<Map<string, Set<string>>>} - word -> emotion labels
 */
export async function loadNrcLexiconJson() {
  if (_nrcMapPromise) return _nrcMapPromise;

  _nrcMapPromise = (async () => {
    try {
      // Import the JSON file (Vite will bundle this)
      const data = await import('../lexicons/nrc_emotion_lexicon.json');

      // Normalize into Map<string, Set<string>>
      const map = new Map();

      // Handle both default export and named exports
      const lexicon = data.default || data;

      for (const [word, labels] of Object.entries(lexicon)) {
        // Skip metadata fields
        if (word.startsWith('_')) continue;

        if (Array.isArray(labels)) {
          map.set(word, new Set(labels));
        }
      }

      if (window.VIBEAI_PARSER_DEBUG) {
        console.log(`[VibeAI Expanded Lexicon] Loaded ${map.size} NRC words`);
      }
      return map;

    } catch (error) {
      // Only log errors if debug enabled (privacy-safe)
      if (window.VIBEAI_PARSER_DEBUG) {
        console.warn('[VibeAI Expanded Lexicon] Failed to load NRC lexicon:', error);
      }
      return new Map(); // Return empty map on error (graceful degradation)
    }
  })();

  return _nrcMapPromise;
}

let _nrcToneMapPromise = null;

/**
 * Loads NRC emotion -> VibeAI tone mapping.
 *
 * Mapping strategy:
 * - anger/fear/disgust/sadness -> tension
 * - anticipation/surprise -> reflective/urgent
 * - joy/trust/positive -> aligned
 * - negative -> tension (light)
 *
 * @returns {Promise<Object>} - { emotion: {tone, weight}, ... }
 */
export async function loadNrcToneMapping() {
  if (_nrcToneMapPromise) return _nrcToneMapPromise;

  _nrcToneMapPromise = (async () => {
    try {
      const data = await import('../lexicons/nrc_mapping.json');
      const mapping = data.default || data;

      if (window.VIBEAI_PARSER_DEBUG) {
        console.log('[VibeAI Expanded Lexicon] Loaded NRC tone mapping');
      }
      return mapping;

    } catch (error) {
      // Only log errors if debug enabled (privacy-safe)
      if (window.VIBEAI_PARSER_DEBUG) {
        console.warn('[VibeAI Expanded Lexicon] Failed to load NRC mapping:', error);
      }
      return {}; // Return empty object on error
    }
  })();

  return _nrcToneMapPromise;
}

// ============================================================================
// NRC MATCHING
// ============================================================================

/**
 * Adds NRC contributions to tone counts.
 *
 * Algorithm:
 * 1. Tokenize text
 * 2. Compute negation mask (if enabled)
 * 3. For each token:
 *    a. Look up NRC emotions
 *    b. Map emotions to VibeAI tones
 *    c. Apply negation multiplier if token is negated
 *    d. Accumulate weighted contributions
 *
 * Returns:
 *   { calm: 0, urgent: 2.5, reflective: 0, tension: 1.0, aligned: 3.0 }
 *
 * @param {string} text - Message text
 * @returns {Promise<Object>} - Tone counts { tone: number }
 */
export async function matchNrcLexicon(text) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return initToneCounts();

  const negMask = NEGATION_ENABLED
    ? computeNegationMask(tokens)
    : new Array(tokens.length).fill(false);

  const [nrcMap, toneMap] = await Promise.all([
    loadNrcLexiconJson(),
    loadNrcToneMapping()
  ]);

  const counts = initToneCounts();

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    const labels = nrcMap.get(word);

    if (!labels) continue;

    for (const label of labels) {
      const rule = toneMap[label];
      if (!rule) continue;

      const base = typeof rule.weight === 'number' ? rule.weight : 1.0;
      const tone = rule.tone;

      if (!counts.hasOwnProperty(tone)) continue;

      // Apply negation multiplier if token is in negation window
      const mult = negMask[i] ? NEGATION_MULTIPLIER : 1.0;
      counts[tone] += base * mult;
    }
  }

  return counts;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Initializes empty tone counts object.
 *
 * @returns {Object} - { calm: 0, urgent: 0, ... }
 */
export function initToneCounts() {
  const obj = {};
  for (const t of TONES) {
    obj[t] = 0;
  }
  return obj;
}

/**
 * Merges tone counts additively.
 *
 * @param {Object} a - Base counts
 * @param {Object} b - Counts to add
 * @returns {Object} - Merged counts
 */
export function addToneCounts(a, b) {
  const out = { ...a };
  for (const t of Object.keys(b)) {
    out[t] = (out[t] || 0) + (b[t] || 0);
  }
  return out;
}

// ============================================================================
// DEVELOPER UTILITIES (DEV-ONLY - NOT EXPORTED)
// ============================================================================

/**
 * ⚠️ DEV-ONLY: Test harness for negation detection.
 * PRIVACY WARNING: Logs raw text. Do not use with real user content.
 *
 * To use in development:
 * 1. Uncomment function below
 * 2. Run in console with dummy text only
 * 3. Re-comment before committing
 *
 * Example: testNegation("I am not frustrated")
 */

/*
function testNegation(text) {
  const tokens = tokenize(text);
  const mask = computeNegationMask(tokens);

  console.log('[VibeAI Negation Test - DEV ONLY]');
  console.log('Text length:', text.length, 'chars');
  console.log('Tokens:', tokens);
  console.log('Negation Mask:', mask);

  tokens.forEach((tok, i) => {
    console.log(`  ${i}: "${tok}" -> ${mask[i] ? 'NEGATED' : 'normal'}`);
  });
}
*/

/**
 * ⚠️ DEV-ONLY: Test harness for NRC matching.
 * PRIVACY WARNING: Logs raw text. Do not use with real user content.
 *
 * To use in development:
 * 1. Uncomment function below
 * 2. Run in console with dummy text only
 * 3. Re-comment before committing
 *
 * Example: await testNrc("I feel joyful and anxious")
 */

/*
async function testNrc(text) {
  const counts = await matchNrcLexicon(text);

  console.log('[VibeAI NRC Test - DEV ONLY]');
  console.log('Text length:', text.length, 'chars');
  console.log('Tone Counts:', counts);
  console.log('Total contributions:', Object.values(counts).reduce((a, b) => a + b, 0));
}
*/

// ============================================================================
// EXPORTS (Production-safe only)
// ============================================================================

export default {
  EXPANDED_LEXICON_ENABLED,
  NEGATION_ENABLED,
  tokenize,
  computeNegationMask,
  loadNrcLexiconJson,
  loadNrcToneMapping,
  matchNrcLexicon,
  initToneCounts,
  addToneCounts
  // testNegation, testNrc removed for privacy (see commented code above)
};

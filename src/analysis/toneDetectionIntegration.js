/* ============================================================================
  Tone Detection Integration Layer (v2.14.3+)

  Purpose:
  - Provides a drop-in wrapper for existing detectTone() function
  - Adds optional NRC lexicon + negation handling
  - Zero regression risk: baseline unchanged when feature flags OFF
  - Additive only: NRC contributions are ADDED to baseline scores

  Integration:
  - Import this in content-parser.js
  - Replace detectTone() call with detectToneWithExpansion()
  - Feature flags default to OFF for Pre-Steven launch

  Version: v2.14.3+
  Last Updated: 2025-12-23
============================================================================ */

import {
  EXPANDED_LEXICON_ENABLED,
  NEGATION_ENABLED,
  matchNrcLexicon,
  addToneCounts
} from './expandedLexicon.js';

// ============================================================================
// BASELINE TONE DETECTION (preserve existing logic)
// ============================================================================

/**
 * Baseline tone detection (exact copy of content-parser.js logic).
 *
 * This ensures zero regression risk - baseline behavior is preserved
 * even if imports fail or feature flags are OFF.
 *
 * @param {string} text - Message content
 * @returns {Object} - { tone: string, scores: Object }
 */
export function detectToneBaseline(text) {
  const lower = text.toLowerCase();

  // Keyword patterns for each tone (exact match to content-parser.js)
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

  if (max === 0) {
    return { tone: 'calm', scores }; // Default to calm if no keywords
  }

  const dominant = entries.find(([_, v]) => v === max);
  const tone = dominant ? dominant[0] : 'calm';

  return { tone, scores };
}

// ============================================================================
// EXPANDED TONE DETECTION (with NRC + negation)
// ============================================================================

/**
 * Enhanced tone detection with optional NRC lexicon + negation.
 *
 * Algorithm:
 * 1. Run baseline tone detection (always)
 * 2. If EXPANDED_LEXICON_ENABLED: add NRC contributions
 * 3. Recalculate dominant tone from combined scores
 * 4. Return tone string (compatible with existing code)
 *
 * @param {string} text - Message content
 * @returns {string} - Dominant tone ('calm', 'urgent', etc.)
 */
export async function detectToneWithExpansion(text) {
  // Always run baseline first (zero regression risk)
  const baseline = detectToneBaseline(text);

  // Feature flag OFF: return baseline immediately
  if (!EXPANDED_LEXICON_ENABLED) {
    return baseline.tone;
  }

  try {
    // Feature flag ON: add NRC contributions
    const nrcCounts = await matchNrcLexicon(text);

    // Merge baseline + NRC scores
    const combinedScores = addToneCounts(baseline.scores, nrcCounts);

    // Recalculate dominant tone
    const entries = Object.entries(combinedScores);
    const max = Math.max(...entries.map(([_, v]) => v));

    if (max === 0) return 'calm';

    const dominant = entries.find(([_, v]) => v === max);
    const tone = dominant ? dominant[0] : 'calm';

    // Debug logging (respects privacy gate)
    if (window.VIBEAI_PARSER_DEBUG) {
      console.log('[VibeAI Expanded] Baseline:', baseline.scores, '→', baseline.tone);
      console.log('[VibeAI Expanded] NRC:', nrcCounts);
      console.log('[VibeAI Expanded] Combined:', combinedScores, '→', tone);
    }

    return tone;

  } catch (error) {
    // Graceful degradation: if expansion fails, return baseline
    // Only log errors if debug enabled (privacy-safe)
    if (window.VIBEAI_PARSER_DEBUG) {
      console.warn('[VibeAI Expanded] Feature error, falling back to baseline:', error);
    }
    return baseline.tone;
  }
}

// ============================================================================
// FUTURE INTEGRATION (NOT FOR PRE-STEVEN)
// ============================================================================

/**
 * ⚠️ DO NOT INTEGRATE INTO content-parser.js FOR STEVEN BETA
 *
 * This module is ready for Post-Steven activation, but should NOT be
 * wired into the existing pipeline yet because:
 *
 * 1. Current pipeline is synchronous (enrichThreads is not async)
 * 2. Making detectTone() async requires callsite rewrites
 * 3. Steven beta must use baseline-only (zero regression)
 *
 * FUTURE INTEGRATION (Post-Steven):
 * Option A: Background enrichment (non-blocking)
 *   - Keep existing detectTone() synchronous (baseline)
 *   - Add optional async enrichment pass in background worker
 *
 * Option B: Async pipeline (requires more work)
 *   - Make enrichThreads() async
 *   - Update all callsites to await
 *   - Extensive cross-platform testing required
 *
 * For now, this module exists but is NOT imported anywhere.
 */
export async function detectTone(text) {
  return await detectToneWithExpansion(text);
}

// ============================================================================
// SYNCHRONOUS FALLBACK (for non-async contexts)
// ============================================================================

/**
 * Synchronous version (baseline only, ignores expansion).
 *
 * Use this if you cannot await (e.g., in synchronous event handlers).
 * Always returns baseline tone detection.
 */
export function detectToneSync(text) {
  return detectToneBaseline(text).tone;
}

// ============================================================================
// DEVELOPER UTILITIES
// ============================================================================

/**
 * Get detailed tone scores (for debugging/testing).
 *
 * @param {string} text - Message content
 * @returns {Promise<Object>} - { baseline, nrc, combined, tone }
 */
export async function getToneScoresDetailed(text) {
  const baseline = detectToneBaseline(text);

  if (!EXPANDED_LEXICON_ENABLED) {
    return {
      baseline: baseline.scores,
      nrc: null,
      combined: baseline.scores,
      tone: baseline.tone,
      mode: 'baseline-only'
    };
  }

  const nrcCounts = await matchNrcLexicon(text);
  const combinedScores = addToneCounts(baseline.scores, nrcCounts);

  const entries = Object.entries(combinedScores);
  const max = Math.max(...entries.map(([_, v]) => v));
  const dominant = entries.find(([_, v]) => v === max);
  const tone = dominant ? dominant[0] : 'calm';

  return {
    baseline: baseline.scores,
    nrc: nrcCounts,
    combined: combinedScores,
    tone: tone,
    mode: 'baseline+nrc'
  };
}

/**
 * ⚠️ DEV-ONLY: Test harness for integration.
 * PRIVACY WARNING: Logs raw text. Do not use with real user content.
 *
 * To use in development:
 * 1. Uncomment function below
 * 2. Run in console with dummy text only
 * 3. Re-comment before committing
 *
 * Example: await testIntegration("I feel anxious but not angry")
 */

/*
async function testIntegration(text) {
  console.log('[VibeAI Integration Test - DEV ONLY]');
  console.log('Text length:', text.length, 'chars');
  console.log('Negation enabled:', NEGATION_ENABLED);
  console.log('Expansion enabled:', EXPANDED_LEXICON_ENABLED);
  console.log('---');

  const detailed = await getToneScoresDetailed(text);

  console.log('Baseline scores:', detailed.baseline);
  if (detailed.nrc) {
    console.log('NRC contributions:', detailed.nrc);
    console.log('Combined scores:', detailed.combined);
  }
  console.log('Final tone:', detailed.tone);
  console.log('Mode:', detailed.mode);
}
*/

// ============================================================================
// EXPORTS (Production-safe only)
// ============================================================================

export default {
  detectTone,
  detectToneSync,
  detectToneBaseline,
  detectToneWithExpansion,
  getToneScoresDetailed
  // testIntegration removed for privacy (see commented code above)
};

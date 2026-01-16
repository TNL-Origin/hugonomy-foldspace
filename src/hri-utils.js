/**
 * HRI (Hugo Resonance Index) - Normalization & Migration Utilities
 *
 * HRI (Hugo Resonance Index): internal 0.0–1.0 measure of conversation resonance.
 * Replaces legacy "HugoScore" naming. UI should not show numeric values.
 * User-facing language: "Conversation Resonance" / "FoldSpace Canvas"
 *
 * This module provides backward-compatible helpers for migrating from HugoScore (0-100)
 * to HRI (0.0-1.0) without breaking existing functionality.
 *
 * @module hri-utils
 * @version 1.0.0
 */

/**
 * Normalizes resonance data from various legacy formats to HRI standard
 * Accepts: hri, resonance_index, hugo_score, score, hugoScore
 * Returns: standardized payload with hri field (0.0-1.0)
 *
 * @param {Object} payload - Analysis payload from any source
 * @returns {Object} - Normalized payload with hri field
 */
export function normalizeResonance(payload = {}) {
  // HRI = Hugo Resonance Index (0.0-1.0). UI should not show numeric.
  let rawValue = null;

  // Priority order: hri > resonance_index > hugo_score > hugoScore > score
  if (typeof payload.hri === 'number') {
    rawValue = payload.hri;
  } else if (typeof payload.resonance_index === 'number') {
    rawValue = payload.resonance_index;
  } else if (typeof payload.hugo_score === 'number') {
    rawValue = payload.hugo_score / 100; // Convert 0-100 to 0-1
  } else if (typeof payload.hugoScore === 'number') {
    rawValue = payload.hugoScore / 100; // Convert 0-100 to 0-1
  } else if (typeof payload.score === 'number') {
    rawValue = payload.score / 100; // Convert 0-100 to 0-1
  }

  // Clamp safely to 0.0-1.0 range
  const hri = (typeof rawValue === 'number' && isFinite(rawValue))
    ? Math.max(0, Math.min(1, rawValue))
    : null;

  return {
    ...payload,
    hri,
    // Keep legacy field for backward compatibility during transition
    hugoScore: hri !== null ? Math.round(hri * 100) : null
  };
}

/**
 * Migrates storage from legacy keys to HRI keys (non-destructive)
 * Reads: vibeai_hri, vibeai_hugo_score, vibeai_score
 * Writes: vibeai_hri (if not already present)
 *
 * @returns {Promise<number>} - HRI value (0.0-1.0) or 0 if none found
 */
export async function getStoredHri() {
  const keys = ['vibeai_hri', 'vibeai_hugo_score', 'vibeai_score'];

  let stored;
  try {
    stored = await chrome.storage.local.get(keys);
  } catch (err) {
    console.warn('[HRI Utils] Storage read failed:', err);
    return 0;
  }

  // Priority: vibeai_hri > vibeai_hugo_score > vibeai_score
  let rawValue = null;

  if (typeof stored.vibeai_hri === 'number') {
    rawValue = stored.vibeai_hri;
  } else if (typeof stored.vibeai_hugo_score === 'number') {
    rawValue = stored.vibeai_hugo_score / 100; // Convert 0-100 to 0-1
  } else if (typeof stored.vibeai_score === 'number') {
    rawValue = stored.vibeai_score / 100; // Convert 0-100 to 0-1
  }

  const hri = (typeof rawValue === 'number' && isFinite(rawValue))
    ? Math.max(0, Math.min(1, rawValue))
    : 0;

  // One-time migration (non-destructive - keeps old keys)
  if (stored.vibeai_hri === undefined && (stored.vibeai_hugo_score !== undefined || stored.vibeai_score !== undefined)) {
    try {
      await chrome.storage.local.set({ vibeai_hri: hri });
      console.log(`[HRI Utils] ✅ Migrated legacy score to HRI: ${hri.toFixed(3)}`);
    } catch (err) {
      console.warn('[HRI Utils] Migration write failed:', err);
    }
  }

  return hri;
}

/**
 * Stores HRI value (writes to both new and legacy keys for compatibility)
 *
 * @param {number} hri - HRI value (0.0-1.0)
 * @returns {Promise<void>}
 */
export async function setStoredHri(hri) {
  const clamped = Math.max(0, Math.min(1, hri));
  const legacyScore = Math.round(clamped * 100);

  try {
    await chrome.storage.local.set({
      vibeai_hri: clamped,
      vibeai_hugo_score: legacyScore, // Keep for backward compatibility
      vibeai_last_hri: clamped // Alias
    });
    console.log(`[HRI Utils] ✅ Stored HRI: ${clamped.toFixed(3)} (legacy: ${legacyScore})`);
  } catch (err) {
    console.warn('[HRI Utils] Storage write failed:', err);
  }
}

/**
 * Converts HRI (0.0-1.0) to legacy HugoScore (0-100) for backward compatibility
 *
 * @param {number} hri - HRI value (0.0-1.0)
 * @returns {number} - Legacy score (0-100)
 */
export function hriToLegacyScore(hri) {
  return Math.round(Math.max(0, Math.min(1, hri)) * 100);
}

/**
 * Converts legacy HugoScore (0-100) to HRI (0.0-1.0)
 *
 * @param {number} score - Legacy score (0-100)
 * @returns {number} - HRI value (0.0-1.0)
 */
export function legacyScoreToHri(score) {
  return Math.max(0, Math.min(1, score / 100));
}

/**
 * Gets resonance level label for UI display
 * Does NOT show numeric value - uses qualitative labels
 *
 * @param {number} hri - HRI value (0.0-1.0)
 * @returns {string} - Resonance level label
 */
export function getResonanceLabel(hri) {
  if (hri >= 0.85) return 'High Resonance';
  if (hri >= 0.70) return 'Strong Resonance';
  if (hri >= 0.50) return 'Moderate Resonance';
  if (hri >= 0.35) return 'Low Resonance';
  return 'Minimal Resonance';
}

/**
 * Gets resonance color for visualization
 *
 * @param {number} hri - HRI value (0.0-1.0)
 * @returns {string} - Hex color code
 */
export function getResonanceColor(hri) {
  if (hri >= 0.70) return '#7bff6a'; // Green - high resonance
  if (hri >= 0.50) return '#00d4ff'; // Cyan - moderate resonance
  if (hri >= 0.35) return '#ffcc00'; // Yellow - low resonance
  return '#ff4f4f'; // Red - minimal/drift
}

// Global aliases for backward compatibility (Phase VIII.0)
if (typeof window !== 'undefined') {
  // Expose to window for legacy code access
  window.VIBEAI_HRI_UTILS = {
    normalizeResonance,
    getStoredHri,
    setStoredHri,
    hriToLegacyScore,
    legacyScoreToHri,
    getResonanceLabel,
    getResonanceColor
  };

  // Legacy global migration (will be deprecated in Phase IX)
  window.VIBEAI_LAST_HRI = window.VIBEAI_LAST_SCORE || 0;
}

export default {
  normalizeResonance,
  getStoredHri,
  setStoredHri,
  hriToLegacyScore,
  legacyScoreToHri,
  getResonanceLabel,
  getResonanceColor
};

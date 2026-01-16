/**
 * toneDrift.js — Temporal Tone Smoother
 * Version: V.10.2-P2.5 "Drift Trail"
 *
 * Maintains a sliding 5-second tone buffer with exponential decay,
 * creating organic "breathing" transitions instead of abrupt color snaps.
 *
 * Implements weighted moving average with exponential smoothing to
 * preserve emotional residue before blending into new states.
 */

const MAX_DRIFT_HISTORY = 10;      // roughly 5s at ~500ms sampling
const DRIFT_DECAY = 0.85;          // exponential smoothing factor

let toneHistory = [];

/**
 * Add a new tone value to the drift buffer
 * @param {number} value - Tone score (-1 to +1)
 */
export function pushTone(value) {
  toneHistory.push(value);
  if (toneHistory.length > MAX_DRIFT_HISTORY) {
    toneHistory.shift(); // FIFO eviction
  }
}

/**
 * Compute drifted tone using weighted moving average
 * @param {number} current - Latest raw tone score
 * @returns {number} Smoothed tone score with temporal memory
 */
export function computeDriftedTone(current) {
  if (toneHistory.length === 0) {
    pushTone(current);
    return current;
  }

  // Weighted average with exponential decay
  let weightSum = 0;
  let smoothed = 0;
  let weight = 1;

  // Traverse history from newest to oldest
  for (let i = toneHistory.length - 1; i >= 0; i--) {
    smoothed += toneHistory[i] * weight;
    weightSum += weight;
    weight *= DRIFT_DECAY; // decay older values
  }

  const drifted = smoothed / weightSum;

  // Blend drifted average with latest input (50/50)
  // This creates "breathing" — field holds memory but responds to present
  const blended = (drifted + current) / 2;

  pushTone(current);
  return blended;
}

/**
 * Clear drift history (useful on tab change or reset)
 */
export function clearDrift() {
  toneHistory = [];
  console.log('[ToneDrift] History cleared');
}

/**
 * Get current drift buffer size (for debugging)
 * @returns {number} Number of tone values in buffer
 */
export function getDriftBufferSize() {
  return toneHistory.length;
}

/**
 * VibeAI Consent Helper
 * v2.16.0 — Chamlin Audit Fix (Fix 2)
 *
 * Single authoritative consent contract for all engine modules.
 * All engine modules call window.VibeConsentHelper.isConsented()
 * instead of reading window.__VIBEAI__.consentGiven directly.
 *
 * This means if the consent source changes in unified-hud.js,
 * only this file needs updating. One contract. One place.
 *
 * Load order: FIRST among engine modules, before all four.
 *
 * Pattern: IIFE + window globals (no ESM imports)
 */

(function () {
  'use strict';

  /**
   * Check whether the user has given consent.
   * Reads from window.__VIBEAI__.consentGiven — the value set by
   * consent-script.js and mirrored into __VIBEAI__ by unified-hud.js.
   *
   * Returns false on any error or missing state.
   * Never throws.
   *
   * @returns {boolean}
   */
  function isConsented() {
    try {
      return !!(window.__VIBEAI__ && window.__VIBEAI__.consentGiven === true);
    } catch (e) {
      return false;
    }
  }

  window.VibeConsentHelper = {
    isConsented
  };

  console.log('[VibeAI ConsentHelper] Loaded v2.16.0');
})();

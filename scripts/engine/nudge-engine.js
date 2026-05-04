/**
 * VibeAI Nudge Engine
 * v2.16.0 — Phase 1 Engine Module
 *
 * Manages nudge lifecycle: stage skip detection -> nudge copy -> cooldown.
 *
 * Rules (Council-approved):
 *   - Consent gate: never fires without window.VibeConsentHelper.isConsented()
 *   - One-time onboarding nudge on first activation
 *   - One nudge per stage transition; never repeats until dismissed
 *   - 90-second cooldown after any nudge fires
 *   - Bias toward specificity: only nudge when confidence is sufficient
 *   - No nudge during cooldown window
 *
 * Emits: CustomEvent 'vibeai:nudgeReady' on window
 *   detail: { message: string, type: 'onboarding'|'skip', stage: string, timestamp: number }
 *
 * Pattern: IIFE + window globals (no ESM imports)
 * Dependencies: consent-helper.js and stage-detector.js must be loaded first
 */

(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────────────────────

  const COOLDOWN_MS       = 90 * 1000; // 90 seconds
  const STORAGE_KEY_ONBOARDED = 'vibeai_onboarded';
  const ONBOARDING_MESSAGE = 'VibeAI watches how you think, not what you say.';

  // ─── Nudge copy bank (indexed by skip pattern) ────────────────────────────

  // Key format: "fromStage->toStage"
  const NUDGE_COPY = {
    'Exploring->Accepting':  'Quick accept — add your own thinking?',
    'Evaluating->Accepting': 'Does this fully match what you intended?',
    'Refining->Accepting':   'Satisfied, or is there more to explore?',
    'Exploring->Refining':   'What\'s driving the revision?',
    // Fallback for any other unexpected skip
    'default':               'Pause — does this feel right?'
  };

  // ─── State ─────────────────────────────────────────────────────────────────

  let lastNudgeTime              = 0;
  let isDismissed                = false;   // True while cooldown active after dismiss
  let pendingNudgeMessage        = null;
  let onboardingShown            = false;   // Cached after first storage read
  let onboardingCheckInFlight    = false;   // Fix 3: flight guard against duplicate async calls

  // ─── Consent check (Fix 2) ─────────────────────────────────────────────────
  // Delegates to VibeConsentHelper — the single authoritative consent contract.
  // Falls back gracefully if consent-helper.js failed to load.

  function isConsentGiven() {
    try {
      if (window.VibeConsentHelper) return window.VibeConsentHelper.isConsented();
      // Fallback: read directly (should not happen if load order is correct)
      return !!(window.__VIBEAI__ && window.__VIBEAI__.consentGiven === true);
    } catch (e) {
      return false;
    }
  }

  // ─── Cooldown check ────────────────────────────────────────────────────────

  function isInCooldown() {
    return (Date.now() - lastNudgeTime) < COOLDOWN_MS;
  }

  // ─── Nudge emission ────────────────────────────────────────────────────────

  function emitNudge(message, type, stage) {
    // v2.20.1: Onboarding nudge is informational — don't start cooldown.
    // Only stage-skip nudges should block subsequent nudges.
    if (type !== 'onboarding') lastNudgeTime = Date.now();
    pendingNudgeMessage = message;

    const detail = {
      message,
      type,
      stage: stage || null,
      isPassive: stage === 'Accepting',
      timestamp: lastNudgeTime
    };

    try {
      window.dispatchEvent(new CustomEvent('vibeai:nudgeReady', { detail }));
      console.log('[VibeAI NudgeEngine] Nudge emitted:', type, '|', message);
    } catch (e) {
      console.warn('[VibeAI NudgeEngine] Failed to emit nudge event', e);
    }
  }

  // ─── Onboarding nudge ──────────────────────────────────────────────────────

  /**
   * Show the one-time onboarding nudge.
   * Fires once ever, stored in chrome.storage.local.
   * Respects consent gate.
   */
  function checkAndShowOnboarding() {
    if (!isConsentGiven()) return;
    if (onboardingShown) return;
    // Fix 3: flight guard — if an async check is already in-flight, do not start another.
    // This prevents duplicate onboarding nudges on rapid successive calls.
    if (onboardingCheckInFlight) return;
    onboardingCheckInFlight = true;

    try {
      chrome.storage.local.get([STORAGE_KEY_ONBOARDED], function (result) {
        onboardingCheckInFlight = false; // Release guard on completion

        if (chrome.runtime.lastError) {
          console.warn('[VibeAI NudgeEngine] Storage read error:', chrome.runtime.lastError);
          return;
        }

        if (result[STORAGE_KEY_ONBOARDED]) {
          onboardingShown = true;
          return;
        }

        // First time — persist flag BEFORE emitting to prevent race on re-entry
        onboardingShown = true;
        const payload = {};
        payload[STORAGE_KEY_ONBOARDED] = true;
        chrome.storage.local.set(payload);

        emitNudge(ONBOARDING_MESSAGE, 'onboarding', null);
      });
    } catch (e) {
      onboardingCheckInFlight = false; // Release guard on error
      console.warn('[VibeAI NudgeEngine] Onboarding check failed', e);
    }
  }

  // ─── Stage skip nudge ──────────────────────────────────────────────────────

  /**
   * Determine nudge copy for a detected skip.
   * Uses the previous stage + current stage as key.
   *
   * @param {string} currentStage
   * @returns {string} Nudge message
   */
  function getNudgeCopy(currentStage) {
    const history = (window.__VIBEAI__ && window.__VIBEAI__.stageHistory) || [];
    // Find the last stage before the current one
    const prevStages = history.slice(0, -1); // exclude the latest which is currentStage
    const prevStage = [...prevStages].reverse().find(s => s !== currentStage);

    if (prevStage) {
      const key = `${prevStage}->${currentStage}`;
      return NUDGE_COPY[key] || NUDGE_COPY['default'];
    }
    return NUDGE_COPY['default'];
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Call this whenever the stage detector produces a new result.
   * Decides whether to fire a nudge based on skip detection + cooldown + consent.
   *
   * @param {{ stage: string, skipDetected: boolean }} stageResult
   */
  function onStageUpdate(stageResult) {
    if (!stageResult) return;

    // Consent is a hard precondition for all nudges
    if (!isConsentGiven()) {
      console.log('[VibeAI NudgeEngine] Suppressed — no consent');
      return;
    }

    // Phase 3: Focus Mode — time-based override, suppresses nudges
    try {
      const snoozeUntil = localStorage.getItem('vibeai_snooze_until');
      if (snoozeUntil && Date.now() < Number(snoozeUntil)) {
        console.log('[VibeAI NudgeEngine] Suppressed — Focus Mode active');
        return;
      }
      if (snoozeUntil && Date.now() >= Number(snoozeUntil)) {
        localStorage.removeItem('vibeai_snooze_until'); // auto-clear expired snooze
      }
    } catch (e) { /* ignore */ }

    // v2.18.0: HUD closed this session — user opted out of this surface
    if (window.__VIBEAI__ && window.__VIBEAI__.hudClosed) {
      console.log('[VibeAI NudgeEngine] Suppressed — HUD closed');
      return;
    }

    // Skip nudge if in cooldown
    if (isInCooldown()) {
      console.log('[VibeAI NudgeEngine] Suppressed — cooldown active');
      return;
    }

    // No skip detected — nothing to nudge about
    if (!stageResult.skipDetected) return;

    const message = getNudgeCopy(stageResult.stage);
    emitNudge(message, 'skip', stageResult.stage);
  }

  /**
   * Dismiss the current nudge. Starts cooldown.
   * Call this when the user explicitly closes or ignores the nudge.
   */
  function dismiss() {
    pendingNudgeMessage = null;
    lastNudgeTime = Date.now(); // Restart cooldown on explicit dismiss
    isDismissed = true;

    // Reset dismissed flag after cooldown expires
    setTimeout(function () {
      isDismissed = false;
    }, COOLDOWN_MS);

    try {
      window.dispatchEvent(new CustomEvent('vibeai:nudgeDismissed', {
        detail: { timestamp: Date.now() }
      }));
    } catch (e) { /* ignore */ }

    console.log('[VibeAI NudgeEngine] Nudge dismissed. Cooldown:', COOLDOWN_MS / 1000, 's');
  }

  /**
   * Get the currently pending nudge message, if any.
   * Returns null if no active nudge.
   */
  function getPendingNudge() {
    if (isInCooldown() && pendingNudgeMessage) {
      return pendingNudgeMessage;
    }
    return null;
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  window.VibeNudgeEngine = {
    onStageUpdate,
    dismiss,
    getPendingNudge,
    checkAndShowOnboarding,
    // Exposed for testing
    isConsentGiven,
    isInCooldown
  };

  // Fix 5: expose pendingNudge as a live-readable property.
  // Phase 2 HUD listener MUST check this (not trust event payload alone)
  // before rendering the nudge strip. Null means no active nudge.
  Object.defineProperty(window.VibeNudgeEngine, 'pendingNudge', {
    get: function () { return pendingNudgeMessage; },
    enumerable: true
  });

  console.log('[VibeAI NudgeEngine] Loaded v2.16.0');
})();

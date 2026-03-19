/**
 * VibeAI Stage Detector
 * v2.16.0 — Phase 1 Engine Module
 *
 * Maps incoming heuristic analysis to Reasoning Path stages:
 *   Exploring -> Evaluating -> Refining -> Accepting
 *
 * Consumes: window.VibeHeuristics.analyze()
 * Emits:    window.__VIBEAI__.currentStage
 *           window.__VIBEAI__.stageSkipDetected
 *           window.__VIBEAI__.stageHistory
 *
 * Pattern: IIFE + window globals (no ESM imports)
 * Dependencies: heuristics.js must be loaded first
 */

(function () {
  'use strict';

  // ─── Stage constants ───────────────────────────────────────────────────────

  const STAGES = Object.freeze({
    EXPLORING:  'Exploring',
    EVALUATING: 'Evaluating',
    REFINING:   'Refining',
    ACCEPTING:  'Accepting'
  });

  // ─── Text pattern banks for stage classification ───────────────────────────

  // Accepting: completion and acknowledgment signals
  const ACCEPTING_PATTERNS = [
    /\b(thanks|thank you|perfect|great|that works|looks good|got it|makes sense|understood|yes|ok|okay|done|done!|awesome|excellent|confirmed|will do|sounds good)\b/gi,
    /^(yes|no|ok|okay|sure|yep|nope|correct|exactly|right|agreed)\.?$/i
  ];

  // Refining: explicit revision and iteration signals
  const REFINING_PATTERNS = [
    /\b(rewrite|rephrase|change|update|edit|revise|redo|redo this|try again|try that again|instead|actually|make it|adjust|modify|fix this|improve this|tweak)\b/gi,
    /\b(different|shorter|longer|simpler|clearer|more specific|less|more like)\b/gi
  ];

  // Evaluating: comparison and analytical reasoning signals
  const EVALUATING_PATTERNS = [
    /\b(compare|which is|which one|better|worse|pros|cons|versus|vs\.?|difference|differences|similar|analyze|analyse|assess|evaluate|weigh|trade.?off|tradeoffs?)\b/gi,
    /\b(advantages?|disadvantages?|benefits?|drawbacks?|strengths?|weaknesses?|options?|alternatives?)\b/gi
  ];

  // ─── History tracking ──────────────────────────────────────────────────────

  const MAX_HISTORY = 8;
  let stageHistory = [];    // Array of stage strings, most recent last
  let lastStageTime = 0;    // Timestamp of last stage classification

  // ─── Pattern matching helper ───────────────────────────────────────────────

  function matchesAny(text, patterns) {
    for (const rx of patterns) {
      rx.lastIndex = 0; // Reset stateful regex flags
      if (rx.test(text)) return true;
    }
    return false;
  }

  // ─── Core classification ───────────────────────────────────────────────────

  /**
   * Classify a message into a Reasoning Path stage.
   *
   * Priority order (highest to lowest):
   *   1. Accepting — explicit completion language + short message
   *   2. Refining  — explicit revision language OR FRUSTRATION heuristic state
   *   3. Evaluating — comparison/analytical language OR CLARITY heuristic state
   *   4. Exploring — default (CONFUSION, NEUTRAL, open questions)
   *
   * @param {string} text - Message text
   * @param {object} heuristicResult - Output of window.VibeHeuristics.analyze()
   * @returns {string} Stage name
   */
  function classifyStage(text, heuristicResult) {
    const clean = (text || '').trim();
    const wordCount = clean.split(/\s+/).filter(Boolean).length;
    const hState = (heuristicResult && heuristicResult.state) || 'NEUTRAL';
    const hConf  = (heuristicResult && heuristicResult.confidence) || 0;

    // v2.18.1: Active-intent guard — revision/evaluation language outranks completion language.
    // Prevents short active prompts (e.g. "rewrite this", "compare these two") from
    // collapsing into Accepting. Checked once here, applied to both Accepting rules below.
    const hasActiveIntent = matchesAny(clean, REFINING_PATTERNS) || matchesAny(clean, EVALUATING_PATTERNS);

    // v2.18.1: Code-like pattern guard — bare code/snippets are active work, never passive.
    // Catches: function declarations, const/let/var, arrow syntax, brackets, semicolons.
    const isCodeLike = /[{()[\]=><;]/.test(clean) ||
      /\b(function|const|let|var|def|class|return|import|export)\b/i.test(clean);

    // 1. Accepting: short message (≤20 words) with completion language
    //    Guard: if message also contains active intent (refine/evaluate), treat as active.
    if (wordCount <= 20 && matchesAny(clean, ACCEPTING_PATTERNS) && !hasActiveIntent) {
      return STAGES.ACCEPTING;
    }
    // Short neutral fallback — reserved for true acknowledgments only (single word/grunt).
    // Guard: code patterns and active intent both excluded from this fallback.
    if (wordCount <= 3 && hState === 'NEUTRAL' && !hasActiveIntent && !isCodeLike) {
      return STAGES.ACCEPTING;
    }

    // 2. Refining: revision language OR high-confidence FRUSTRATION
    //    (FRUSTRATION = user pushing back after unsatisfactory answer)
    if (matchesAny(clean, REFINING_PATTERNS)) {
      return STAGES.REFINING;
    }
    if (hState === 'FRUSTRATION' && hConf >= 0.65) {
      return STAGES.REFINING;
    }
    // URGENCY can also indicate pushing toward completion/refine
    if (hState === 'URGENCY' && hConf >= 0.7 && wordCount < 30) {
      return STAGES.REFINING;
    }

    // 3. Evaluating: comparison language OR structured CLARITY
    if (matchesAny(clean, EVALUATING_PATTERNS)) {
      return STAGES.EVALUATING;
    }
    if (hState === 'CLARITY' && hConf >= 0.65 && wordCount >= 10) {
      return STAGES.EVALUATING;
    }

    // 4. Exploring: everything else
    //    CONFUSION, NEUTRAL without completion signals, open questions
    return STAGES.EXPLORING;
  }

  // ─── Skip detection ────────────────────────────────────────────────────────

  /**
   * Detect if the user skipped meaningful reasoning stages.
   *
   * A skip is defined as: the last distinct stage before the current one
   * was Exploring, and the current stage is Accepting, without Evaluating
   * or Refining having appeared in the recent history window.
   *
   * @param {string} newStage
   * @returns {boolean}
   */
  function detectSkip(newStage) {
    if (newStage !== STAGES.ACCEPTING) return false;

    // Look back through recent history for the sequence
    const recent = stageHistory.slice(-5);

    // Cold-start: history is empty because the extension loaded mid-conversation.
    // Treat Accepting on a cold session as a valid nudge opportunity — the user
    // likely did real work before the extension was present.
    if (recent.length === 0) return true;

    const lastMeaningful = [...recent].reverse().find(s => s !== STAGES.ACCEPTING);
    if (!lastMeaningful) return false;

    // Any transition TO Accepting from a meaningful engagement stage is a nudge
    // opportunity — regardless of which stage preceded it.
    // Exploring->Accepting: user never evaluated/refined before accepting
    // Evaluating->Accepting: user was comparing but then just accepted
    // Refining->Accepting: user was revising (e.g. Claude.ai task completions) then accepted
    // All three warrant a Thinking Mirror moment.
    return true;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Update stage detection with new message text.
   * Called once per new user message.
   *
   * @param {string} text - User's prompt text
   * @param {object} [heuristicHistory={}] - History object for VibeHeuristics
   * @returns {{ stage: string, skipDetected: boolean, confidence: string }}
   */
  function update(text, heuristicHistory) {
    // Use heuristics if available; fall back to text-only classification so stage
    // detection works on all platforms even if heuristics.js hasn't loaded yet,
    // or if analyze() throws on unexpected input (e.g. very long Claude responses).
    let hResult = null;
    try {
      if (typeof window.VibeHeuristics !== 'undefined') {
        hResult = window.VibeHeuristics.analyze(text, heuristicHistory || {});
      }
    } catch (e) { /* heuristic analysis failed — text-only classification still runs */ }
    const stage   = classifyStage(text, hResult);
    const skip    = detectSkip(stage);

    // Update history
    stageHistory.push(stage);
    if (stageHistory.length > MAX_HISTORY) {
      stageHistory.shift();
    }
    lastStageTime = Date.now();

    // Write to shared __VIBEAI__ namespace
    try {
      window.__VIBEAI__ = window.__VIBEAI__ || {};
      window.__VIBEAI__.currentStage       = stage;
      window.__VIBEAI__.stageSkipDetected  = skip;
      window.__VIBEAI__.stageHistory       = stageHistory.slice(); // copy
      window.__VIBEAI__.lastStageTime      = lastStageTime;
    } catch (e) {
      console.warn('[VibeAI StageDetector] Could not write to __VIBEAI__', e);
    }

    void 0;

    return {
      stage,
      skipDetected: skip,
      heuristicState: hResult ? hResult.state : 'NEUTRAL',
      heuristicConfidence: hResult ? hResult.confidence : 0
    };
  }

  /**
   * Inject a synthetic prior stage for cold-start sessions.
   * Call on phase2 init when the extension loads on an existing conversation.
   * The synthetic flag is stored as metadata only — it does not affect classification.
   *
   * @param {string} [stage='Exploring'] - Stage to inject as prior baseline
   */
  function seedSynthetic(stage) {
    const syntheticStage = stage || STAGES.EXPLORING;
    if (stageHistory.length === 0) {
      stageHistory.push(syntheticStage);
      try {
        window.__VIBEAI__ = window.__VIBEAI__ || {};
        window.__VIBEAI__.stageHistory = stageHistory.slice();
        window.__VIBEAI__.__syntheticSeed = true; // audit flag
      } catch (e) { /* ignore */ }
      void 0;
    }
  }

  /**
   * Reset stage history (e.g., on new session or page navigation).
   */
  function reset() {
    stageHistory = [];
    lastStageTime = 0;
    try {
      window.__VIBEAI__ = window.__VIBEAI__ || {};
      window.__VIBEAI__.currentStage      = null;
      window.__VIBEAI__.stageSkipDetected = false;
      window.__VIBEAI__.stageHistory      = [];
      // v2.18.0: Clear hudClosed on session reset so nudges re-enable for new session
      window.__VIBEAI__.hudClosed         = false;
    } catch (e) { /* ignore */ }
    void 0;
  }

  /**
   * Get current stage without running analysis.
   * @returns {string|null}
   */
  function getCurrentStage() {
    return (window.__VIBEAI__ && window.__VIBEAI__.currentStage) || null;
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  window.VibeStageDetector = {
    update,
    reset,
    getCurrentStage,
    seedSynthetic,
    STAGES
  };

  void 0;
})();

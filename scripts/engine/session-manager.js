/**
 * VibeAI Session Manager
 * v2.16.0 — Phase 1 Engine Module
 *
 * Manages session close flow and retrieval practice prompt.
 *
 * On session close, shows:
 *   "What did you figure out that you didn't know before?"
 *
 * User response is stored locally. No AI processing. No external transmission.
 *
 * Privacy: local-only. No cloud analysis. No third-party telemetry.
 * User can clear session log via VibeSessionManager.clearLog().
 *
 * Storage: chrome.storage.local, key 'vibeai_session_log'
 * Schema per entry:
 *   { timestamp: number, response: string, platform: string, stageHistory: string[] }
 * Response cap: 2000 chars per entry.
 *
 * Cap: 50 entries (oldest removed first)
 *
 * Phase 1 note: triggerCloseFlow() creates a minimal standalone prompt overlay.
 * Phase 2 will wire this into the unified-hud.js close button instead.
 *
 * Pattern: IIFE + window globals (no ESM imports)
 * Dependencies: consent-helper.js must be loaded first
 */

(function () {
  'use strict';

  const STORAGE_KEY        = 'vibeai_session_log';
  const MAX_ENTRIES        = 50;
  const MAX_RESPONSE_CHARS = 2000; // Fix 4: cap to prevent storage quota failures
  const PROMPT_TEXT        = 'What did you figure out that you didn\'t know before?';
  const OVERLAY_ID         = 'vibeai-session-close-overlay';

  // ─── Storage helpers ───────────────────────────────────────────────────────

  function readLog(callback) {
    try {
      chrome.storage.local.get([STORAGE_KEY], function (result) {
        if (chrome.runtime.lastError) {
          console.warn('[VibeAI SessionManager] Read error:', chrome.runtime.lastError);
          callback([]);
          return;
        }
        callback(Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []);
      });
    } catch (e) {
      console.warn('[VibeAI SessionManager] Storage unavailable', e);
      callback([]);
    }
  }

  function appendEntry(entry, callback) {
    readLog(function (existing) {
      const updated = [...existing, entry];
      const capped  = updated.length > MAX_ENTRIES
        ? updated.slice(updated.length - MAX_ENTRIES)
        : updated;

      const payload = {};
      payload[STORAGE_KEY] = capped;

      try {
        chrome.storage.local.set(payload, function () {
          if (chrome.runtime.lastError) {
            console.warn('[VibeAI SessionManager] Write error:', chrome.runtime.lastError);
          }
          if (typeof callback === 'function') callback();
        });
      } catch (e) {
        console.warn('[VibeAI SessionManager] Write failed', e);
      }
    });
  }

  // ─── Platform helper ───────────────────────────────────────────────────────

  function getPlatform() {
    try {
      if (window.__vibeai_parser_registry) {
        return window.__vibeai_parser_registry.getPlatformName() || 'unknown';
      }
    } catch (e) { /* ignore */ }
    return 'unknown';
  }

  function getStageHistory() {
    try {
      return (window.__VIBEAI__ && window.__VIBEAI__.stageHistory) || [];
    } catch (e) {
      return [];
    }
  }

  // ─── Prompt overlay ────────────────────────────────────────────────────────

  /**
   * Build and inject the session close prompt overlay.
   * Minimal DOM, no framework dependency. Uses Shadow DOM for style isolation.
   *
   * @returns {Promise<string>} Resolves with the user's response text (may be empty)
   */
  function showPromptOverlay() {
    return new Promise(function (resolve) {
      // Remove any existing overlay first
      const existing = document.getElementById(OVERLAY_ID);
      if (existing) existing.remove();

      // Host element
      const host = document.createElement('div');
      host.id = OVERLAY_ID;
      host.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'z-index:2147483647',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'background:rgba(0,0,0,0.55)',
        'font-family:system-ui,sans-serif'
      ].join(';');

      // Shadow root for style isolation
      const shadow = host.attachShadow({ mode: 'closed' });

      shadow.innerHTML = `
        <style>
          :host { display: block; }
          .panel {
            background: rgba(12, 18, 28, 0.97);
            border: 1px solid rgba(100, 200, 180, 0.3);
            border-radius: 12px;
            padding: 28px 32px;
            width: 400px;
            max-width: 90vw;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          }
          .label {
            color: rgba(180, 220, 210, 0.9);
            font-size: 13px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            margin-bottom: 12px;
          }
          .prompt {
            color: #e8f4f0;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .input {
            width: 100%;
            box-sizing: border-box;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(100, 200, 180, 0.25);
            border-radius: 8px;
            color: #e8f4f0;
            font-size: 14px;
            line-height: 1.5;
            padding: 10px 12px;
            resize: vertical;
            min-height: 72px;
            outline: none;
            font-family: inherit;
          }
          .input:focus {
            border-color: rgba(100, 200, 180, 0.55);
          }
          .actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 16px;
          }
          .btn {
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            padding: 8px 18px;
            font-family: inherit;
          }
          .btn-skip {
            background: transparent;
            color: rgba(180, 200, 195, 0.6);
            border: 1px solid rgba(180, 200, 195, 0.2);
          }
          .btn-skip:hover { color: rgba(180, 200, 195, 0.9); }
          .btn-save {
            background: rgba(100, 200, 180, 0.15);
            color: rgba(100, 200, 180, 0.95);
            border: 1px solid rgba(100, 200, 180, 0.3);
          }
          .btn-save:hover { background: rgba(100, 200, 180, 0.25); }
        </style>
        <div class="panel">
          <div class="label">Session reflection</div>
          <div class="prompt">${PROMPT_TEXT}</div>
          <textarea class="input" placeholder="Your thoughts..." aria-label="Session reflection"></textarea>
          <div class="actions">
            <button class="btn btn-skip" id="skip">Skip</button>
            <button class="btn btn-save" id="save">Save &amp; Close</button>
          </div>
        </div>
      `;

      const textarea = shadow.querySelector('.input');
      const saveBtn  = shadow.querySelector('#save');
      const skipBtn  = shadow.querySelector('#skip');

      function finish(response) {
        try { host.remove(); } catch (e) { /* ignore */ }
        resolve(response || '');
      }

      saveBtn.addEventListener('click', function () {
        finish(textarea.value.trim());
      });

      skipBtn.addEventListener('click', function () {
        finish('');
      });

      // Allow Escape to skip
      host.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') finish('');
      });

      // Note B: tabindex on host ensures it can receive focus as fallback,
      // so Escape key routing is reliable even if textarea focus races.
      host.setAttribute('tabindex', '-1');

      document.body.appendChild(host);

      // Focus textarea after mount; fall back to host if textarea is unreachable
      requestAnimationFrame(function () {
        try {
          textarea.focus();
        } catch (e) {
          try { host.focus(); } catch (_) { /* ignore */ }
        }
      });
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Trigger the session close flow.
   * Shows the retrieval prompt, collects user response, stores it locally.
   *
   * Phase 1: creates its own overlay.
   * Phase 2: unified-hud.js will call this before runCleanup().
   *
   * @returns {Promise<void>} Resolves when the session is fully closed.
   */
  function triggerCloseFlow() {
    // Fix 1 + Fix 2: Consent is a strict precondition for any user-authored text capture.
    // Delegates to VibeConsentHelper (single authoritative contract).
    // Falls back gracefully if consent-helper.js failed to load.
    var consented = false;
    try {
      consented = window.VibeConsentHelper
        ? window.VibeConsentHelper.isConsented()
        : !!(window.__VIBEAI__ && window.__VIBEAI__.consentGiven === true);
    } catch (e) { /* consented stays false */ }

    if (!consented) {
      console.log('[VibeAI SessionManager] Close flow suppressed — no consent');
      return Promise.resolve();
    }

    return showPromptOverlay().then(function (response) {
      // Fix 4: cap response length before any storage write (2000 chars max)
      var safeResponse = response ? String(response).slice(0, MAX_RESPONSE_CHARS) : '';

      const entry = {
        timestamp:    Date.now(),
        response:     safeResponse,
        platform:     getPlatform(),
        stageHistory: getStageHistory()
      };

      if (safeResponse) {
        appendEntry(entry, function () {
          console.log('[VibeAI SessionManager] Session reflection saved');
        });
      } else {
        console.log('[VibeAI SessionManager] Session reflection skipped');
      }

      // Reset stage detector for the next session
      try {
        if (window.VibeStageDetector) window.VibeStageDetector.reset();
      } catch (e) { /* ignore */ }

      try {
        window.dispatchEvent(new CustomEvent('vibeai:sessionClosed', {
          detail: { hadReflection: !!safeResponse, timestamp: entry.timestamp }
        }));
      } catch (e) { /* ignore */ }
    });
  }

  /**
   * Retrieve stored session log entries.
   *
   * @param {function} callback - Called with array of session entries
   */
  function getSessionLog(callback) {
    if (typeof callback !== 'function') return;
    readLog(callback);
  }

  /**
   * Clear the session log.
   */
  function clearLog() {
    const payload = {};
    payload[STORAGE_KEY] = [];
    try {
      chrome.storage.local.set(payload, function () {
        console.log('[VibeAI SessionManager] Session log cleared');
      });
    } catch (e) {
      console.warn('[VibeAI SessionManager] Clear failed', e);
    }
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  window.VibeSessionManager = {
    triggerCloseFlow,
    getSessionLog,
    clearLog
  };

  console.log('[VibeAI SessionManager] Loaded v2.16.0');
})();

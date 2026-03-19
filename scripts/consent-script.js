/* global chrome */
/**
 * VibeAI FoldSpace - Consent Check Script
 * Phase VII.9.5 - Chrome + ChatGPT Consent Modal Fix
 * - DOMContentLoaded for bootConsent() to inject BEFORE React hydration
 * - HUD persistence guard
 * - Safe chrome.runtime.getURL wrapper
 */

// Safe wrapper for chrome.runtime.getURL
function safeGetURL(path) {
  try {
    if (chrome?.runtime?.getURL) {
      return chrome.runtime.getURL(path);
    }
    console.warn("[VibeAI Consent] chrome.runtime.getURL unavailable, using relative path");
    return `./${path}`;
  } catch (error) {
    console.warn("[VibeAI Consent] Error accessing chrome.runtime:", error);
    return `./${path}`;
  }
}

// ===================== Phase VII.9.4a — Consent Persistence Patch =====================
(function(){
  const CONSENT_HOST_ID = "vibeai-consent-host";
  const CONSENT_ACCEPT_ID = "vibeai-consent-accept";
  const CONSENT_DECLINE_ID = "vibeai-consent-decline";

  const CONSENT_HTML = `
    <style>
      :host { all: initial; }
      .backdrop {
        position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        z-index: 2147483648;
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      }
      .card {
        background: rgba(15, 15, 20, 0.95);
        border: 2px solid rgba(0, 212, 255, 0.5);
        border-radius: 16px;
        padding: 32px 40px;
        max-width: 520px;
        box-shadow: 0 0 50px rgba(0, 170, 255, 0.6);
        color: #fff;
      }
      .title {
        font-size: 1.6em; font-weight: bold; color: #00d4ff;
        letter-spacing: 2px; margin-bottom: 8px; text-align: center;
      }
      .body {
        font-size: 0.85em; line-height: 1.6; color: #ccc; margin-bottom: 20px;
      }
      .body p { margin-bottom: 14px; opacity: 0.9; }
      .body .section-title {
        margin-bottom: 8px; color: #00d4ff; font-weight: 600; font-size: 0.95em;
      }
      .body ul {
        margin-left: 20px; margin-bottom: 14px; line-height: 1.7;
      }
      .disclaimer {
        font-size: 0.8em; opacity: 0.65; font-style: italic;
        padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px;
      }
      .kbd-hint {
        font-size: 0.75em; opacity: 0.5; margin-top: 8px; text-align: center;
      }
      .kbd-hint kbd {
        background: rgba(255,255,255,0.1); padding: 2px 6px;
        border-radius: 3px; font-family: monospace;
      }
      .checkbox-row {
        margin-bottom: 16px;
      }
      .checkbox-label {
        display: flex; align-items: flex-start; gap: 10px;
        cursor: pointer; font-size: 0.85em; color: #ccc;
      }
      .checkbox-label input {
        margin-top: 3px; width: 16px; height: 16px; cursor: pointer;
      }
      .button-row {
        display: flex; gap: 12px; justify-content: center;
      }
      button {
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 1em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      button.accept {
        background: rgba(0, 170, 255, 0.3);
        color: #00d4ff;
        border: 2px solid rgba(0, 170, 255, 0.5);
      }
      button.accept:disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }
      button.accept:not(:disabled):hover {
        background: rgba(0, 170, 255, 0.5);
      }
      button.decline {
        background: rgba(255, 79, 79, 0.2);
        color: #ff4f4f;
        border: 2px solid rgba(255, 79, 79, 0.4);
      }
      button.decline:hover {
        background: rgba(255, 79, 79, 0.3);
      }
    </style>
    <div class="backdrop" role="dialog" aria-modal="true">
      <div class="card">
        <div class="title">VibeAI FoldSpace: A Mirror for Conversations</div>
        <div class="body">
          <p>VibeAI shows conversation resonance in real-time—how aligned an exchange feels as it unfolds.</p>
          <p class="section-title">What it does:</p>
          <ul>
            <li>Reflects tone and coherence patterns using <strong>simple keyword matching</strong> (not AI or machine learning)</li>
            <li>Visualizes through the Hugo Orb</li>
            <li>Runs locally in your browser (no external servers, no connection to the LLM you're using)</li>
          </ul>
          <p class="section-title">What it doesn't do:</p>
          <ul>
            <li>Use AI or ML to analyze your conversations</li>
            <li>Communicate with ChatGPT, Claude, Gemini, or any LLM</li>
            <li>Evaluate you or your thinking</li>
            <li>Suggest what to say</li>
            <li>Store or transmit data externally</li>
          </ul>
          <p class="disclaimer">
            <strong>Disclaimer:</strong> This is not a medical, mental health, therapeutic, or diagnostic tool. For informational purposes only.
          </p>
          <p class="kbd-hint">
            💡 Press <kbd>Ctrl+Shift+V</kbd> anytime to show this prompt
          </p>
        </div>
        <div class="checkbox-row">
          <label class="checkbox-label">
            <input type="checkbox" id="vibeai-consent-checkbox">
            <span>I understand VibeAI is a reflection tool, not an evaluation system.</span>
          </label>
        </div>
        <div class="button-row">
          <button id="${CONSENT_ACCEPT_ID}" class="accept" disabled>Start Reflecting</button>
          <button id="${CONSENT_DECLINE_ID}" class="decline">Maybe Later</button>
        </div>
      </div>
    </div>
  `;

  function setConsentGiven(val) {
    try { chrome.storage?.local.set({ consentGiven: !!val }); } catch (err) { console.warn('[VibeAI] Consent persistence non-fatal:', err); }
      try { window.postMessage({ type: "VIBEAI_CONSENT_STATE", given: !!val }, location.origin); } catch (err) { console.warn('[VibeAI] Consent persistence non-fatal:', err); }
  }
  async function getConsentGiven() {
    return new Promise((resolve) => {
      try {
        chrome.storage?.local.get(["consentGiven"], (o) => resolve(!!o?.consentGiven));
      } catch { resolve(false); }
    });
  }
  function setConsentDeferred(val) {
    try { chrome.storage?.local.set({ consentDeferred: !!val }); } catch (err) { console.warn('[VibeAI] Consent deferred non-fatal:', err); }
  }
  async function getConsentDeferred() {
    return new Promise((resolve) => {
      try {
        chrome.storage?.local.get(["consentDeferred"], (o) => resolve(!!o?.consentDeferred));
      } catch { resolve(false); }
    });
  }

  const PAUSED_HUD_ID = "vibeai-paused-hud";
  function showPausedHUD() {
    if (document.getElementById(PAUSED_HUD_ID)) return;
    const el = document.createElement("div");
    el.id = PAUSED_HUD_ID;
    el.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      background: rgba(15, 15, 20, 0.92); color: #888;
      padding: 8px 16px; border-radius: 20px;
      border: 1px solid rgba(0, 212, 255, 0.25);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 12px; z-index: 2147483640; cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      user-select: none;
    `;
    el.innerHTML = `<span style="color:#00d4ff;font-size:10px">●</span> VibeAI <span style="color:#555">paused</span>`;
    el.title = "Click to activate VibeAI";
    el.addEventListener("click", () => {
      el.remove();
      setConsentDeferred(false);
      // Remove any unified-hud.js consent modal that may have appeared
      const dupModal = document.getElementById('vibeai-consent-modal');
      if (dupModal) dupModal.remove();
      injectConsentDialog();
      startConsentHeartbeat();
    });
    document.documentElement.appendChild(el);
  }

  function injectConsentDialog() {
    if (document.getElementById(CONSENT_HOST_ID)) return;
    const host = document.createElement("div");
    host.id = CONSENT_HOST_ID;
    document.documentElement.appendChild(host);
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = CONSENT_HTML;

    // Suppress unified-hud.js's own consent modal — it fires after 1000ms delay
    // We are the primary consent UI; remove any duplicate that appears
    setTimeout(() => {
      const dupModal = document.getElementById('vibeai-consent-modal');
      if (dupModal) { dupModal.remove(); void 0; }
    }, 1300);

    // Checkbox requirement for accept button
    const checkbox = root.getElementById('vibeai-consent-checkbox');
    const acceptBtn = root.getElementById(CONSENT_ACCEPT_ID);
    if (checkbox && acceptBtn) {
      checkbox.addEventListener('change', () => {
        acceptBtn.disabled = !checkbox.checked;
      });
    }

    root.getElementById(CONSENT_ACCEPT_ID)?.addEventListener("click", () => {
      setConsentGiven(true);
      removeConsentDialog();
  try { window.postMessage({ type: "VIBEAI_CONSENT_ACCEPTED" }, location.origin); } catch (err) { console.warn('[VibeAI] Consent persistence non-fatal:', err); }
    });
    root.getElementById(CONSENT_DECLINE_ID)?.addEventListener("click", () => {
      setConsentDeferred(true);
      clearInterval(consentHeartbeat);
      consentHeartbeat = null;
      removeConsentDialog();
      showPausedHUD();
      void 0;
    });
  }

  function removeConsentDialog() {
    const host = document.getElementById(CONSENT_HOST_ID);
    if (host && host.parentNode) host.parentNode.removeChild(host);
  }

  let consentHeartbeat = null;
  function startConsentHeartbeat() {
    clearInterval(consentHeartbeat);
    consentHeartbeat = setInterval(async () => {
      const deferred = await getConsentDeferred();
      if (deferred) return; // user chose "Maybe Later" — do not pester them
      const given = await getConsentGiven();
      if (!given && !document.getElementById(CONSENT_HOST_ID)) {
        injectConsentDialog();
        void 0;
      }
    }, 3000);
  }

  try {
    chrome.storage?.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (changes?.consentGiven) {
        const v = !!changes.consentGiven.newValue;
        if (v) removeConsentDialog();
      }
    });
  } catch (err) { console.warn('[VibeAI] Consent persistence non-fatal:', err); }

  async function bootConsent() {
    const given = await getConsentGiven();
    const deferred = await getConsentDeferred();
    if (given) {
      removeConsentDialog();
      void 0;
    } else if (deferred) {
      // User previously chose "Maybe Later" — show paused badge, no modal
      showPausedHUD();
      void 0;
    } else {
      // Phase VII.9.5: Inject IMMEDIATELY (no delay) to beat ChatGPT React hydration
      injectConsentDialog();
      startConsentHeartbeat();
      void 0;
    }
  }

  // Phase VII.9.5 - Fix Chrome + ChatGPT consent modal scrubbing
  // Use DOMContentLoaded instead of window.load to inject BEFORE React hydration
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootConsent, { once: true });
  } else {
    bootConsent();
  }
})();
// =================== /Phase VII.9.4a — Consent Persistence Patch ===================

// Main consent check initialization
function initConsentCheck() {
  void 0;
  // The IIFE (Shadow DOM system) owns consent modal, deferred state, and paused badge.
  // This function only activates VibeAI when consent is confirmed.
  chrome.storage.local.get(["consentGiven"], (result) => {
    if (result.consentGiven === true) {
      void 0;
      initializeVibeAI();
    }
    // All other states (undefined, false, deferred) are handled by the IIFE system
  });
}

// Legacy showConsentModal, injectHUD, loadContentScript, showPausedMessage removed.
// The IIFE Shadow DOM system above handles all consent UI and the paused badge.

function initializeVibeAI() {
  // Use the unified HUD (the real implementation from unified-hud.js)
  if (typeof window.injectUnifiedHUD === 'function') {
    void 0;
    window.injectUnifiedHUD({ observer: true });
  } else {
    // unified-hud.js may not have loaded yet — re-try after it loads
    void 0;
    setTimeout(() => {
      if (typeof window.injectUnifiedHUD === 'function') {
        window.injectUnifiedHUD({ observer: true });
      }
    }, 800);
  }
}

// Legacy startSelfHealingSystem removed — unified-hud.js handles HUD self-healing.

// DOMContentLoaded fallback for ChatGPT and other strict CSP sites
if (document.readyState === "loading") {
  void 0;
  document.addEventListener("DOMContentLoaded", initConsentCheck);
} else {
  void 0;
  initConsentCheck();
}

// Activate VibeAI when the IIFE consent modal accept button is clicked
window.addEventListener("message", (event) => {
  try {
    if (event.source !== window) return; // reject cross-origin messages
    if (event.data?.type === "VIBEAI_CONSENT_ACCEPTED") {
      void 0;
      initializeVibeAI();
    }
  } catch (err) { /* ignore */ }
});

// Legacy Phase VII.9.4b (waitForHUD / VIBEAI_BIND_REQUEST) removed.
// unified-hud.js handles all HUD binding internally.

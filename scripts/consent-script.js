/* global chrome */
/**
 * VibeAI FoldSpace - Consent Check Script
 * Phase VII.4 - Runtime Harmony & Consent Flow Stabilization
 * - DOMContentLoaded fallback for ChatGPT
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
        position: fixed; inset: 0; background: rgba(2,6,23,.6);
        backdrop-filter: blur(2px); z-index: 2147483646;
        display: grid; place-items: center; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .card {
        width: min(420px, 92vw);
        border-radius: 16px; padding: 20px 18px 16px;
        background: radial-gradient(120% 120% at 10% 0%, #0b1221, #0a0f1d 48%, #080d18 100%);
        color: #e7e9ff; box-shadow: 0 12px 40px rgba(0,0,0,.35), inset 0 0 0 1px rgba(121,127,255,.15);
      }
      .head { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
      .head .logo { width:22px; height:22px; display:grid; place-items:center; border-radius:999px; background:#6c7bff22; }
      .title { font-weight:700; letter-spacing:.2px; }
      .body { font-size: 13px; line-height: 1.45; color: #cfd3ff; margin: 8px 0 14px; }
      .row { display:flex; gap:8px; justify-content:flex-end; }
      button {
        all: unset; cursor: pointer; user-select:none;
        padding: 9px 12px; border-radius: 10px; font-size: 13px; font-weight: 600;
        border: 1px solid #7a81ff33;
        background: #0c1330; color:#dfe3ff; transition: transform .06s ease;
      }
      button:hover { transform: translateY(-1px); }
      button.primary { background: linear-gradient(180deg,#6f7eff,#5464ff); color: white; border-color: transparent; }
      .note { font-size: 11px; color:#a9b0ff; margin-top:8px; opacity:.9 }
      a { color:#9fb3ff; text-decoration: underline; }
    </style>
    <div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="vibeai-consent-title">
      <div class="card">
        <div class="head">
          <div class="logo">🌀</div>
          <div class="title" id="vibeai-consent-title">Enable VibeAI on this site?</div>
        </div>
        <div class="body">
          VibeAI overlays a sidebar to summarize emotional tone and create conversation bookmarks.
          We do <b>not</b> transmit your content off-device. You can disable anytime in the HUD.
        </div>
        <div class="row">
          <button id="${CONSENT_DECLINE_ID}" aria-label="Decline">Not now</button>
          <button id="${CONSENT_ACCEPT_ID}" class="primary" aria-label="Accept & continue">Agree & Continue</button>
        </div>
        <div class="note">Read our <a href="https://hugonomy.com/privacy" target="_blank" rel="noopener noreferrer">privacy</a>.</div>
      </div>
    </div>
  `;

  function setConsentGiven(val) {
    try { chrome.storage?.local.set({ consentGiven: !!val }); } catch (err) { console.warn('[VibeAI] Consent persistence non-fatal:', err); }
      try { window.postMessage({ type: "VIBEAI_CONSENT_STATE", given: !!val }, "*"); } catch (err) { console.warn('[VibeAI] Consent persistence non-fatal:', err); }
  }
  async function getConsentGiven() {
    return new Promise((resolve) => {
      try {
        chrome.storage?.local.get(["consentGiven"], (o) => resolve(!!o?.consentGiven));
      } catch { resolve(false); }
    });
  }

  function injectConsentDialog() {
    if (document.getElementById(CONSENT_HOST_ID)) return;
    const host = document.createElement("div");
    host.id = CONSENT_HOST_ID;
    document.documentElement.appendChild(host);
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = CONSENT_HTML;

    root.getElementById(CONSENT_ACCEPT_ID)?.addEventListener("click", () => {
      setConsentGiven(true);
      removeConsentDialog();
  try { window.postMessage({ type: "VIBEAI_CONSENT_ACCEPTED" }, "*"); } catch (err) { console.warn('[VibeAI] Consent persistence non-fatal:', err); }
    });
    root.getElementById(CONSENT_DECLINE_ID)?.addEventListener("click", () => {
      setConsentGiven(false);
      removeConsentDialog();
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
      const given = await getConsentGiven();
      if (!given && !document.getElementById(CONSENT_HOST_ID)) {
        injectConsentDialog();
        console.log("[VibeAI] Consent heartbeat re-injected dialog.");
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
    if (!given) {
      setTimeout(() => {
        injectConsentDialog();
        startConsentHeartbeat();
        console.log("[VibeAI] Consent dialog mounted (DOM-safe).");
      }, 500);
    } else {
      removeConsentDialog();
      console.log("[VibeAI] Consent already given.");
    }
  }

  if (document.readyState === "complete") bootConsent();
  else window.addEventListener("load", bootConsent, { once: true });
})();
// =================== /Phase VII.9.4a — Consent Persistence Patch ===================

// Main consent check initialization
function initConsentCheck() {
  console.log("[VibeAI] Checking user consent...");

  chrome.storage.local.get(["consentGiven"], (result) => {
    if (result.consentGiven === undefined) {
      // First time user - show consent dialog
      console.log("[VibeAI] First-time user detected, opening consent dialog");
      showConsentModal();
    } else if (result.consentGiven === true) {
      // User has accepted - proceed with VibeAI
      console.log("[VibeAI] Consent verified, activating VibeAI");
      initializeVibeAI();
    } else {
      // User declined - show pause message
      console.log("[VibeAI] Consent declined, VibeAI paused");
      showPausedMessage();
    }
  });
}

function showConsentModal() {
  // Don't show multiple modals
  if (document.getElementById("vibeai-consent-overlay")) {
    console.log("[VibeAI] Consent modal already visible");
    return;
  }

  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.id = "vibeai-consent-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
  `;

  // Create iframe with consent page
  const iframe = document.createElement("iframe");
  iframe.src = safeGetURL("docs_old/consent.html");
  iframe.style.cssText = `
    width: 90%;
    max-width: 700px;
    height: 80vh;
    max-height: 700px;
    border: none;
    border-radius: 16px;
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.8);
  `;

  overlay.appendChild(iframe);
  document.documentElement.appendChild(overlay);

  // Listen for postMessage from consent iframe
  window.addEventListener("message", (event) => {
    if (event.data?.source === "vibeai-consent" && event.data?.action === "accepted") {
      console.log("[VibeAI] Received consent acceptance message");
      overlay.remove();
      injectHUD();
    }
  });

  // Also listen for consent decision via storage (fallback)
  const checkConsent = setInterval(() => {
    chrome.storage.local.get(["consentGiven"], (result) => {
      if (result.consentGiven !== undefined) {
        // User made a decision
        clearInterval(checkConsent);
        overlay.remove();

        if (result.consentGiven === true) {
          console.log("[VibeAI] User accepted consent");
          injectHUD();
        } else {
          console.log("[VibeAI] User declined consent");
          showPausedMessage();
        }
      }
    });
  }, 500);
}

// Inject HUD directly into the current page using iframe
function injectHUD() {
  // Don't inject if already present
  if (document.getElementById("vibeai-hud-frame")) {
    console.log("[VibeAI] HUD already present");
    return;
  }

  try {
    console.log("[VibeAI] Injecting HUD into current page...");

    // Create iframe for HUD (this properly executes scripts)
    const hudFrame = document.createElement("iframe");
    hudFrame.id = "vibeai-hud-frame";
  hudFrame.src = safeGetURL("docs_old/foldspace.html");
    hudFrame.setAttribute("title", "VibeAI FoldSpace HUD");

    // Style the iframe to overlay on the page
    hudFrame.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      z-index: 2147483645;
      pointer-events: auto;
      background: transparent;
    `;
    // Ensure the iframe can run scripts and postMessage reliably
    try {
      hudFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    } catch (errSet) { console.warn('[VibeAI] Could not set sandbox attribute on HUD iframe:', errSet); }

    // Append to body
    document.body.appendChild(hudFrame);

    console.log("[VibeAI] HUD iframe injected successfully");

    // Phase VII.9.2 - Enforce HUD positioning for ChatGPT visibility
    setTimeout(() => {
      const hud = document.getElementById('vibeai-hud-frame');
      if (hud) {
  hud.style.position = 'fixed';
  hud.style.top = '0';
  hud.style.left = '0';
  hud.style.width = '100vw';
  hud.style.height = '100vh';
  hud.style.zIndex = '2147483645';
  hud.style.display = 'block';
  hud.style.pointerEvents = 'auto';
  console.log('[VibeAI Content] HUD positioning enforced for visibility');
      }
    }, 100);

    // Load content script to start analysis
    loadContentScript();

  } catch (error) {
    console.error("[VibeAI] HUD injection failed:", error);
  }
}

// Load content script after HUD is injected
function loadContentScript() {
  try {
    const script = document.createElement('script');
    script.src = safeGetURL('scripts/content-script.js');
    script.type = 'module';
    script.onload = () => {
      console.log("[VibeAI] Content script loaded");
    };
    script.onerror = (error) => {
      console.error("[VibeAI] Failed to load content script:", error);
    };
    document.documentElement.appendChild(script);
  } catch (error) {
    console.error("[VibeAI] Error loading content script:", error);
  }
}

function showPausedMessage() {
  // Don't show multiple notices
  if (document.getElementById("vibeai-paused-notice")) {
    return;
  }

  // Create minimal notification
  const notice = document.createElement("div");
  notice.id = "vibeai-paused-notice";
  notice.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(26, 27, 51, 0.95);
    color: #dbe7ff;
    padding: 16px 24px;
    border-radius: 12px;
    border: 1px solid rgba(122, 162, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  notice.innerHTML = `
    <span style="font-size: 20px;">🌀</span>
    <span>VibeAI paused until consent given</span>
    <button id="vibeai-reopen-consent" style="
      background: linear-gradient(135deg, #6e54d8, #9d5ce0);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
    ">Review</button>
  `;

  document.documentElement.appendChild(notice);

  // Allow user to reopen consent dialog
  const reviewBtn = document.getElementById("vibeai-reopen-consent");
  if (reviewBtn) {
    reviewBtn.addEventListener("click", () => {
      notice.remove();
      // Clear the declined state and show modal again
      chrome.storage.local.remove("consentGiven", () => {
        showConsentModal();
      });
    });
  }

  // Auto-hide after 10 seconds
  setTimeout(() => {
    if (notice && notice.parentElement) {
      notice.style.transition = "opacity 0.5s ease";
      notice.style.opacity = "0";
      setTimeout(() => notice.remove(), 500);
    }
  }, 10000);
}

function initializeVibeAI() {
  // Use the new direct HUD injection method
  injectHUD();

  // Phase VII.9.2a - Start self-healing HUD mount system
  startSelfHealingSystem();
}

// --- 🧠 Self-Healing HUD Mount (Phase VII.9.2a) ---
function startSelfHealingSystem() {
  // Only start if consent was given
  chrome.storage.local.get(["consentGiven"], (result) => {
    if (result.consentGiven !== true) return;

    // Heartbeat: verify HUD presence every 3 seconds
    function ensureHUDAlive() {
      const hud = document.getElementById("vibeai-hud-frame");
      if (!hud) {
        console.warn("[VibeAI] HUD missing — re-injecting...");
        injectHUD();
      }
    }
    setInterval(ensureHUDAlive, 3000);

    // MutationObserver: instant re-injection on DOM changes
    const rootObserver = new MutationObserver(() => {
      const root = document.querySelector("div#__next");
      const hud = document.getElementById("vibeai-hud-frame");
      if (root && !hud) {
        console.log("[VibeAI] DOM mutation detected, HUD re-injected.");
        injectHUD();
      }
    });

    // Observe body for ChatGPT React re-hydration
    if (document.body) {
      rootObserver.observe(document.body, { childList: true, subtree: true });
      console.log("[VibeAI] Self-healing mount system active");
    }
  });
}

// DOMContentLoaded fallback for ChatGPT and other strict CSP sites
if (document.readyState === "loading") {
  console.log("[VibeAI] Waiting for DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", initConsentCheck);
} else {
  console.log("[VibeAI] DOM already loaded, running consent check");
  initConsentCheck();
}

// ===================== Phase VII.9.4b — HUD Controls Activation Fix =====================
// Ensure button listeners are bound after the HUD iframe is mounted (accounts for async injection and re-injection)
const HANDSHAKE_TIMEOUT = 20000; // ms (vStable-2.4.0)

function waitForHUD(attempt = 0) {
  try {
    const iframe = document.getElementById('vibeai-hud-frame');
    if (iframe && iframe.contentWindow) {
      // We must not access iframe.contentDocument directly (CSP / cross-origin).
      // Always rely on postMessage handshake. Send a bind request and wait for HUD's ready ping.
      console.log('[VibeAI] Binding HUD via postMessage (CSP-safe)');
      try { iframe.contentWindow.postMessage({ type: 'VIBEAI_BIND_REQUEST' }, '*'); } catch (errPost) { console.warn('[VibeAI] VIBEAI_BIND_REQUEST postMessage failed:', errPost); }

      // Handshake fail-safe: if HUD doesn't respond within HANDSHAKE_TIMEOUT, log and keep waiting via polling
      const timer = setTimeout(() => {
        console.warn('[VibeAI] HUD did not respond to bind request within', HANDSHAKE_TIMEOUT, 'ms — continuing with postMessage-only bindings');
      }, HANDSHAKE_TIMEOUT);

      // We'll still rely on the existing message listener to trigger binding when HUD posts ready.
      // Clear the timeout if HUD responds (the global message handler will manage this), but keep the timer to surface delays.
      // Store timer on iframe element for potential cleanup (non-critical)
  try { iframe._vibeai_handshake_timer = timer; } catch { /* ignore */ }
      return;
    }
  } catch (err) {
    console.warn('[VibeAI] waitForHUD error (non-fatal):', err);
  }

  if (attempt < 40) {
    setTimeout(() => waitForHUD(attempt + 1), 500);
  } else {
    console.warn('[VibeAI] waitForHUD timed out after multiple attempts');
  }
}

// Bind once the HUD is up and on each injection
window.addEventListener('message', (event) => {
  try {
    const data = event.data || {};
    if (data && data.type === 'VIBEAI_HUD_READY') {
      // HUD reports ready — attempt binding
      setTimeout(() => waitForHUD(0), 150);
    }
  } catch (errMsg) { console.warn('[VibeAI] message handler error:', errMsg); }
});

// Kick off a passive binding attempt in case HUD is already present
setTimeout(() => waitForHUD(0), 300);
// =================== /Phase VII.9.4b ===================

/**
 * VibeAI FoldSpace - Consent Modal Handler
 * CSP-compliant external script for consent actions
 */
/* global chrome */
/* eslint-env browser */

// Safe wrapper for chrome.runtime.getURL
function _safeGetURL(path) {
  try {
    if (chrome?.runtime?.getURL) {
      return chrome.runtime.getURL(path);
    }
    console.warn("[VibeAI Consent] chrome.runtime.getURL unavailable, using local path");
    return `./${path}`;
  } catch (error) {
    console.warn("[VibeAI Consent] Error accessing chrome.runtime:", error);
    return `./${path}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[VibeAI Consent] Handler loaded");

  const acceptBtn = document.getElementById("accept-btn");
  const declineBtn = document.getElementById("decline-btn");

  if (!acceptBtn || !declineBtn) {
    console.error("[VibeAI Consent] Buttons not found in DOM");
    return;
  }

  acceptBtn.addEventListener("click", async () => {
    console.log("[VibeAI Consent] User clicked Accept");

    try {
      // Store consent decision
      await chrome.storage.local.set({ consentGiven: true });
      console.log("[VibeAI] Consent accepted — launching HUD...");

      // Close the consent modal (it's in an iframe, so we need to notify parent)
      window.parent.postMessage({
        source: "vibeai-consent",
        action: "accepted"
      }, "*");

      console.log("[VibeAI] Consent flow complete, parent will inject HUD");

    } catch (error) {
      console.error("[VibeAI] Consent acceptance failed:", error);
    }
  });

  declineBtn.addEventListener("click", () => {
    console.log("[VibeAI Consent] User clicked Decline");
    chrome.storage.local.set({ consentGiven: false }, () => {
      console.log("[VibeAI] Consent declined - showing paused message");
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;color:#dbe7ff;font-family:sans-serif;background:linear-gradient(145deg, #0f1419, #1a1f2e);">
          <div style="max-width:500px;padding:40px;background:rgba(24,26,32,0.95);border-radius:16px;border:1px solid rgba(122,162,255,0.3);box-shadow:0 8px 32px rgba(0,0,0,0.5);">
            <div style="font-size:48px;margin-bottom:16px;">🌀</div>
            <h2 style="color:#7aa2ff;margin-bottom:16px;">VibeAI Paused</h2>
            <p style="color:#91a1bd;line-height:1.6;">
              You declined consent. VibeAI will remain inactive until you accept the agreement.
              You can reopen the consent screen anytime from the extension popup or Privacy/Beta panel.
            </p>
          </div>
        </div>`;
    });
  });
});

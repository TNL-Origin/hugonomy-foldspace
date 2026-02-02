/* global chrome */
// 🚀 VibeAI FoldSpace HUD Injector (v2.11.7 - safeGetURL patch)
(function(){
  const HUD_ID = "vibeai-hud-frame";
  if (document.getElementById(HUD_ID)) return;

  // 🛡️ Safe getURL wrapper (v2.11.7)
  const safeGetURL = (file) => {
    try {
      if (chrome?.runtime?.getURL) {
        return chrome.runtime.getURL(file);
      }
      console.warn('[VibeAI] chrome.runtime.getURL unavailable, using relative path');
      return `./${file}`;
    } catch (e) {
      console.warn('[VibeAI] safeGetURL failed:', e);
      return `./${file}`;
    }
  };

  // 🛡️ One-time emergency release guard flag
  let emergencyReleaseRun = false;

  const iframe = document.createElement("iframe");
  iframe.id = HUD_ID;
  iframe.src = safeGetURL("foldspace.html");
  Object.assign(iframe.style, {
    position: "fixed",
    top: 0, left: 0,
    width: "100%", height: "100%",
    border: "none",
    zIndex: 2147483647,
    pointerEvents: "none",
    background: "transparent"
  });
  document.body.appendChild(iframe);
  void 0;

  // 🛡️ Emergency Pointer-Release (ONE TIME ONLY)
  function ensurePointerRelease() {
    if (emergencyReleaseRun) {
      void 0;
      return;
    }

    const iframe = document.querySelector('#vibeai-hud-frame');
    if (!iframe) {
      console.warn('[VibeAI] ⚠️ No HUD iframe found during pointer-release');
      return;
    }

    try {
      // Only affect host iframe (not internals)
      iframe.style.setProperty('pointer-events', 'none', 'important');
      emergencyReleaseRun = true;
      void 0;
    } catch (err) {
      console.error('[VibeAI] ❌ Error during emergency pointer-release:', err);
    }
  }

  // Initial pointer-release on injection
  ensurePointerRelease();

  // 30 s safety repair loop
  setInterval(() => {
    const iframe = document.querySelector("#vibeai-hud-frame");
    if (!iframe) return;
    const ev = getComputedStyle(iframe).pointerEvents;
    if (ev !== "none") {
      iframe.style.setProperty("pointer-events", "none", "important");
      void 0;
    }
  }, 30000);

  // HUD Re-injection recovery (if iframe lost)
  setInterval(() => {
    if (!document.getElementById("vibeai-hud-frame")) {
      console.warn("[VibeAI] ⚠️ HUD missing — reinjecting");
      const script = document.createElement("script");
      script.src = safeGetURL("foldspace.js");
      document.head.appendChild(script);
    }
  }, 60000);

  // 🤝 Handshake logic with maxRetries (v2.11.7)
  let retryCount = 0;
  const MAX_RETRIES = 3;
  let handshakeComplete = false;

  function sendBind(){
    if (handshakeComplete) {
      void 0;
      return;
    }

    if (retryCount >= MAX_RETRIES) {
      console.warn(`[VibeAI] ⚠️ Max HUD bind retries (${MAX_RETRIES}) reached. Aborting.`);
      return;
    }

    retryCount++;
    void 0;

    try{
      iframe.contentWindow?.postMessage("VIBEAI_BIND_REQUEST","*");
    }catch(err){
      console.warn("[VibeAI] Bind failed",err);
    }
  }

  window.addEventListener("message", e => {
    if (e.data === "VIBEAI_RENDER_READY") {
      handshakeComplete = true;
      void 0;
      // Emergency release already ran on initial injection
    }

    // 🛡️ CRITICAL: Enable iframe clicks for modal interaction
    if (e.data === "VIBEAI_ENABLE_IFRAME_CLICKS") {
      const iframe = document.getElementById(HUD_ID);
      if (iframe) {
        iframe.style.setProperty("pointer-events", "auto", "important");
        void 0;
      }
    }

    // 🔓 Phase III-B: Release pointer-events after consent granted
    if (e.data === "VIBEAI_CONSENT_GRANTED") {
      const iframe = document.getElementById(HUD_ID);
      if (iframe) {
        iframe.style.setProperty("pointer-events", "none", "important");
        void 0;
      }
    }

    // 💫 Handle ESC-key dismissal from HUD
    if (e.data === "VIBEAI_DISMISS_HUD") {
      void 0;
      const hudFrame = document.getElementById(HUD_ID);
      if (hudFrame) {
        hudFrame.remove();
        void 0;
      }
    }
  });

  // Retry after 20 s
  setTimeout(() => {
    console.warn("[VibeAI] HUD timeout — retrying bind");
    sendBind();
  }, 20000);

  sendBind();
})();

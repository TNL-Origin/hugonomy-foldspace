// Platform Compatibility — Claude.ai CSP safe-root (v2.15.2)
// Injects a lightweight, non-blocking anchor for the HUD on Claude.ai
(function injectSafeRoot() {
  try {
    // Only run on Claude.ai
    if (!location.hostname.includes("claude.ai")) return;

    if (document.querySelector("#vibeai-safe-root")) return;

    const root = document.createElement("div");
    root.id = "vibeai-safe-root";
    root.style.position = "fixed";
    root.style.zIndex = "2147483647";
    root.style.top = "0";
    root.style.right = "0";
    root.style.width = "0";
    root.style.height = "0";
    root.style.overflow = "visible";
    root.style.pointerEvents = "none";
    document.body.appendChild(root);
    void 0;
  } catch (err) {
    console.warn("[VibeAI] Platform safe-root injection failed:", err);
  }
})();

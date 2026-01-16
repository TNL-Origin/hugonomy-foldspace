// CSP Bypass for Claude Platform
// Injects lightweight root for sandboxed iframe contexts
(function injectSafeRoot() {
  try {
    const safeDoc = document;
    if (!safeDoc.querySelector("#vibeai-safe-root")) {
      const root = safeDoc.createElement("div");
      root.id = "vibeai-safe-root";
      root.style.position = "fixed";
      root.style.zIndex = 2147483647;
      root.style.top = "0";
      root.style.left = "0";
      root.style.pointerEvents = "none";
      safeDoc.body.appendChild(root);
      console.log("[VibeAI] Claude safe-root injected");
    }
  } catch (err) {
    console.warn("[VibeAI] Claude sandbox injection failed:", err);
  }
})();

// 🧭 Claude Visible Anchor Patch (v2.11.5)
// Re-anchors HUD inside Claude's visible container to restore rendering
(function injectClaudeAnchor() {
  try {
    if (!location.hostname.includes("claude.ai")) return;

    // Wait for safe-root to be ready
    const waitForRoot = setInterval(() => {
      const root = document.getElementById("vibeai-safe-root");
      if (!root) return;

      clearInterval(waitForRoot);

      // Claude-specific visible container targets
      const claudeContainer =
        document.querySelector("main") ||
        document.querySelector('[data-testid="chat-interface"]') ||
        document.querySelector('[class*="chat"]') ||
        document.querySelector("body > div:first-child");

      if (claudeContainer) {
        // Move root to visible container
        claudeContainer.appendChild(root);

        // Force visibility with explicit styles
        Object.assign(root.style, {
          position: "fixed",
          top: "0",
          right: "0",
          width: "380px",
          height: "100vh",
          zIndex: "2147483647",
          pointerEvents: "auto",
          display: "block",
          visibility: "visible",
          opacity: "1",
        });

        console.log("[VibeAI] 🧭 Anchoring inside Claude visible container:", claudeContainer.tagName);

        // Continuous visibility enforcement
        const enforceVisibility = setInterval(() => {
          if (!document.contains(root)) {
            clearInterval(enforceVisibility);
            return;
          }

          const rect = root.getBoundingClientRect();

          // Force dimensions if collapsed
          if (rect.width === 0 || rect.height === 0) {
            root.style.width = "380px";
            root.style.height = "100vh";
            root.style.display = "block";
            root.style.visibility = "visible";
            console.warn("[VibeAI] 🔧 Forcing HUD dimensions (was collapsed)");
          }

          // Log status every 5 seconds
          if (Math.floor(Date.now() / 5000) % 1 === 0) {
            if (rect.width > 0 && rect.height > 0) {
              console.log(`[VibeAI] ✅ HUD visible: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
              clearInterval(enforceVisibility); // Stop once confirmed visible
            }
          }
        }, 500);

      } else {
        console.warn("[VibeAI] Claude container not found; fallback to body.");
        document.body.appendChild(root);
      }
    }, 100);

    // Safety timeout
    setTimeout(() => clearInterval(waitForRoot), 10000);

  } catch (err) {
    console.error("[VibeAI] Claude anchor injection failed:", err);
  }
})();

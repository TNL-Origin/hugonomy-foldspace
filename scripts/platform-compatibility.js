// CSP Bypass for CSP-Restricted Platforms (Claude)
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
      const platform = location.hostname.includes("claude") ? "Claude" : "Unknown";
      void 0;
    }
  } catch (err) {
    console.warn("[VibeAI] Platform sandbox injection failed:", err);
  }
})();

// 🧭 Platform-Specific Visible Anchor Patch (v2.14.19)
// Re-anchors HUD inside platform's visible container to restore rendering
(function injectPlatformAnchor() {
  try {
    const isClaude = location.hostname.includes("claude.ai");

    if (!isClaude) return;

    // Wait for safe-root to be ready
    const waitForRoot = setInterval(() => {
      const root = document.getElementById("vibeai-safe-root");
      if (!root) return;

      clearInterval(waitForRoot);

      // Claude-specific visible container targets
      let platformContainer;
      if (isClaude) {
        platformContainer =
          document.querySelector("main") ||
          document.querySelector('[data-testid="chat-interface"]') ||
          document.querySelector('[class*="chat"]') ||
          document.querySelector("body > div:first-child");
      }

      if (platformContainer) {
        // Move root to visible container
        platformContainer.appendChild(root);

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

        void 0;

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
              void 0;
              clearInterval(enforceVisibility); // Stop once confirmed visible
            }
          }
        }, 500);

      } else {
        console.warn(`[VibeAI] Claude container not found; fallback to body.`);
        document.body.appendChild(root);
      }
    }, 100);

    // Safety timeout
    setTimeout(() => clearInterval(waitForRoot), 10000);

  } catch (err) {
    console.error("[VibeAI] Platform anchor injection failed:", err);
  }
})();

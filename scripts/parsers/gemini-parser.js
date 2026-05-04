/**
 * Gemini Parser
 * Handles gemini.google.com
 *
 * v2.14.8: Extracted from monolithic content-parser.js
 */

class GeminiParser extends BaseParser {
  constructor() {
    super('gemini');
  }

  /**
   * Gemini-specific selectors
   */
  getSelectors() {
    // Gemini custom elements — confirmed live DOM (Mar 8, 2026 audit)
    // user-query wraps user turns; model-response wraps AI turns
    // getRoleForNode() uses node.closest('user-query'/'model-response') to assign role
    return 'user-query, model-response';
  }

  /**
   * Check if hostname is Gemini
   */
  matchesHostname(hostname) {
    return hostname.includes('gemini');
  }

  /**
   * v2.18.x: Minimal MutationObserver for Gemini.
   * Watches for model-response or user-query elements being added.
   * Falls back to polling if observer fires too noisily.
   */
  setupObserver(callback) {
    console.log("[VibeAI Parser] 👁️ Setting up Gemini mutation observer");

    const observer = new MutationObserver((mutations) => {
      const hasNewMessages = mutations.some(m =>
        Array.from(m.addedNodes).some(n =>
          n.nodeType === 1 &&
          n.querySelector &&
          (n.querySelector('model-response') ||
           n.querySelector('user-query') ||
           n.matches?.('model-response') ||
           n.matches?.('user-query'))
        )
      );

      if (hasNewMessages) {
        console.log("[VibeAI Parser] 🔄 Gemini DOM changed, re-scanning...");
        setTimeout(callback, 500);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log("[VibeAI Parser] ✅ Gemini mutation observer active");
    return observer;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.GeminiParser = GeminiParser;
}

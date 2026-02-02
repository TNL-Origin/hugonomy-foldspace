/**
 * Claude Parser
 * Handles claude.ai
 *
 * v2.14.8: Extracted from monolithic content-parser.js
 */

class ClaudeParser extends BaseParser {
  constructor() {
    super('claude');
  }

  /**
   * Claude-specific selectors
   * Targets message container divs with specific attributes
   */
  getSelectors() {
    return '[data-test-render-count], .font-claude-message, div[class*="font-user-message"], div[class*="font-claude"], [class*="MessageContent"]';
  }

  /**
   * Claude-specific text extraction
   * Falls back to drilling into child elements if text is too short
   */
  extractText(node) {
    let text = node.innerText?.trim();

    // Claude-specific fallback: drill into child elements if text is empty or too short
    if (!text || text.length < this.minMessageLength) {
      const childText = Array.from(node.querySelectorAll('p, div, span'))
        .map(child => child.innerText || child.textContent)
        .filter(t => t && t.trim().length > 0)
        .join(' ')
        .trim();

      if (childText.length > (text?.length || 0)) {
        text = childText;
      }
    }

    return text;
  }

  /**
   * Check if hostname is Claude
   */
  matchesHostname(hostname) {
    return hostname.includes('claude.ai');
  }

  /**
   * Setup mutation observer for instant updates
   * Claude already had this in original code
   */
  setupObserver(callback) {
    void 0;

    const observer = new MutationObserver((mutations) => {
      const hasNewMessages = mutations.some(m =>
        Array.from(m.addedNodes).some(n =>
          n.nodeType === 1 &&
          n.querySelector &&
          n.querySelector('[data-test-render-count]')
        )
      );

      if (hasNewMessages) {
        void 0;
        setTimeout(callback, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    void 0;
    return observer;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ClaudeParser = ClaudeParser;
}

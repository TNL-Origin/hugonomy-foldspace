/**
 * ChatGPT Parser
 * Handles chatgpt.com, www.chatgpt.com, chat.openai.com
 *
 * v2.14.8: Extracted from monolithic content-parser.js
 */

class ChatGPTParser extends BaseParser {
  constructor() {
    super('chatgpt');
  }

  /**
   * ChatGPT-specific selectors
   * Targets message content divs
   */
  getSelectors() {
    return '.markdown, .text-base';
  }

  /**
   * Check if hostname is ChatGPT
   */
  matchesHostname(hostname) {
    return hostname === 'chatgpt.com' ||
           hostname === 'www.chatgpt.com' ||
           hostname === 'chat.openai.com';
  }

  /**
   * Setup mutation observer for instant updates (v2.14.7)
   * Called by parser-registry.js after parser is selected
   */
  setupObserver(callback) {
    console.log("[VibeAI Parser] 👁️ Setting up ChatGPT mutation observer");

    const observer = new MutationObserver((mutations) => {
      const hasNewMessages = mutations.some(m =>
        Array.from(m.addedNodes).some(n =>
          n.nodeType === 1 &&
          (n.classList?.contains('markdown') ||
           n.classList?.contains('text-base') ||
           n.querySelector?.('.markdown, .text-base'))
        )
      );

      if (hasNewMessages) {
        console.log("[VibeAI Parser] 🔄 ChatGPT DOM changed, re-scanning...");
        setTimeout(callback, 300);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log("[VibeAI Parser] ✅ ChatGPT mutation observer active");
    return observer;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ChatGPTParser = ChatGPTParser;
}

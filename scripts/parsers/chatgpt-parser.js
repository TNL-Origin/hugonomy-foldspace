/**
 * ChatGPT Parser
 * Handles chatgpt.com, www.chatgpt.com, chat.openai.com
 *
 * v2.17: Switched to data-message-author-role container selector.
 * Previous selector (.markdown, .text-base) only matched AI response content divs —
 * user messages live in .whitespace-pre-wrap and were never collected.
 * Root cause of the user-engagement classifier always getting AI text.
 */

class ChatGPTParser extends BaseParser {
  constructor() {
    super('chatgpt');
  }

  /**
   * v2.17: Target the role-tagged message container, not the inner content div.
   * This matches BOTH user messages (.whitespace-pre-wrap inside) and
   * assistant messages (.markdown inside) with a single stable selector.
   */
  getSelectors() {
    return '[data-message-author-role]';
  }

  /**
   * v2.17: Role is directly on the container node — no ancestor traversal needed.
   * Returns 'user' or 'assistant' from the DOM attribute.
   */
  getRoleForNode(node) {
    return node.getAttribute('data-message-author-role') || this.platformName;
  }

  /**
   * v2.17: Extract text from the correct inner content div.
   * User messages:     .whitespace-pre-wrap
   * Assistant messages: .markdown (or .prose fallback)
   * Fallback:           node.innerText (catches future DOM shape changes)
   */
  extractText(node) {
    const inner = node.querySelector('.whitespace-pre-wrap') ||
                  node.querySelector('.markdown') ||
                  node.querySelector('[class*="prose"]');
    return (inner || node).innerText?.trim() || null;
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
   * Setup mutation observer for instant updates (v2.17)
   * Watches for role-tagged containers being added (catches both user + AI turns).
   */
  setupObserver(callback) {
    void 0;

    const observer = new MutationObserver((mutations) => {
      const hasNewMessages = mutations.some(m =>
        Array.from(m.addedNodes).some(n =>
          n.nodeType === 1 &&
          (n.hasAttribute?.('data-message-author-role') ||
           n.querySelector?.('[data-message-author-role]'))
        )
      );

      if (hasNewMessages) {
        void 0;
        setTimeout(callback, 300);
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
  window.ChatGPTParser = ChatGPTParser;
}

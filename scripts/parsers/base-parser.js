/**
 * Base Parser - Abstract parser with common logic
 * All platform-specific parsers extend this class
 *
 * v2.14.8: Modular refactor for maintainability
 */

class BaseParser {
  constructor(platformName) {
    this.platformName = platformName;
    this.minMessageLength = 15;
    this.maxMessageLength = 2000;
  }

  /**
   * Get platform-specific CSS selectors
   * Override in subclass
   * @returns {string} CSS selector string
   */
  getSelectors() {
    throw new Error('getSelectors() must be implemented by subclass');
  }

  /**
   * Extract message text from DOM node
   * Can be overridden for platform-specific extraction
   * @param {HTMLElement} node - DOM element
   * @returns {string|null} Extracted text or null
   */
  extractText(node) {
    return node.innerText?.trim() || null;
  }

  /**
   * Post-process extracted text
   * Can be overridden for platform-specific cleanup
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text;
  }

  /**
   * Check if message is valid
   * @param {string} text - Message text
   * @returns {boolean} True if valid
   */
  isValidMessage(text) {
    return text && text.length >= this.minMessageLength;
  }

  /**
   * Main extraction method - called by content-parser.js
   * @returns {Array} Array of message objects
   */
  extractMessages() {
    const selectors = this.getSelectors();
    const nodes = document.querySelectorAll(selectors);

    const messages = [];
    nodes.forEach((node, idx) => {
      let text = this.extractText(node);

      if (text) {
        text = this.cleanText(text);
      }

      // v2.17.2: Compute role before length check so user acknowledgments
      // ("ok", "thanks", "hi") are not silently dropped by the 15-char noise
      // filter. Short user messages ARE valid engagement signals. Assistant
      // messages keep the full minimum to suppress UI noise.
      const role = this.getRoleForNode(node);
      const minLen = role === 'user' ? 1 : this.minMessageLength;

      if (text && text.length >= minLen) {
        messages.push({
          id: `${this.platformName}-${idx}`,
          source: role,
          content: text.slice(0, this.maxMessageLength),
          timestamp: Date.now(),
          element: node // Store reference for click-to-scroll
        });
      }
    });

    // Deduplicate messages (some selectors may overlap)
    return this.deduplicateMessages(messages);
  }

  /**
   * Remove duplicate messages based on content fingerprint
   * @param {Array} messages - Array of message objects
   * @returns {Array} Deduplicated messages
   */
  deduplicateMessages(messages) {
    const seen = new Set();
    return messages.filter(msg => {
      const fingerprint = msg.content.slice(0, 100); // First 100 chars as ID
      if (seen.has(fingerprint)) return false;
      seen.add(fingerprint);
      return true;
    });
  }

  /**
   * Determine whether a DOM node belongs to a user or assistant message.
   * Tries cross-platform attribute/class detection before falling back to
   * the platform name (legacy value — treated as non-user by consumers).
   *
   * Supported platforms:
   *   ChatGPT: data-message-author-role="user|assistant" on ancestor article
   *   Claude:  font-user-message class on node or ancestor
   *   Gemini:  user-query / model-response custom elements
   *
   * @param {HTMLElement} node
   * @returns {string} 'user', 'assistant', or this.platformName as fallback
   */
  getRoleForNode(node) {
    try {
      // ChatGPT / OpenAI: data-message-author-role on ancestor article
      const roleEl = node.closest('[data-message-author-role]');
      if (roleEl) return roleEl.getAttribute('data-message-author-role'); // 'user' or 'assistant'

      // Claude.ai: class-based role detection
      if (node.closest('[class*="font-user-message"]')) return 'user';
      if (node.closest('.font-claude-message, [class*="font-claude"]')) return 'assistant';

      // Gemini: custom element wrappers
      if (node.closest('user-query')) return 'user';
      if (node.closest('model-response')) return 'assistant';
    } catch (e) { /* ignore — DOM queries can fail if page is changing */ }

    // Fallback: platform name (pre-v2.17 behavior, no regression)
    return this.platformName;
  }

  /**
   * Check if this parser should run on current page
   * @returns {boolean} True if platform matches
   */
  isActive() {
    const hostname = location.hostname;
    return this.matchesHostname(hostname);
  }

  /**
   * Check if hostname matches this platform
   * Override in subclass
   * @param {string} hostname - Current page hostname
   * @returns {boolean} True if matches
   */
  matchesHostname(hostname) {
    throw new Error('matchesHostname() must be implemented by subclass');
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.BaseParser = BaseParser;
}

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

      if (this.isValidMessage(text)) {
        messages.push({
          id: `${this.platformName}-${idx}`,
          source: this.platformName,
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

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
    return '[data-message-content], article, .response-container';
  }

  /**
   * Check if hostname is Gemini
   */
  matchesHostname(hostname) {
    return hostname.includes('gemini');
  }

  /**
   * Gemini doesn't have mutation observer yet
   * Relies on 2.5s polling interval
   * TODO: Add observer if Gemini DOM structure is identified
   */
  setupObserver(callback) {
    void 0;
    return null;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.GeminiParser = GeminiParser;
}

/**
 * Copilot Parser
 * Handles copilot.microsoft.com
 *
 * v2.14.8: Extracted from monolithic content-parser.js
 */

class CopilotParser extends BaseParser {
  constructor() {
    super('copilot');
  }

  /**
   * Copilot-specific selectors
   * Multiple fallbacks due to varying Copilot UI structures
   * v2.14.15: Added M365 Copilot selectors (data-testid, id patterns)
   */
  getSelectors() {
    return '[data-testid="chatOutput"], [id*="-message-"], [class*="Message__message"], .ac-textBlock, .cib-message-content, [class*="message"], [class*="response-message"], [data-content], .text-message-content';
  }

  /**
   * Check if hostname is Copilot (including M365 variant)
   * v2.14.15: Added m365.cloud.microsoft support
   */
  matchesHostname(hostname) {
    return hostname.includes('copilot') || hostname.includes('m365.cloud.microsoft');
  }

  /**
   * Copilot doesn't have mutation observer yet
   * Relies on 2.5s polling interval
   * TODO: Add observer if Copilot DOM structure is identified
   */
  setupObserver(callback) {
    void 0;
    return null;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.CopilotParser = CopilotParser;
}

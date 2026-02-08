/**
 * Parser Registry
 * Factory pattern for platform-specific parsers
 *
 * v2.14.8: Modular refactor
 * Makes it easy to add new platforms or update existing ones
 */

class ParserRegistry {
  constructor() {
    this.parsers = [];
    this.activeParser = null;
    this.observer = null;
  }

  /**
   * Register a parser class
   * @param {Class} ParserClass - Parser class (extends BaseParser)
   */
  register(ParserClass) {
    this.parsers.push(ParserClass);
  }

  /**
   * Auto-detect and activate the right parser for current platform
   * @returns {BaseParser|null} Active parser instance or null
   */
  detectAndActivate() {
    const hostname = location.hostname;

    for (const ParserClass of this.parsers) {
      const parser = new ParserClass();
      if (parser.matchesHostname(hostname)) {
        this.activeParser = parser;
        void 0;
        return parser;
      }
    }

    console.warn('[VibeAI Parser] ⚠️  No parser found for:', hostname);
    return null;
  }

  /**
   * Get active parser
   * @returns {BaseParser|null}
   */
  getActiveParser() {
    return this.activeParser;
  }

  /**
   * Extract messages using active parser
   * @returns {Array} Array of message objects
   */
  extractMessages() {
    if (!this.activeParser) {
      console.warn('[VibeAI Parser] ⚠️  No active parser, cannot extract messages');
      return [];
    }

    return this.activeParser.extractMessages();
  }

  /**
   * Setup mutation observer for active parser (if supported)
   * @param {Function} callback - Function to call when DOM changes
   */
  setupObserver(callback) {
    if (!this.activeParser) return;

    // Only setup if parser supports observers
    if (typeof this.activeParser.setupObserver === 'function') {
      this.observer = this.activeParser.setupObserver(callback);
    }
  }

  /**
   * Get platform name of active parser
   * @returns {string|null} Platform name or null
   */
  getPlatformName() {
    return this.activeParser?.platformName || null;
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Create global registry instance
if (typeof window !== 'undefined') {
  window.ParserRegistry = ParserRegistry;

  // Auto-initialize registry with all parsers
  window.__vibeai_parser_registry = new ParserRegistry();

  // Register all available parsers
  // Note: Order doesn't matter since each parser checks hostname
  if (window.ChatGPTParser) window.__vibeai_parser_registry.register(ChatGPTParser);
  if (window.ClaudeParser) window.__vibeai_parser_registry.register(ClaudeParser);
  if (window.GeminiParser) window.__vibeai_parser_registry.register(GeminiParser);

  void 0;
}

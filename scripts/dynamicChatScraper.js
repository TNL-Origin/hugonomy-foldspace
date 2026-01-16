// VibeAI FoldSpace v1.0.8 — Unified Dynamic Scraper Upgrade
// Cross-platform chat detection with structured delays, title observers, and URL fallbacks

(function () {
  'use strict';

  const RETRY_INTERVAL_MS = 6000;

  // Detect platform
  const platform = (() => {
    const h = location.hostname;
    if (h.includes('chatgpt.com')) return 'chatgpt';
    if (h.includes('claude.ai')) return 'claude';
    if (h.includes('gemini.google.com')) return 'gemini';
    if (h.includes('copilot.microsoft.com')) return 'copilot';
    return 'unknown';
  })();

  console.log('[VibeAI] 🧠 Dynamic scraper v1.0.8 initialized for', platform);

  // ---- Shadow DOM recursive query helper ----
  function queryAllDeep(selector, root = document) {
    const elements = [];
    try {
      elements.push(...root.querySelectorAll(selector));
      const shadowHosts = [...root.querySelectorAll('*')].filter(el => el.shadowRoot);
      for (const host of shadowHosts) {
        elements.push(...queryAllDeep(selector, host.shadowRoot));
      }
    } catch (err) {
      console.warn('[VibeAI] ⚠️ Shadow DOM scan error:', err);
    }
    return elements;
  }

  // ---- Selector definitions ----
  const selectors = {
    chatgpt: {
      phase1: ['nav ol li a'],
      phase2: ['div[data-testid^="conversation-item"]'],
      phase3: ['nav a[href^="/c/"]', 'ol li a[href*="/c/"]']
    },
    claude: ['a[href^="/chat/"]', 'div[data-testid="chat-item"] a'],
    gemini: [
      'cib-conversation-group',
      'cib-message',
      'div[role="listitem"]',
      'mat-list-item',
      'conversation-list'
    ],
    copilot: ['[data-telemetry-id*="chat-thread"]', 'a[href*="/chats/"]', 'button[aria-label*="Chat"]']
  };

  // ---- ChatGPT Three-Phase Delayed Scan ----
  async function scrapeChatGPT() {
    const phases = [
      { delay: 0, selectors: selectors.chatgpt.phase1, name: 'phase 1' },
      { delay: 2000, selectors: selectors.chatgpt.phase2, name: 'phase 2' },
      { delay: 4000, selectors: selectors.chatgpt.phase3, name: 'phase 3' }
    ];

    for (const phase of phases) {
      await new Promise(resolve => setTimeout(resolve, phase.delay));
      console.log(`[VibeAI] 💫 Attempting ChatGPT selector ${phase.name}...`);

      for (const sel of phase.selectors) {
        const nodes = document.querySelectorAll(sel);
        if (nodes.length) {
          const chats = Array.from(nodes)
            .map(el => el.innerText || el.textContent)
            .filter(Boolean)
            .map(t => t.trim());

          if (chats.length) {
            console.log(`[VibeAI] 💫 ChatGPT ${phase.name} found ${chats.length} chats`);
            return chats;
          }
        }
      }
    }

    // Fallback to document title
    const title = document.title?.trim();
    if (title) {
      console.log('[VibeAI] 🌸 Fallback title used:', title);
      return [`${title} (Fallback)`];
    }

    return [];
  }

  // ---- Claude Scraper (Reference Baseline) ----
  function scrapeClaude() {
    for (const sel of selectors.claude) {
      const nodes = document.querySelectorAll(sel);
      if (nodes.length) {
        const chats = Array.from(nodes)
          .map(el => el.innerText || el.textContent)
          .filter(Boolean)
          .map(t => t.trim());

        if (chats.length) {
          console.log(`[VibeAI] 💫 Claude found ${chats.length} chats`);
          return chats;
        }
      }
    }
    return [];
  }

  // ---- Gemini Scraper (ShadowRoot + Title Observer) ----
  function scrapeGemini() {
    for (const sel of selectors.gemini) {
      const nodes = queryAllDeep(sel);
      if (nodes.length) {
        const chats = Array.from(nodes)
          .map(el => el.innerText || el.textContent)
          .filter(Boolean)
          .map(t => t.trim());

        if (chats.length) {
          console.log(`[VibeAI] 💫 Gemini found ${chats.length} chats`);
          return chats;
        }
      }
    }

    // Fallback: use tab title
    const title = document.title?.trim();
    if (title) {
      console.log('[VibeAI] 🌸 Fallback title used:', title);
      return [`${title} (active Gemini tab)`];
    }

    return [];
  }

  // ---- Copilot Scraper (URL Parsing Fallback) ----
  function scrapeCopilot() {
    for (const sel of selectors.copilot) {
      const nodes = document.querySelectorAll(sel);
      if (nodes.length) {
        const chats = Array.from(nodes)
          .map(el => el.innerText || el.textContent)
          .filter(Boolean)
          .map(t => t.trim());

        if (chats.length) {
          console.log(`[VibeAI] 💫 Copilot found ${chats.length} chats`);
          return chats;
        }
      }
    }

    // URL fallback
    if (window.location.pathname.includes('/chats/')) {
      console.log('[VibeAI] 🌸 Copilot URL fallback used');
      return ['Microsoft Copilot (active chat)'];
    }

    return [];
  }

  // ---- Unified Scraper Core ----
  let scrapeInProgress = false;

  async function scrapeChats() {
    if (scrapeInProgress) return;
    scrapeInProgress = true;

    let chats = [];

    try {
      switch (platform) {
        case 'chatgpt':
          chats = await scrapeChatGPT();
          break;
        case 'claude':
          chats = scrapeClaude();
          break;
        case 'gemini':
          chats = scrapeGemini();
          break;
        case 'copilot':
          chats = scrapeCopilot();
          break;
      }

      if (!chats.length) {
        console.warn(`[VibeAI] 🔁 Retrying scrape in ${RETRY_INTERVAL_MS / 1000} s...`);
        setTimeout(() => {
          scrapeInProgress = false;
          scrapeChats();
        }, RETRY_INTERVAL_MS);
        return;
      }

      console.log(`[VibeAI] 🧩 ${platform} chats updated (${chats.length})`);
      window.postMessage({ type: 'VIBEAI_CHATS', payload: chats.slice(0, 50) }, '*');
    } finally {
      scrapeInProgress = false;
    }
  }

  // ---- Gemini Title Observer ----
  if (platform === 'gemini') {
    let titleDebounce;
    const titleObserver = new MutationObserver(() => {
      clearTimeout(titleDebounce);
      titleDebounce = setTimeout(() => {
        console.log('[VibeAI] 🔁 Title change detected, refreshing chat list');
        scrapeChats();
      }, 1000);
    });

    const titleElement = document.querySelector('title');
    if (titleElement) {
      titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
      console.log('[VibeAI] ⚙️ Gemini title observer active');
    }
  }

  // ---- Initialize with adaptive delay ----
  const initialDelay =
    platform === 'gemini' ? 5000 : platform === 'chatgpt' ? 3000 : 1500;
  setTimeout(scrapeChats, initialDelay);

  // ---- Observe DOM mutations ----
  const observer = new MutationObserver(() => {
    if (!scrapeInProgress) {
      scrapeChats();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ---- Export manual trigger ----
  window.VibeAI = window.VibeAI || {};
  window.VibeAI.scanChats = scrapeChats;

  console.log(`[VibeAI] 🌐 Observer active for ${platform}`);
})();

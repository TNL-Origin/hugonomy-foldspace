void 0;
// vStable-2.4.3 handshake timeout (ms)
const HANDSHAKE_TIMEOUT = 20000;
const HANDSHAKE_RETRY_DELAY = 4000; // ms between retry and final enforcement

// Minimal no-op analysis trigger (real implementation may live elsewhere)
function _triggerLocalAnalysis() { /* noop */ }

// Force the HUD iframe into click-through mode (belt-and-suspenders)
function ensurePointerRelease() {
  try {
    const iframe = document.querySelector('#vibeai-hud-frame');
    if (!iframe) return;
    iframe.style.setProperty('position', 'fixed', 'important');
    iframe.style.setProperty('top', '0', 'important');
    iframe.style.setProperty('right', '0', 'important');
    iframe.style.setProperty('left', 'auto', 'important');
    iframe.style.setProperty('width', '380px', 'important');
    iframe.style.setProperty('height', '100vh', 'important');
    iframe.style.setProperty('pointer-events', 'none', 'important');
    iframe.style.setProperty('z-index', '2147483647', 'important');
    iframe.style.setProperty('border', 'none', 'important');
    void 0;
  } catch { /* non-fatal */ }
}

// Pending handshakes map (shared on window for cross-script visibility)
window.__vibeai_pending_handshakes = window.__vibeai_pending_handshakes || new Map();
const pendingHandshakes = window.__vibeai_pending_handshakes;

// Utility to get extension URL, tolerant to non-extension contexts
function extUrl(path) {
  try {
    if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime && window.chrome.runtime.getURL) return window.chrome.runtime.getURL(path);
    return `./${path}`;
  } catch { return `./${path}`; }
}

    // Handle simple messages early (scroll & clickthrough commands)
    window.addEventListener('message', (ev) => {
      try {
        const d = ev?.data || {};
        if (d.type === 'VIBEAI_SCROLL_TO') {
          const idx = parseInt(d.index, 10);
          const list = document.querySelectorAll('.markdown, .chat-message, .text-message, [data-message-id], .message, [role="article"], .response-container');
          if (list && list[idx]) {
            list[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
            void 0;
          } else console.warn('[VibeAI] Requested index not found:', idx);
        }
        if (d.type === 'VIBEAI_ALLOW_CLICKTHROUGH') {
          const host = document.getElementById('vibeai-hud-container');
          if (host) host.style.pointerEvents = 'none';
        }
        if (d.type === 'VIBEAI_BLOCK_CLICKTHROUGH') {
          const host = document.getElementById('vibeai-hud-container');
          if (host) host.style.pointerEvents = 'auto';
        }
      } catch { /* ignore */ }
    });

    void 0;

// ID generator
function makeInstanceId() { return `hud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`; }

window.vibeaiCleanupPaused = false;
window.vibeaiActiveInstanceId = null;
let _iframeWindow = null;

    // Inject HUD iframe (scoped, click-through by default)
    function injectHUD() {
      try {
        window.vibeaiCleanupPaused = true;
        const instanceId = makeInstanceId();
        window.vibeaiActiveInstanceId = instanceId;

        const container = document.createElement('div');
        container.id = `vibeai-hud-container-${instanceId}`;
        container.dataset.vibeaiInstance = instanceId;
        container.dataset.vibeaiCreatedAt = String(Date.now());
        container.dataset.vibeaiVerified = 'false';
        Object.assign(container.style, { position: 'fixed', top: '0px', right: '0px', width: '420px', zIndex: String(2147483646), pointerEvents: 'none', background: 'transparent' });

        const shadow = container.attachShadow({ mode: 'open' });
        const iframe = document.createElement('iframe');
        iframe.id = 'vibeai-hud-frame';
        iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-modals';

        // Narrow, click-through sidebar styles
        iframe.style.cssText = `position: fixed !important; top: 0 !important; right: 0 !important; left: auto !important; width: 380px !important; height: 100vh !important; border: none !important; z-index: 2147483647 !important; pointer-events: none !important;`;

        // Determine platform for query param (best-effort)
        let platform = 'unknown';
        try {
          const host = location.hostname || '';
          if (host.includes('chatgpt') || host.includes('openai')) platform = 'chatgpt';
          else if (host.includes('gemini.google')) platform = 'gemini';
          else if (host.includes('claude.ai')) platform = 'claude';
          else if (host.includes('copilot.microsoft')) platform = 'copilot';
        } catch { /* ignore */ }

  try { iframe.src = extUrl(`src/foldspace.html?platform=${platform}`); } catch { iframe.src = `./src/foldspace.html?platform=${platform}`; }
        shadow.appendChild(iframe);

        // 🧭 Claude Visible Anchor Integration (v2.11.6)
        // Use safe-root if it exists (Claude platform), otherwise use documentElement
        const mountTarget = document.getElementById('vibeai-safe-root') || document.documentElement;
        mountTarget.appendChild(container);
        if (mountTarget.id === 'vibeai-safe-root') {
          void 0;
        }

        // Force styles again after append
        setTimeout(() => {
          iframe.style.setProperty('position', 'fixed', 'important');
          iframe.style.setProperty('top', '0', 'important');
          iframe.style.setProperty('right', '0', 'important');
          iframe.style.setProperty('left', 'auto', 'important');
          iframe.style.setProperty('width', '380px', 'important');
          iframe.style.setProperty('height', '100vh', 'important');
          iframe.style.setProperty('pointer-events', 'none', 'important');
          iframe.style.setProperty('z-index', '2147483647', 'important');
          iframe.style.setProperty('border', 'none', 'important');
          void 0;
        }, 100);

        // Remove other instances
        Array.from(document.querySelectorAll('[data-vibeai-instance]')).forEach((el) => {
          try { if (el.dataset.vibeaiInstance !== instanceId) el.remove(); } catch { /* ignore */ }
        });

  _iframeWindow = iframe.contentWindow;

        // Setup handshake entry with retry logic
        try {
          const entry = { createdAt: Date.now(), retries: 0 };
          const scheduleTimeout = (delay) => setTimeout(() => onHandshakeTimeout(instanceId), delay);
          entry.timer = scheduleTimeout(HANDSHAKE_TIMEOUT);
          pendingHandshakes.set(instanceId, entry);
        } catch { /* ignore */ }

        // Finish grace period
        setTimeout(() => { window.vibeaiCleanupPaused = false; void 0; }, 10000);
      } catch (err) {
        console.warn('[VibeAI] injectHUD failed', err);
        window.vibeaiCleanupPaused = false;
      }
    }

    function onHandshakeTimeout(instanceId) {
      try {
        const entry = pendingHandshakes.get(instanceId);
        if (!entry) return;
        if (entry.retries === 0) {
          // first timeout: retry once by posting bind request
          entry.retries = 1;
          try {
            const frame = document.querySelector('#vibeai-hud-frame');
            if (frame && frame.contentWindow) {
              frame.contentWindow.postMessage({ type: 'VIBEAI_BIND_REQUEST', instanceId }, '*');
              console.warn('[VibeAI] Handshake retry posted for', instanceId);
            }
          } catch { /* ignore */ }
          // schedule final enforcement
          entry.timer = setTimeout(() => onHandshakeTimeout(instanceId), HANDSHAKE_RETRY_DELAY);
          pendingHandshakes.set(instanceId, entry);
        } else {
          // second timeout: give up and enforce pointer-release / cleanup
          console.warn('[VibeAI] Handshake failed after retry for', instanceId);
          try { ensurePointerRelease(); } catch { /* ignore */ }
          pendingHandshakes.delete(instanceId);
          // remove unverified instance element
          try {
            const el = document.querySelector(`[data-vibeai-instance="${instanceId}"]`);
            if (el && el.dataset.vibeaiVerified !== 'true') el.remove();
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }

    // Message handler for handshake and HUD control events
  const ORIGIN = (function () { try { if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime && window.chrome.runtime.getURL) return new URL(window.chrome.runtime.getURL('')).origin; } catch { /* ignore */ } return '*'; })();
    window.addEventListener('message', (ev) => {
      try {
        if (ORIGIN !== '*' && ev.origin !== ORIGIN) return;
        const d = ev.data || {};
        if (d.type === 'VIBEAI_RENDER_READY') {
          const instanceId = d.instanceId || window.vibeaiActiveInstanceId;
          const entry = pendingHandshakes.get(instanceId);
          if (entry) {
            try { clearTimeout(entry.timer); } catch { /* ignore */ }
            pendingHandshakes.delete(instanceId);
          }
          // mark verified
          try {
            const el = document.querySelector(`[data-vibeai-instance="${instanceId}"]`);
            if (el) el.dataset.vibeaiVerified = 'true';
            void 0;
          } catch { /* ignore */ }
        }
        // 🛡️ Claude Handshake Soft-Bind Fallback (v2.11.3)
        if (d.type === 'VIBEAI_BIND_REQUEST') {
          try {
            const hud = document.querySelector("#vibeai-safe-root") || document.querySelector("#vibeai-root");
            if (hud) {
              hud.dataset.vibeVerified = "true";
              void 0;
            } else {
              console.warn("[VibeAI] Safe-root not found for handshake");
            }
          } catch (err) {
            console.warn("[VibeAI] Handshake fallback error:", err);
          }
        }
        if (d.type === 'VIBEAI_HUD_CLOSE') {
          try { const el = document.querySelector(`[data-vibeai-instance="${window.vibeaiActiveInstanceId}"]`); if (el) el.remove(); window.vibeaiActiveInstanceId = null; _iframeWindow = null; } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    });

    // Cleanup stale HUDs periodically
    function cleanupStaleHUDs() {
      try {
        if (window.vibeaiCleanupPaused) return;
        document.querySelectorAll('[data-vibeai-instance]').forEach((el) => {
          try {
            const id = el.dataset.vibeaiInstance;
            const created = parseInt(el.dataset.vibeaiCreatedAt || '0', 10);
            const verified = el.dataset.vibeaiVerified === 'true';
            const age = Date.now() - (created || 0);
            // 🛡️ Claude Handshake Soft-Bind Patch (v2.11.3) - preserve HUD under safe-root
            if (!verified && age > 5000) {
              const rootExists = document.querySelector("#vibeai-safe-root");
              if (!rootExists) {
                console.warn("[VibeAI] Removing unverified HUD:", id, "age", age);
                el.remove();
              } else {
                void 0;
              }
            }
          } catch { /* ignore per-entry */ }
        });
      } catch { /* non-fatal */ }
    }

    setInterval(cleanupStaleHUDs, 7000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(cleanupStaleHUDs, 1000); });

    // Mutation observer to reinject only when safe
    const reinjectObserver = new MutationObserver(() => {
      try {
        const id = window.vibeaiActiveInstanceId;
        if (!id) return;
        const el = document.querySelector(`[data-vibeai-instance="${id}"]`);
        const pending = pendingHandshakes.has(id);
        if (!el || !document.body.contains(el)) {
          if (!pending) injectHUD();
          else void 0;
        }
      } catch { /* ignore */ }
    });
    reinjectObserver.observe(document.documentElement, { childList: true, subtree: true });

    // start
    injectHUD();

    // Final pointer-release sweep as an extra safety
    setTimeout(() => {
      try {
        if (!window.__vibeai_release_ran) {
          ensurePointerRelease();
          window.__vibeai_release_ran = true;
          void 0;
        }
      } catch { /* ignore */ }
    }, 5000);

    // Lightweight safety re-check every 30s: only repairs if pointer-events changed
    setInterval(() => {
      try {
        const iframe = document.querySelector('#vibeai-hud-frame');
        if (iframe && getComputedStyle(iframe).pointerEvents !== 'none') {
          iframe.style.setProperty('pointer-events', 'none', 'important');
          void 0;
        }
      } catch { /* ignore */ }
    }, 30000);

// End of content-script implementation

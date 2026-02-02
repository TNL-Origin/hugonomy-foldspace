// 🪐 VibeAI FoldSpace Auto-Injector + Bookmark Core (vStable-2.5.0-RC1)
chrome.runtime.onInstalled.addListener(() => {
  void 0;
});

// 🚫 DISABLED: Old iframe HUD injection (replaced by unified-hud.js in v2.11.10)
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete') {
//     // Match target hostnames
//     const targetHosts = ['chat.openai.com', 'chatgpt.com', 'gemini.google.com', 'copilot.microsoft.com'];
//     if (targetHosts.some(host => tab.url && tab.url.includes(host))) {
//       const scriptPath = 'foldspace.js';
//       const scriptUrl = chrome.runtime.getURL(scriptPath);
//       console.log('[VibeAI] Attempting HUD injection for', tab.url, '→', scriptUrl);
//       chrome.scripting.executeScript({
//         target: { tabId },
//         files: [scriptPath], // FIX: Use relative path, not full URL
//       }).then(() => {
//         console.log('[VibeAI] ✅ HUD script injected successfully:', scriptUrl);
//       }).catch(err => {
//         console.error('[VibeAI] ❌ HUD injection failed:', err);
//       });
//     }
//   }
// });

// 📘 Message Listener for Thread Parsing & Bookmark Management
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Helper: produce redacted thread structure
  function redactThread(t) {
    try {
      const id = t?.id || `thread-${Date.now()}`;
      const platform = t?.source || t?.platform || 'unknown';
      const title = t?.title || (t?.content ? (t.content.trim().split(/\s+/).slice(0,5).join(' ') + (t.content.trim().split(/\s+/).length>5 ? '...' : '')) : 'Untitled Thread');
      const timestamp = t?.timestamp || Date.now();
      const hugoScore = t?.hugoScore || (t?.hri ? Math.round(t.hri * 100) : undefined);
      const content = t?.content ? String(t.content).slice(0,140) : undefined;
      return { id, title, timestamp, platform, hugoScore, content };
    } catch (e) { return { id: `thread-${Date.now()}`, title: 'Untitled Thread', timestamp: Date.now(), platform: 'unknown' }; }
  }

  // Helper: produce redacted bookmark structure
  function redactBookmark(b) {
    try {
      const bookmarkId = b?.bookmarkId || b?.id || `bm-${Date.now()}`;
      const threadId = b?.threadId || b?.id || b?.thread?.id || null;
      const note = b?.note ? String(b.note).slice(0,140) : (b?.content ? String(b.content).slice(0,140) : undefined);
      const createdAt = b?.createdAt || Date.now();
      const platform = b?.platform || b?.source || 'unknown';
      return { bookmarkId, threadId, note, createdAt, platform };
    } catch (e) { return { bookmarkId: `bm-${Date.now()}`, threadId: null, note: '', createdAt: Date.now(), platform: 'unknown' }; }
  }

  // Handle thread extraction from content-parser.js — redact before persisting
  if (msg.type === "THREADS_EXTRACTED") {
    try {
      const threads = Array.isArray(msg.payload) ? msg.payload : [];
      const redacted = threads.map(redactThread);
      chrome.storage.local.set({ lastThreads: redacted }, () => {
        void 0;
      });
      sendResponse({ status: "OK" });
    } catch (err) {
      console.error('[VibeAI] Failed to redact/persist threads:', err);
      sendResponse({ status: 'ERROR', message: String(err) });
    }
    return true;
  }

  // Handle bookmark retrieval requests
  if (msg.type === "GET_BOOKMARKS") {
    chrome.storage.local.get(["bookmarks"], data => {
      const list = Array.isArray(data.bookmarks) ? data.bookmarks.map(redactBookmark) : [];
      sendResponse({ status: "OK", bookmarks: list });
    });
    return true; // Keep channel open for async response
  }

  // Handle bookmark additions
  if (msg.type === "ADD_BOOKMARK") {
    chrome.storage.local.get(["bookmarks"], data => {
      const existing = Array.isArray(data.bookmarks) ? data.bookmarks : [];
      const redacted = redactBookmark(msg.payload || {});
      const updated = existing.concat(redacted);
      // Overwrite stored bookmarks with redacted-only records (migration-safe)
      chrome.storage.local.set({ bookmarks: updated }, () => {
        void 0;
        sendResponse({ status: "OK" });
      });
    });
    return true; // Keep channel open for async response
  }

  // Handle thread retrieval requests
  if (msg.type === "GET_THREADS") {
    chrome.storage.local.get(["lastThreads"], data => {
      const threads = Array.isArray(data.lastThreads) ? data.lastThreads.map(redactThread) : [];
      sendResponse({ status: "OK", threads });
    });
    return true; // Keep channel open for async response
  }
});

// 🪐 VibeAI FoldSpace Auto-Injector + Bookmark Core (vStable-2.5.0-RC1)
chrome.runtime.onInstalled.addListener(() => {
  console.log("[VibeAI] Background service worker initialized.");
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

// 📘 Message Listener for Bookmark Management
// v2.19.2: Removed THREADS_EXTRACTED + GET_THREADS + redactThread — legacy dead code,
// privacy alignment (lastThreads auto-storage was undisclosed chat content persistence).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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

  // Handle bookmark retrieval requests
  if (msg.type === "GET_BOOKMARKS") {
    chrome.storage.local.get(["bookmarks"], data => {
      const list = Array.isArray(data.bookmarks) ? data.bookmarks.map(redactBookmark) : [];
      sendResponse({ status: "OK", bookmarks: list });
    });
    return true;
  }

  // Handle bookmark additions
  if (msg.type === "ADD_BOOKMARK") {
    chrome.storage.local.get(["bookmarks"], data => {
      const existing = Array.isArray(data.bookmarks) ? data.bookmarks : [];
      const redacted = redactBookmark(msg.payload || {});
      const updated = existing.concat(redacted);
      chrome.storage.local.set({ bookmarks: updated }, () => {
        sendResponse({ status: "OK" });
      });
    });
    return true;
  }
});

// VibeAI FoldSpace Background Worker — Stable v1.1.0
// Ensures clean registration under Manifest V3

/* global chrome */
/* eslint-env browser */
const { runtime: _runtime } = chrome || {};
// --- Initialization ---
console.log("🌀 VibeAI FoldSpace Background Worker active");

// Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("🔧 Extension installed or updated:", details.reason);
  if (details.reason === "install") {
    chrome.storage.sync.set({ consentAccepted: false });
  }
});

// Handle startup reinitialization
chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 Chrome restarted, reinitializing FoldSpace session.");
});

// Message listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📨 Background received message:", msg);

  try {
    if (msg.action === "ping") {
      sendResponse({ pong: true, status: "ok" });
    }

    // Example: Trigger page reload if user clears data
    if (msg.action === "clearData") {
      chrome.storage.local.clear(() => {
        console.log("🧹 Cleared local storage");
        sendResponse({ cleared: true });
      });
      return true; // Keep channel open for async response
    }

  } catch (err) {
    console.error("❌ Background error:", err);
    sendResponse({ error: err.message });
  }
});

// Keep-alive heartbeat (prevents context invalidation)
setInterval(() => {
  chrome.runtime.getPlatformInfo(() => {
    // Light-touch ping to prevent context timeout
  });
}, 1000 * 60 * 5); // every 5 min

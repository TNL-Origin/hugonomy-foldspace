# Known Issues — VibeAI FoldSpace v2.19.2

## Active Issues

### HUD Position on Page Refresh (Edge + Chrome)

**Status:** Under investigation
**Platforms:** Edge (more frequent), Chrome (occasional)
After a page refresh, the HUD panel may render off-screen or partially clipped. Workaround: drag the HUD header to reposition it.

---

## Resolved Issues (recent)

### ChatGPT Consent Modal — React Hydration (resolved v2.15.1)

**Platform:** ChatGPT (chat.openai.com, chatgpt.com)
**Status:** ✅ Fixed — Shadow DOM protection integrated to prevent React hydration interference.

### Gemini Stage Detection (resolved v2.19.0)

**Platform:** Gemini (gemini.google.com)
**Status:** ✅ Fixed — selector corrected to `user-query / model-response` (live DOM confirmed).

### Short User Message Classification (resolved v2.17.2)

**All platforms**
**Status:** ✅ Fixed — Short acknowledgments ("ok", "thanks") now correctly detected as user engagement signals. Role detection runs before length filtering.

### Fresh Install Consent Flow (resolved v2.17.1)

**All platforms**
**Status:** ✅ Fixed — `chrome.storage.onChanged` watcher ensures stage poller starts correctly after first consent on a fresh install.

---

## Reporting Issues

If you encounter issues not listed here, please report them at:
**GitHub Issues:** https://github.com/TNL-Origin/hugonomy-foldspace/issues
**Email:** hugonomysystems@gmail.com

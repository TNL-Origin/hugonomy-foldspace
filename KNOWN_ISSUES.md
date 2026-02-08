# Known Issues - VibeAI FoldSpace v2.15.1

## ChatGPT Consent Modal Refresh Workaround

**Platform:** ChatGPT (chat.openai.com, chatgpt.com)
**Issue:** In rare cases, the consent modal may not appear on first page load.
**Workaround:** If the consent modal does not load when first visiting ChatGPT, **refresh the page** (F5 or Ctrl+R). The modal will appear correctly on the second load.

**Status:** This is a timing quirk related to ChatGPT's React hydration sequence. Does not affect functionality after consent is granted.

**Frequency:** Occasional, typically only on first install or after clearing extension data.

---

## Microsoft Edge Copilot Blocking

**Platform:** Microsoft Copilot (copilot.microsoft.com) when accessed via Edge browser
**Issue:** Microsoft Edge blocks extensions from running on copilot.microsoft.com by browser policy.
**Workaround:** Use Chrome, Brave, or another Chromium browser to access Microsoft Copilot with VibeAI FoldSpace.

**Status:** This is a Microsoft Edge browser policy, not an extension limitation. The extension works correctly on Copilot when accessed via other browsers.

---

## Reporting Issues

If you encounter issues not listed here, please report them at:
**GitHub Issues:** https://github.com/TNL-Origin/hugonomy-foldspace/issues
**Email:** hugonomysystems@gmail.com

# VibeAI FoldSpace

**AI conversation awareness — stay engaged, think critically, reflect before you accept.**

A browser extension for Chrome and Edge that runs a real-time thinking engagement signal alongside your AI conversations on ChatGPT, Claude.ai, and Gemini.

> "AI should support human clarity — not quietly erode it."

---

## What It Does

VibeAI FoldSpace watches how you engage in AI conversations and reflects that back to you:

- **Thinking Engagement** — live signal showing whether you are actively engaged or drifting into passive acceptance
- **Nudge** — a gentle prompt when passive acceptance is detected ("Thinking Mirror")
- **Bookmark** — save meaningful moments for later reflection
- **Interaction Timeline** — see how the conversation unfolded
- **Emotional Context** — background signal supporting thinking engagement analysis
- **Coach** — optional guidance for improving prompts and interaction clarity

---

## Supported Platforms

| Platform | Status |
|---|---|
| ChatGPT (chat.openai.com / chatgpt.com) | ✅ Supported |
| Claude.ai | ✅ Supported |
| Gemini (gemini.google.com) | ✅ Supported |

---

## Privacy

**All processing is local. No data leaves your device.**

- No network interception
- No content rewriting
- No telemetry or analytics
- No third-party calls
- `chrome.storage.local` only — user-clearable at any time

Storage keys: `vibeai_bookmarks` (up to 100), `vibeai_session_log` (up to 50 entries), `consentGiven`, `consentDeferred`, `vibeai_onboarded`.

See [privacy.html](privacy.html) for full privacy policy.

---

## Install

**Chrome Web Store:**
[VibeAI FoldSpace on Chrome Web Store](https://chromewebstore.google.com/detail/lkmfjgaahnmlncgaeocfgiohjiodiohi)

**Load unpacked (developer):**
1. Clone this repo
2. Open `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked" → select this folder

---

## Repository Structure

```
/
├── manifest.json              # Extension manifest (MV3)
├── background.js              # Service worker
├── content-parser.js          # Main content script entry
├── privacy.html               # Privacy policy
├── scripts/
│   ├── consent-script.js      # Consent modal (Shadow DOM)
│   ├── unified-hud.js         # Main HUD UI
│   ├── engine/
│   │   ├── stage-detector.js      # Thinking engagement classifier
│   │   ├── nudge-engine.js        # Passive acceptance nudge logic
│   │   ├── bookmark-manager.js    # Bookmark storage
│   │   ├── session-manager.js     # Session reflection log
│   │   └── consent-helper.js      # Consent state bridge
│   ├── parsers/               # Per-platform DOM parsers
│   └── vibeai-coach/          # Coach panel logic
├── scripts/hugoscore-engine.js    # ⚠️ See note below
└── assembly/                  # AssemblyScript WebAssembly source
```

### ⚠️ HugoScore Engine — Proprietary Algorithm

`scripts/hugoscore-engine.js` is distributed in **protected (obfuscated) form**.

The HugoScore algorithm is the proprietary intellectual property of Hugonomy Systems and Joseph D. Tingling. It is not open source. Distribution of this file in protected form is intentional and does not affect your ability to use, fork, or build on all other parts of this repository.

All other source files are plain, readable JavaScript under the MIT License (see [LICENSE.md](LICENSE.md)).

---

## Version

**Current: v2.19.2** — Published March 18, 2026

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for known issues and current status.

---

## Contact

- **Website**: [hugonomy.com](https://hugonomy.com)
- **Issues**: [GitHub Issues](https://github.com/TNL-Origin/hugonomy-foldspace/issues)
- **Email**: hugonomysystems@gmail.com

---

*Built by Hugonomy Systems. © 2026 Joseph D. Tingling.*

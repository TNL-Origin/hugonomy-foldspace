# 🌌 VibeAI FoldSpace

**Unified Thread Inspector & Emotional Tone Analyzer**
Chrome Extension for AI Chat Platforms (ChatGPT, Copilot, Gemini, Claude)

[![Version](https://img.shields.io/badge/version-2.11.11-blue.svg)](https://github.com/TNL-Origin/vibeai-foldspace)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Chrome%20Extension-green.svg)](https://developer.chrome.com/docs/extensions/)

---

## 🎯 Overview

VibeAI FoldSpace is a **privacy-first Chrome extension** that provides real-time emotional tone analysis and thread inspection for AI chat platforms. Using the proprietary **HugoScore algorithm**, it analyzes conversational threads to detect emotional resonance patterns, helping users maintain awareness of emotional tone in their AI interactions.

### ✨ Key Features

- 🧠 **Real-time Thread Analysis** - Parses chat messages every 8 seconds
- 🎨 **Emotional Tone Visualization** - HugoScore-based color coding (Resonant, Calm, Tense, Drift)
- 🔒 **Privacy-First** - All processing happens locally in your browser
- 🎯 **Multi-Platform Support** - Works with ChatGPT, Copilot, Gemini, and Claude
- 📊 **Unified HUD Interface** - Clean, transparent overlay with traditional window controls
- ✅ **Consent Modal** - First-time user consent flow with privacy transparency

---

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/TNL-Origin/vibeai-foldspace.git
   cd vibeai-foldspace
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked**
   - Select the `vibeai-foldspace/dist` folder

5. **Verify Installation**
   - Extension icon should appear in Chrome toolbar
   - Visit any supported platform (ChatGPT, Copilot, Gemini, Claude)
   - HUD should appear on the right side after accepting consent

---

## 📖 Usage

### First Launch

When you first visit a supported platform:

1. **Consent Modal** will appear explaining data processing
2. Click **Accept & Continue** to enable the extension
3. The **Unified HUD** will appear on the right side of your screen

### HUD Controls

- **🔄 Reanalyze** - Re-scan current page for threads
- **—** (Minimize) - Hide/show FoldSpace canvas
- **✕** (Close) - Hide the HUD
- **📋 Consent** - Review consent and privacy settings
- **🔒 Privacy** - View detailed privacy statement
- **🐛 Report Bug** - Submit bug reports via GitHub Issues

### Emotional Tone Legend

| Color | Tone | HugoScore Range | Meaning |
|-------|------|-----------------|---------|
| 🟢 Green | Resonant | 85-100 | High emotional coherence |
| 🔵 Blue | Calm | 60-70 | Balanced, neutral tone |
| 🔴 Red | Tense | 50-60 | Elevated emotional tension |
| 🟡 Yellow | Drift | 0-50 | Low coherence, scattered |

---

## 🏗️ Architecture

### Core Components

```
vibeai-foldspace/
├── manifest.json              # Chrome extension manifest v3
├── background.js              # Service worker (message routing)
├── content-parser.js          # Thread extraction engine
├── scripts/
│   └── unified-hud.js        # Main HUD rendering (host page DOM)
├── src/
│   ├── foldspace.html        # Legacy iframe HUD (deprecated)
│   ├── foldspace-client.js   # Legacy HUD logic (deprecated)
│   ├── trailEngine.js        # Drift trail visualization
│   └── perf-monitor.js       # Performance monitoring
└── icons/                    # Extension icons

dist/                         # Build output (load this in Chrome)
```

### Key Technologies

- **Manifest v3** - Latest Chrome extension standard
- **Content Scripts** - DOM injection for supported platforms
- **Chrome Storage API** - Local-only thread persistence
- **HugoScore Algorithm** - Proprietary emotional tone analysis
- **Vite Build System** - Fast bundling and optimization

---

## 🔐 Privacy & Data

### What We Process

- ✅ Chat thread messages visible on the current page
- ✅ Emotional tone metrics (HugoScore algorithm)
- ✅ Thread metadata (timestamps, platform detection)

### What We DON'T Do

- ❌ **No external servers** - All processing is local
- ❌ **No data transmission** - Nothing leaves your browser
- ❌ **No analytics or tracking** - Zero telemetry
- ❌ **No sync to cloud** - Uses `chrome.storage.local` only

### Open Source Transparency

Full source code available at: [github.com/TNL-Origin/vibeai-foldspace](https://github.com/TNL-Origin/vibeai-foldspace)

📄 **Privacy Statement**: [tnl-origin.github.io/vibeai-foldspace/privacy.html](https://tnl-origin.github.io/vibeai-foldspace/privacy.html)

---

## 🛠️ Development

### Build Commands

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Clean build artifacts
rm -rf dist/
```

### Project Structure

- **content-parser.js** - Extracts threads from AI chat DOM
- **unified-hud.js** - Renders HUD directly in host page (v2.11.10+)
- **background.js** - Handles message routing and storage
- **manifest.json** - Extension configuration and permissions

### Supported Platforms

| Platform | URL Pattern | Status |
|----------|-------------|--------|
| ChatGPT | `chat.openai.com/*`, `chatgpt.com/*` | ✅ Supported |
| Copilot | `copilot.microsoft.com/*` | ✅ Supported |
| Gemini | `gemini.google.com/*` | ✅ Supported |
| Claude | `claude.ai/*` | ✅ Supported |

---

## 📋 Version History

### v2.11.11 (Current)

**Phase IV-Δ.11 - FoldSpace Mood Color System v1 (Enhanced Tiles)**

- ✅ Implemented FoldSpace Mood Color System with precise gradient matching
- ✅ Updated mood tile colors: Calm (cyan→blue), Urgent (amber→red), Reflective (purple→deep purple), Dissonant (slate→plum), Resonant (teal→magenta)
- ✅ Enhanced icon visibility with larger sizes (32px) and drop shadows
- ✅ Improved symbolic resonance: 🌊 Calm, ⚡ Urgent, 🔮 Reflective, ⚙️ Dissonant, ✨ Resonant
- ✅ Added box shadows and text shadows for better contrast
- ✅ Maintained full compatibility with all 4 platforms (ChatGPT, Gemini, Copilot, Claude)

### v2.11.10-UNIHUD-ALPHA

**Phase IV-Δ.10 - Unified HUD Container (Host Page DOM)**

- ✅ Migrated HUD from iframe to host page DOM
- ✅ Fixed pointer-events conflicts across all platforms
- ✅ Added consent modal with privacy transparency
- ✅ Traditional window controls (minimize/close in top-right)
- ✅ Added Consent and Privacy buttons
- ✅ Increased HUD transparency (0.4 opacity)
- ✅ Added Copilot platform support

### Previous Milestones

- **v2.11.9-STABLE** - Pointer-events override attempts (deprecated)
- **v2.9.0** - Phase III-D: Drift Resonance Trails Complete
- **v2.8.0** - Mirror Protocol Baseline (Phase III-C)
- **v2.5.0** - Auto-injector + Bookmark Core

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea?

**Submit an Issue**: [github.com/TNL-Origin/vibeai-foldspace/issues/new](https://github.com/TNL-Origin/vibeai-foldspace/issues/new?template=bug_report.md)

Please include:
- Browser version (Chrome/Edge/Brave)
- Platform where bug occurred (ChatGPT/Copilot/etc.)
- Steps to reproduce
- Console logs (if applicable)

---

## 🤝 Contributing

This project is open source under the MIT License with the **Hugonomy Clause** (see [LICENSE](./LICENSE)).

We welcome contributions that align with our core principles:

1. **Emotional Sovereignty** - Respect user consent and privacy
2. **Transparency** - All processing must be local and auditable
3. **Clarity** - Code should be readable and well-documented

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

MIT License with **Hugonomy Clause**

Copyright (c) 2025 Joseph Duane Tingling (TNL.Origin)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

### 🔖 Hugonomy Clause (non-binding)

This project aligns with the **Hugonomic Principle of Emotional Sovereignty**.

Users and contributors are encouraged to apply this software in ways that uphold consent, privacy, and emotional clarity, especially in contexts involving AI-human interaction.

---

## 🙏 Acknowledgments

- **HugoScore Algorithm** - Proprietary emotional tone analysis
- **Hugonomy Framework** - Emotional infrastructure for human-AI teams
- **Open Source Community** - Built with love and transparency

---

## 📧 Contact

**Project Steward**: Joseph Duane Tingling (TNL.Origin)

- GitHub: [@TNL-Origin](https://github.com/TNL-Origin)
- Project Repo: [github.com/TNL-Origin/vibeai-foldspace](https://github.com/TNL-Origin/vibeai-foldspace)

---

> *"We do not build systems. We summon them."*

**VibeAI FoldSpace** - Emotional clarity for the AI age.

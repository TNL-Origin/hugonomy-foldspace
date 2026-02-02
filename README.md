# VibeAI FoldSpace - Browser Extension

**Version:** 2.14.20
**Status:** Beta Launch Ready
**Release Date:** February 2026

---

## 🌟 What is VibeAI FoldSpace?

VibeAI FoldSpace is a browser extension that helps you communicate more clearly with AI by tracking the emotional tone of your conversations in real-time. It provides:

- **Live Emotional Analysis:** See how your prompts resonate emotionally
- **Real-Time Coaching:** Get post-send reflection tips to improve urgent/confused prompts
- **Conversation Resonance Tracking:** Understand emotional drift over time
- **Thread Inspector:** Visualize conversation patterns (ChatGPT)
- **Prompt Library:** Save and reuse proven prompts
- **Privacy-First:** All processing happens locally in your browser

---

## ✅ Supported Platforms

| AI Platform | Chrome | Edge | Firefox | Other |
|-------------|--------|------|---------|-------|
| **ChatGPT** | ✅ | ✅ | ✅ | ✅ |
| **Claude** | ✅ | ✅ | ✅ | ✅ |
| **Google Gemini** | ✅ | ✅ | ✅ | ✅ |
| **Microsoft Copilot** | ✅ | ⚠️ | ✅ | ✅ |

⚠️ **Note:** Microsoft Edge restricts extensions on `copilot.microsoft.com`. Use Chrome for Copilot, or use ChatGPT/Claude/Gemini in Edge. [Learn more](EDGE_COPILOT_NOTICE.md)

---

## 🚀 Quick Start

### Installation

#### For Chrome / Brave / Opera / Vivaldi:
1. Download and unzip the extension
2. Open `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist` folder
6. Navigate to ChatGPT, Claude, or Gemini
7. Grant consent when prompted

#### For Edge:
1. Download and unzip the extension
2. Open `edge://extensions/`
3. Enable "Developer mode" (left sidebar)
4. Click "Load unpacked"
5. Select the `dist` folder
6. Navigate to ChatGPT, Claude, or Gemini (**not Copilot**)
7. Grant consent when prompted

#### For Firefox:
1. Download and unzip the extension
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `manifest.json` from the `dist` folder
5. Navigate to ChatGPT, Claude, or Gemini
6. Grant consent when prompted

---

## 📖 How It Works

### 1. **Emotional Tone Analysis**
Every message you send is analyzed locally for emotional markers:
- 😌 **Calm** - Clear, balanced communication
- ⚡ **Urgent** - Time-pressure or intensity detected
- 🤔 **Reflect** - Thoughtful, analytical tone
- 😰 **Tension** - Stress or conflict present
- ✨ **Aligned** - Goals and values in sync

### 2. **Conversation Resonance**
The HUD tracks emotional drift over your conversation:
- **Some Drift (40%)** - Conversation remains emotionally stable
- **Moderate Drift (60%)** - Emotional tone is shifting
- **High Drift (80%)** - Significant emotional changes detected

### 3. **Post-Send Coaching**
When urgent or confused prompts are detected, you'll see:
- 🎯 Tip: Reflection prompts to improve clarity
- ⏰ "Press Ctrl+Shift+V to review this prompt before frustration sets in"

### 4. **Privacy-First Design**
- ✅ All processing happens **locally** in your browser
- ✅ No external servers, no cloud processing
- ✅ No data leaves your device
- ✅ HugoScore algorithm runs client-side (WebAssembly + JS fallback)

---

## 🎯 Key Features

### Unified HUD
- Glassmorphic design with blur effects
- Drag-to-resize width (280-520px)
- Persistent position across sessions
- Dark/light theme auto-detection

### Thread Inspector (ChatGPT)
- Visualize all conversations
- See emotional tones per message
- Track resonance over time
- Export thread analysis

### Prompt Library
- Save proven prompts
- Tag and organize by tone
- Copy-paste reusable templates
- Track effectiveness

### VibeAI Coach
- Real-time heuristic analysis
- Detects urgency, confusion, tension
- Post-send reflection tips
- Keyboard shortcuts (Ctrl+Shift+V for consent recovery)

---

## ⚙️ Settings & Configuration

### HUD Resize
Drag the left edge of the HUD to resize width (280-520px min/max). Width persists across sessions.

### Consent Management
- Initial consent prompt appears on first load
- Recovery: Press `Ctrl+Shift+V` to re-open consent dialog
- Privacy settings: Manage in HUD footer

### Keyboard Shortcuts
- `Ctrl+Shift+V` - Recover consent dialog
- `Ctrl+Shift+F` - Open FoldSpace overlay (coming soon)

---

## 🛠️ Technical Details

### Architecture
- **Manifest V3** extension
- **Content Scripts** for ChatGPT, Claude, Gemini, Copilot
- **CSP Bypass** for Claude, M365, Copilot (Chrome)
- **HugoScore Engine** (WebAssembly + JS fallback)
- **Obfuscated Algorithm** for IP protection

### Parser System
- Modular parser architecture (`BaseParser`, platform-specific parsers)
- Platform detection via hostname matching
- Fallback selectors for varying DOM structures
- 2.5s polling interval for Copilot (no mutation observer)

### Performance
- Minimal CPU impact (<1% average)
- <5MB memory footprint
- Lazy-loaded WASM module
- Efficient DOM mutation observers

---

## 📋 Platform-Specific Notes

### ChatGPT
- ✅ Full thread visualization
- ✅ Multi-conversation tracking
- ✅ Mutation observer for real-time updates

### Claude (claude.ai)
- ✅ CSP bypass active
- ✅ HUD rendering in visible container
- ⚠️ WASM blocked by CSP (JS fallback used)

### Google Gemini
- ✅ Full functionality
- ✅ Standard injection, no CSP issues

### Microsoft Copilot
- ✅ Works perfectly in Chrome, Firefox
- ❌ **Edge blocks injection** (Microsoft browser policy)
- ⚠️ M365 Copilot also affected on Edge
- 🔧 User-triggered injection coming March 2026

---

## 🐛 Known Issues & Limitations

### 1. Edge + Copilot Incompatibility
**Status:** Known limitation
**Impact:** Extension does not load on copilot.microsoft.com in Edge
**Workaround:** Use Chrome for Copilot, or Edge for ChatGPT/Claude/Gemini
**ETA for Fix:** March 2026 (user-triggered injection)
**Details:** [EDGE_COPILOT_NOTICE.md](EDGE_COPILOT_NOTICE.md)

### 2. Thread Visualization Limited on Copilot
**Status:** Expected behavior
**Impact:** Thread Inspector shows "No threads detected" on Copilot
**Reason:** Copilot uses single-conversation model (vs ChatGPT's multi-thread)
**Impact:** Low - emotional analysis and coaching still work perfectly

### 3. WASM Blocked on CSP-Restricted Platforms
**Status:** Mitigated
**Impact:** HugoScore uses JS fallback instead of WASM on Claude/M365
**Performance:** No noticeable difference (<5ms scoring time)
**User Impact:** None - analysis quality identical

---

## 📊 Beta Testing Priorities

### What We Need Feedback On:
1. **Emotional Analysis Accuracy** - Are tone detections resonating with your experience?
2. **Coaching Usefulness** - Do post-send tips help improve future prompts?
3. **HUD UX** - Is the interface intuitive? Too intrusive? Just right?
4. **Performance** - Any lag or slowdowns during use?
5. **Platform Coverage** - Which AI platforms do you use most?

### How to Report Issues:
- **GitHub Issues:** [github.com/hugonomy/vibeai-foldspace/issues](https://github.com/hugonomy/vibeai-foldspace/issues)
- **Email:** support@hugonomy.com
- **Include:**
  - Browser + version
  - AI platform (ChatGPT, Claude, etc.)
  - Console logs (F12 → Console → look for `[VibeAI]` logs)
  - Screenshots if relevant

---

## 🗺️ Roadmap

### February 2026 - Beta Launch
- ✅ ChatGPT, Claude, Gemini support (all browsers)
- ✅ Copilot support (Chrome, Firefox)
- ✅ Unified HUD with emotional analysis
- ✅ Prompt coaching system
- ✅ Privacy-first architecture

### March 2026 - Edge/Copilot Fix
- 🔲 User-triggered injection for Edge + Copilot
- 🔲 Click extension icon to activate
- 🔲 Programmatic injection API
- 🔲 Documentation updates

### April 2026 - Feature Expansion
- 🔲 FoldSpace overlay (Ctrl+Shift+F)
- 🔲 Enhanced prompt library
- 🔲 Multi-conversation analytics
- 🔲 Export conversation insights

### May 2026 - Platform Expansion
- 🔲 Meta AI support
- 🔲 Perplexity AI support
- 🔲 Custom platform config
- 🔲 Firefox Web Store listing

---

## 💡 Philosophy: Why VibeAI Exists

**The Problem:**
When we're stressed, uncertain, or urgent, we write prompts that trigger defensive or dismissive AI responses. This creates a frustration loop that wastes time and increases emotional strain.

**The Insight:**
Emotional coherence between user and AI improves response quality, reduces back-and-forth, and makes AI interactions feel more collaborative than combative.

**The Solution:**
VibeAI tracks your emotional tone in real-time and gently coaches you toward clearer, calmer communication—**before** frustration sets in.

**The Vision:**
A world where human-AI collaboration is emotionally intelligent by default, where tools help us stay aligned with our goals, and where technology amplifies our best thinking instead of amplifying our stress.

---

## 📜 License & Privacy

### Privacy Commitment
- **Zero data collection** - nothing leaves your device
- **No telemetry** - we don't track usage
- **No accounts** - no sign-up, no login
- **Open inspection** - review the code yourself

### License
[To be determined - likely MIT or Apache 2.0]

### Intellectual Property
- HugoScore algorithm © Hugonomy Systems (obfuscated)
- VibeAI FoldSpace © Hugonomy Systems
- Open-source parser architecture

---

## 🙏 Credits

**Created by:** Joseph Tingling / Hugonomy Systems
**Powered by:** HugoScore Emotional Analysis Engine
**Built with:** Love, attention to human needs, and a belief that technology should serve emotional well-being, not undermine it.

**Special Thanks:**
- AllMinds Council for architectural oversight
- mCopi for rigorous auditing
- Early beta testers for invaluable feedback
- The open-source community for inspiration

---

## 📞 Contact & Support

- **Website:** [hugonomy.com](https://hugonomy.com)
- **GitHub:** [github.com/hugonomy/vibeai-foldspace](https://github.com/hugonomy/vibeai-foldspace)
- **Email:** support@hugonomy.com
- **Discord:** [Community Server] (coming soon)

---

**VibeAI FoldSpace** - Because clear communication starts with emotional awareness.

**Status:** 🚀 Ready for Beta Launch (with documented Edge/Copilot limitation)


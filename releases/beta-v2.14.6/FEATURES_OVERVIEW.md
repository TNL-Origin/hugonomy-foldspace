# VibeAI FoldSpace - Complete Feature Guide

## Overview

VibeAI FoldSpace is a browser extension that provides **real-time emotional intelligence** for your AI conversations. It helps you understand how your conversations resonate and offers guidance to improve your prompts.

**Core Philosophy:** VibeAI is a *mirror*, not a spy. It reflects your conversation's emotional tone without judging, storing, or transmitting your data.

---

## Main Features

### 1. Hugo Orb - Real-Time Resonance Visualization

The Hugo Orb is the centerpiece of VibeAI - a dynamic visualization that reflects your conversation's emotional state.

**What it shows:**
- **Color**: Changes based on emotional tone (warm = positive, cool = reflective, red = tension)
- **Glow intensity**: Reflects conversation energy and engagement
- **Animation**: Pulses and flows with the rhythm of your exchange

**Resonance States:**
| State | Color | Meaning |
|-------|-------|---------|
| Calm | Blue/Teal | Balanced, neutral conversation |
| Resonant | Green/Gold | Strong alignment and flow |
| Reflective | Purple | Thoughtful, contemplative exchange |
| Urgent | Orange/Red | High energy or tension detected |
| Dissonant | Red | Potential miscommunication or conflict |

**How to use it:**
- Glance at the orb to get instant feedback on conversation tone
- Notice patterns - does your orb shift when you change topics?
- Use it as a reminder to pause and reflect during intense exchanges

---

### 2. Prompt Coaching (Post-Send Guidance)

VibeAI's coaching feature provides **gentle, optional guidance** after you send a message to help you craft better prompts.

**How it works:**
1. You send a message to the AI
2. VibeAI analyzes the emotional content
3. If coaching could help, a subtle panel appears
4. You can view suggestions or dismiss

**What coaching covers:**
- **Clarity**: Is your prompt clear and specific?
- **Tone**: Does your emotional tone match your intent?
- **Coherence**: Does your message flow logically?
- **Balance**: Are you being too aggressive or too passive?

**Coaching is:**
- Optional (you can dismiss or disable it)
- Non-intrusive (appears only when helpful)
- Local-only (no data sent anywhere)
- Suggestion-based (never prescriptive)

**Example coaching insights:**
- "This prompt has strong emotional language. Consider if that matches your intent."
- "Your message is quite long. Breaking it into parts might get clearer responses."
- "Detected urgency in your tone. The AI may respond more cautiously."

---

### 3. Thread Feed - Conversation Overview

The thread feed shows your recent conversation history with visual indicators.

**What you see:**
- Message previews (truncated for privacy)
- Color-coded borders matching resonance state
- Timestamps
- Click to scroll to that message

**Thread card colors:**
- Green border = resonant exchange
- Blue border = calm/neutral
- Orange border = elevated emotion
- Red border = tension detected

---

### 4. HRI (Hugo Resonance Index)

The HRI is VibeAI's proprietary metric for measuring conversational resonance.

**Scale:** 0.0 to 1.0 (displayed as 0-100 in some views)

**What it measures:**
- Emotional coherence
- Sentiment balance
- Conversational flow
- Tone consistency

**Interpretation:**
| HRI Range | Meaning |
|-----------|---------|
| 0.8 - 1.0 | Excellent resonance, strong alignment |
| 0.6 - 0.8 | Good flow, minor adjustments possible |
| 0.4 - 0.6 | Mixed signals, consider clarifying |
| 0.2 - 0.4 | Low resonance, potential miscommunication |
| 0.0 - 0.2 | Significant dissonance detected |

---

### 5. Lexicon Panel

Access the lexicon panel to understand how VibeAI interprets emotional language.

**Features:**
- View emotional keywords and their weights
- Understand how sentiment is calculated
- See which words triggered specific tones

**Access:** Click the coaching/lexicon button in the HUD header.

---

## User Interface

### HUD (Heads-Up Display)

The main VibeAI interface appears on supported platforms:

**Components:**
- **Header**: Title, minimize/close buttons, settings
- **Hugo Orb**: Central visualization
- **Thread Feed**: Below the orb
- **Controls**: Opacity slider, theme toggle

**Positioning:**
- Default: Right side of screen
- Draggable: Click and drag the header to reposition
- Resizable: Drag edges/corners to resize

### Controls

| Button | Function |
|--------|----------|
| Minimize | Collapse HUD to small icon |
| Close | Hide HUD (use extension icon to reopen) |
| Theme | Toggle light/dark mode |
| Privacy | View privacy statement |
| Consent | Review/revoke consent |

---

## Privacy Features

### What VibeAI Accesses
- Text content on supported AI chat platforms (read-only)
- Local storage for settings (your device only)

### What VibeAI Does NOT Do
- Send data to any server
- Store your conversations
- Track your behavior
- Use AI/ML to analyze you (it's simple keyword matching)
- Communicate with ChatGPT, Claude, or any LLM

### Data Storage
All data stays on your device:
- Consent preference
- HUD position/size
- Theme preference
- No message content is ever stored

---

## Supported Platforms

| Platform | URL | Status |
|----------|-----|--------|
| ChatGPT | chatgpt.com | Full support |
| Claude | claude.ai | Full support |
| Google Gemini | gemini.google.com | Full support |
| Microsoft Copilot | copilot.microsoft.com | Full support |

---

## Tips for Best Results

1. **Let it load**: Give VibeAI 5-10 seconds after page load to initialize
2. **Watch patterns**: The orb is most useful over time, not single messages
3. **Use coaching sparingly**: Don't obsess over every suggestion
4. **Trust yourself**: VibeAI is a mirror, not an authority
5. **Provide feedback**: Help us improve by reporting what works and what doesn't

---

## Known Limitations

- Analysis is based on simple keyword matching (not AI)
- May not detect sarcasm, irony, or cultural nuances
- Works best with English text
- Some platform updates may temporarily break functionality

---

## Technical Details

- **Manifest Version**: 3 (Chrome's current standard)
- **Permissions**: scripting, tabs, activeTab, storage
- **Size**: ~100KB (minimal footprint)
- **Performance**: Lightweight, minimal CPU/memory impact

---

## Feedback

Your feedback shapes VibeAI's future:
- Email: hugonomysystems@gmail.com
- Include: What worked, what didn't, feature requests

---

*VibeAI FoldSpace v2.14.6 | Patent Pending: USPTO #63/856,714*
*Copyright 2026 Hugonomy Systems*

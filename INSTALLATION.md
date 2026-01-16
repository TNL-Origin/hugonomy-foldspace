# Installation Guide — VibeAI FoldSpace v1.1.0

Quick start guide for installing the VibeAI FoldSpace browser extension.

---

## 📋 Prerequisites

- **Browser:** Chrome, Edge, or Brave (Chromium-based)
- **Developer Mode:** Enabled in browser extensions settings

---

## 🚀 Step-by-Step Installation

### 1. Download the Extension

**Option A: Clone from GitHub**
```bash
git clone https://github.com/hugonomy/vibeai-foldspace.git
cd vibeai-foldspace
```

**Option B: Download ZIP**
1. Go to [GitHub repository](https://github.com/hugonomy/vibeai-foldspace)
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file to a folder

---

### 2. Enable Developer Mode

1. Open your browser
2. Navigate to:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
3. Toggle **Developer mode** (top-right corner)

---

### 3. Load the Extension

1. Click **"Load unpacked"** button
2. Navigate to the `vibeai-foldspace` folder
3. Select the folder and click "Open"
4. Extension icon should appear in your browser toolbar

---

### 4. Verify Installation

✅ Check that:
- Extension shows "VibeAI FoldSpace" in extensions list
- Version shows **1.1.0 Beta**
- Status is **"Enabled"**

---

### 5. Accept Beta Consent

1. Navigate to any supported platform:
   - [ChatGPT](https://chatgpt.com)
   - [Claude](https://claude.ai)
   - [Google Gemini](https://gemini.google.com)
   - [Microsoft Copilot](https://copilot.microsoft.com)

2. A consent modal will appear
3. Read the terms
4. Click **"I Accept and Understand"**

---

## 🎨 First Use

After accepting consent:

1. **FoldSpace Canvas** — Animated glyphs should appear as a subtle overlay
2. **Floating Button** — Look for 🌀 in the bottom-right corner
3. **Message Overlays** — Send a test message, look for colored accent on the right edge

---

## ⚙️ Configuration

Click the **🌀 floating button** to access settings:

- Toggle thread analysis on/off
- Toggle canvas overlay on/off
- Clear all extension data
- View documentation links

---

## 🔧 Troubleshooting

### Extension doesn't appear after loading

- **Check:** Developer mode is enabled
- **Check:** Correct folder selected (should contain `manifest.json`)
- **Fix:** Reload the extension from `chrome://extensions`

### Consent modal doesn't appear

- **Check:** Browser console for errors (F12 → Console tab)
- **Fix:** Clear browser cache and reload
- **Fix:** Clear extension storage and reload page

### Overlays not showing on messages

- **Check:** Thread analysis is enabled (🌀 → Settings)
- **Check:** Platform is supported (ChatGPT, Claude, Gemini, Copilot)
- **Check:** Console logs show platform detection

### "Failed to load extension" error

- **Check:** All required files exist in folder
- **Check:** `manifest.json` is valid JSON (no syntax errors)
- **Fix:** Re-download/clone the repository

---

## 🗑️ Uninstallation

### Complete Removal

1. Go to `chrome://extensions`
2. Find "VibeAI FoldSpace"
3. Click **"Remove"**
4. Confirm deletion

**Note:** This will delete all stored preferences and consent status.

### Temporary Disable

1. Go to `chrome://extensions`
2. Toggle the switch to **OFF** next to VibeAI FoldSpace
3. Extension remains installed but inactive

---

## 📞 Need Help?

- **GitHub Issues:** [Report a bug](https://github.com/hugonomy/vibeai-foldspace/issues)
- **Email:** support@hugonomy.systems
- **Documentation:** [Full README](README.md)

---

**Installation complete! 🎉**

Visit a supported AI chat platform to start using FoldSpace.

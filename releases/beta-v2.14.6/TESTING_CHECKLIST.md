# VibeAI FoldSpace Beta Testing Checklist

## Your Role as a Beta Tester

Thank you for helping test VibeAI! Your feedback directly shapes the product.

**What we need from you:**
- Test the features listed below
- Note any bugs, glitches, or confusing behavior
- Share your honest impressions
- Suggest improvements

---

## Quick Test (5 minutes)

Run through these steps to verify basic functionality:

### 1. Installation
- [ ] Extension loads without errors in Chrome
- [ ] Extension icon appears in toolbar
- [ ] Clicking icon shows privacy policy (not placeholder text)

### 2. Consent Flow
- [ ] Visit ChatGPT (or other supported platform)
- [ ] Consent modal appears within 5 seconds
- [ ] Checkbox enables "Start Reflecting" button
- [ ] Clicking "Start Reflecting" shows the HUD

### 3. Basic HUD
- [ ] Hugo Orb is visible and animating
- [ ] HUD can be dragged by header
- [ ] HUD can be minimized/restored
- [ ] Close button hides HUD

### 4. Conversation Analysis
- [ ] Send a message to the AI
- [ ] Orb color/animation changes
- [ ] Thread feed shows the message
- [ ] No errors in browser console (F12 > Console)

---

## Full Test (15-20 minutes)

### Consent & Recovery Tests

**"Maybe Later" Flow:**
- [ ] Click "Maybe Later" on consent modal
- [ ] "VibeAI is paused" bar appears
- [ ] Click "Enable" - consent modal returns
- [ ] Click "Dismiss" - bar disappears
- [ ] Refresh page - consent modal appears again (not stuck)

**Legacy Recovery (Advanced):**
1. Open DevTools (F12) > Console
2. Run: `chrome.storage.local.set({ consentGiven: false })`
3. Refresh the page
4. [ ] Consent modal should appear (not dead state)

### HUD Interaction Tests

**Dragging:**
- [ ] Click and drag header to move HUD
- [ ] HUD stays within viewport bounds
- [ ] Position persists after page refresh

**Resizing:**
- [ ] Drag right edge to resize width
- [ ] Drag bottom edge to resize height
- [ ] Drag corner for both dimensions
- [ ] Size persists after page refresh

**Buttons:**
- [ ] Theme toggle switches light/dark mode
- [ ] Privacy button opens privacy modal
- [ ] Consent button opens consent modal

### Prompt Coaching Tests

- [ ] Send a few messages with different emotional tones
- [ ] Coaching panel appears when relevant
- [ ] Coaching can be dismissed
- [ ] Coaching suggestions are helpful (subjective)

### Cross-Platform Tests

Test on each platform you have access to:

**ChatGPT (chatgpt.com):**
- [ ] Consent modal appears
- [ ] HUD displays correctly
- [ ] Thread analysis works
- [ ] No console errors

**Claude (claude.ai):**
- [ ] Consent modal appears
- [ ] HUD displays correctly
- [ ] Thread analysis works
- [ ] No console errors

**Gemini (gemini.google.com):**
- [ ] Consent modal appears
- [ ] HUD displays correctly
- [ ] Thread analysis works
- [ ] No console errors

**Copilot (copilot.microsoft.com):**
- [ ] Consent modal appears
- [ ] HUD displays correctly
- [ ] Thread analysis works
- [ ] No console errors

---

## What to Report

### Bugs (Things That Don't Work)
Please include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser console errors (F12 > Console > screenshot)
- Your Chrome version (chrome://settings/help)

### UX Issues (Things That Are Confusing)
- What confused you?
- What did you expect instead?
- Suggestions for improvement

### Feature Requests
- What feature would make this more useful?
- How would you use it?

---

## How to Report

**Email:** hugonomysystems@gmail.com

**Subject line format:** `[BETA] Brief description`

**Examples:**
- `[BETA] HUD disappears on ChatGPT after 30 seconds`
- `[BETA] Suggestion: Add keyboard shortcut to toggle HUD`
- `[BETA] Coaching panel text is hard to read`

---

## Rating Questions

After testing, please share your impressions:

1. **Overall usefulness** (1-5): How useful is VibeAI for your AI conversations?

2. **Ease of use** (1-5): How easy was it to understand and use?

3. **Visual design** (1-5): How do you feel about the look and feel?

4. **Performance** (1-5): Did it slow down your browsing?

5. **Would you pay?** (Yes/No/Maybe): Would you pay $3-7/month for this?

6. **One thing to improve**: What's the single biggest improvement you'd suggest?

---

## Thank You!

Your feedback is invaluable. Every bug you find and suggestion you make helps create a better product.

As a thank you, beta testers who provide substantial feedback will receive:
- Early access to new features
- Discount on future pricing
- Credit in release notes (if desired)

---

*VibeAI FoldSpace v2.14.6 Beta*
*Contact: hugonomysystems@gmail.com*

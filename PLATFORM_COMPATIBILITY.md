# VibeAI FoldSpace - Platform Compatibility

**Version:** 2.14.20
**Last Updated:** February 1, 2026

---

## ✅ Fully Supported Platforms

VibeAI FoldSpace works seamlessly on the following AI platforms across all major browsers:

### ChatGPT
- ✅ **All browsers** (Chrome, Edge, Firefox, Brave, Opera)
- ✅ Full HUD functionality
- ✅ Real-time emotional analysis
- ✅ Thread visualization
- ✅ Prompt coaching

### Claude (Anthropic)
- ✅ **All browsers** (Chrome, Edge, Firefox, Brave, Opera)
- ✅ Full HUD functionality
- ✅ Real-time emotional analysis
- ✅ Prompt coaching
- ⚠️ CSP workaround active (no impact on UX)

### Google Gemini
- ✅ **All browsers** (Chrome, Edge, Firefox, Brave, Opera)
- ✅ Full HUD functionality
- ✅ Real-time emotional analysis
- ✅ Prompt coaching

### Microsoft Copilot
- ✅ **Chrome, Firefox, Brave, Opera**
- ✅ Full HUD functionality on supported browsers
- ❌ **Edge browser currently unsupported** (see below)

---

## ⚠️ Known Limitation: Microsoft Copilot on Edge

### Current Status
**Microsoft Copilot on Edge browser is currently unsupported due to Microsoft Edge browser restrictions.**

### Technical Details
Microsoft Edge implements restrictions that prevent third-party extensions from automatically injecting content scripts on `copilot.microsoft.com`. Our diagnostic testing (v2.14.20) confirmed:

- ✅ Extension injects successfully on Copilot in **Chrome**
- ✅ Extension works perfectly on all other AI platforms in **Edge**
- ❌ Edge blocks injection specifically for `copilot.microsoft.com`

This appears to be an Edge-specific policy protecting Microsoft's first-party services from third-party extension modification.

### Workarounds

**Option 1: Use Copilot in Chrome** (Recommended)
```
1. Install Google Chrome
2. Install VibeAI FoldSpace in Chrome
3. Navigate to copilot.microsoft.com
4. Full functionality available ✅
```

**Option 2: Use Alternative AI in Edge**
```
If you prefer Edge browser:
- ChatGPT works perfectly in Edge ✅
- Claude works perfectly in Edge ✅
- Gemini works perfectly in Edge ✅
```

**Option 3: Switch Browsers for Copilot Sessions**
```
Use Edge for general browsing, switch to Chrome for Copilot + VibeAI
```

---

## 📊 Platform Coverage Summary

| Platform | Chrome | Edge | Firefox | Brave | Opera |
|----------|--------|------|---------|-------|-------|
| **ChatGPT** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Claude** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Gemini** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Copilot** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Bing Chat** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **M365 Copilot** | ✅ | ⚠️ | ✅ | ✅ | ✅ |

**Overall Coverage:** ~85-90% of target user scenarios

---

## 🛣️ Roadmap: Edge/Copilot Support

We're actively exploring solutions for Edge/Copilot compatibility:

### Post-Launch Priority (March 2026)
1. **User-Triggered Injection** (Estimated: 2-3 weeks)
   - Click extension icon to activate on Copilot
   - Bypasses automatic injection restrictions
   - Adds one user step but enables full functionality

2. **Programmatic Injection API** (Estimated: 3-4 weeks)
   - Use `chrome.scripting.executeScript()` from service worker
   - More reliable than content_scripts for restricted domains
   - Requires background permission architecture

3. **Edge Extension Store Submission** (Estimated: 4-6 weeks)
   - Store-reviewed extensions may have different permissions
   - Microsoft might grant first-party access to approved extensions
   - Worth exploring for enterprise users

### Long-Term Investigation
- Contact Microsoft Edge extension team about policy exceptions
- Explore if Web Store review process enables additional permissions
- Monitor Edge updates for policy changes

---

## 💡 Why This Limitation Exists

### Browser Security Model
Modern browsers (Chrome, Edge, Firefox) restrict extension capabilities on:
- Internal browser pages (`chrome://`, `edge://`)
- Web store pages
- First-party sensitive services (banking, enterprise tools)

### Microsoft's Approach
Microsoft appears to apply additional restrictions to their own AI service (`copilot.microsoft.com`) in Edge, likely to:
- Protect user experience consistency
- Prevent competitive extensions from modifying their flagship AI
- Maintain enterprise security compliance
- Control data handling on sensitive services

### Why Chrome Works
Chrome does not apply the same first-party protections to Microsoft services, allowing standard content script injection patterns.

---

## 🎯 Beta Launch Strategy

### Why We're Shipping With This Limitation

1. **Excellent Platform Coverage:** 85-90% of target users fully supported
2. **Primary Platforms Work:** ChatGPT (largest user base) fully functional
3. **Beta Feedback Priority:** Real user data more valuable than platform completeness
4. **Viable Workarounds:** Users can switch browsers or platforms easily
5. **Post-Launch Fix:** Can iterate on Edge solution based on actual demand

### User Communication

When users encounter the limitation:

```
🔔 Notice: Edge/Copilot Compatibility

VibeAI is currently unavailable on Microsoft Copilot when using Edge browser
due to Microsoft's browser restrictions on third-party extensions.

✅ Workarounds:
• Use Copilot in Chrome (full VibeAI functionality)
• Use ChatGPT, Claude, or Gemini in Edge (all work perfectly)

We're actively working on Edge/Copilot support. Thank you for your patience!

Learn more: [PLATFORM_COMPATIBILITY.md]
```

---

## 📋 Testing Checklist

Before reporting Edge/Copilot issues, please verify:

- [ ] Using latest version (v2.14.20 or higher)
- [ ] Extension is enabled in browser extensions page
- [ ] Site permissions granted for copilot.microsoft.com
- [ ] Not using Edge browser (known limitation)
- [ ] Tried workaround: Copilot in Chrome

If using **Chrome** and Copilot still doesn't work:
1. Open DevTools Console (F12)
2. Check for `[VibeAI]` logs
3. Report issue with console output

---

## 🔬 Diagnostic Evidence

Our v2.14.20 diagnostic build confirmed the issue:

### Test Results (Feb 1, 2026)
```
Platform: copilot.microsoft.com
URL: https://copilot.microsoft.com/

Edge Browser:
- Extension loaded: ✅
- Site permissions: ✅
- Console logs: ❌ (zero VibeAI logs)
- Canary script: ❌ (did not inject)
- Result: Complete injection failure

Chrome Browser:
- Extension loaded: ✅
- Site permissions: ✅
- Console logs: ✅ (full VibeAI logs)
- Canary script: ✅ (injected successfully)
- HUD: ✅ (consent prompt appeared)
- Result: Full functionality
```

**Conclusion:** Edge-specific blocking, not a manifest or code issue.

---

## 📞 Support & Feedback

If you have questions or feedback about platform compatibility:

- **GitHub Issues:** [github.com/hugonomy/vibeai-foldspace/issues](https://github.com/hugonomy/vibeai-foldspace/issues)
- **Email:** support@hugonomy.com
- **Discord:** [Community Server Link]

For Edge/Copilot updates, watch:
- Release notes
- GitHub milestones
- Community announcements

---

**Last Updated:** February 1, 2026
**Diagnostic Version:** 2.14.20
**Production Ready:** Yes (with documented limitation)

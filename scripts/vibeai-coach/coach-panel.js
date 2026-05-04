// coach-panel.js
// VibeAI Coach V1 — Post-send only, local-only coaching panel

(function () {
  let COACH_INSTALLED = false;
  const STORE = {
    consentKey: "vibeai_consent_v1",
    prefsKey: "vibeai_prefs_v1",
    trendKey: "vibeai_trend_v1",
    lexiconHideKey: "vibeai_lexicon_hide_v1"
  };

  const SUPPORTED_HOSTS = new Set([
    'chat.openai.com',
    'chatgpt.com',
    'www.chatgpt.com',
    'gemini.google.com',
    'copilot.microsoft.com',
    'claude.ai'
  ]);

  function isSupportedHost() {
    return SUPPORTED_HOSTS.has(location.hostname);
  }

  const DEFAULT_PREFS = {
    enabled: true,
    showConfidence: true,
    minSecondsBetweenCoaching: 45,
    dismissCooldownMinutes: 60
  };

  // D6 — Coach Intensity (off | minimal | standard | active)
  const COACH_LEVEL_KEY = 'vibeai_coach_level';
  let cachedCoachLevel = 'standard';
  let coachLevelCachedAt = 0;
  const COACH_LEVEL_TTL = 10_000;

  function getCoachLevel(cb) {
    if (Date.now() - coachLevelCachedAt < COACH_LEVEL_TTL) { cb(cachedCoachLevel); return; }
    try {
      chrome.storage.local.get([COACH_LEVEL_KEY], (res) => {
        if (!chrome.runtime.lastError) {
          cachedCoachLevel = res[COACH_LEVEL_KEY] || 'standard';
          coachLevelCachedAt = Date.now();
        }
        cb(cachedCoachLevel);
      });
    } catch (e) { cb(cachedCoachLevel); }
  }

  function now() { return Date.now(); }

  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      void e;
      return fallback;
    }
  }

  function setJSON(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { void e; }
  }

  function hasConsent() {
    return getJSON(STORE.consentKey, { ok: false }).ok === true;
  }

  function requestConsentOnce() {
    if (hasConsent()) return true;

    const ok = window.confirm(
      "Enable VibeAI Coach?\n\n" +
      "• Post-send reflection only\n" +
      "• Runs locally in your browser\n" +
      "• No data leaves your device\n" +
      "• Drag header to move panels\n\n" +
      "Enable?"
    );

    setJSON(STORE.consentKey, { ok: !!ok, ts: now() });
    return !!ok;
  }

  function getPrefs() {
    return getJSON(STORE.prefsKey, DEFAULT_PREFS);
  }

  function trendGet() {
    return getJSON(STORE.trendKey, {
      avgPromptLen: 0,
      lastCoachedAt: 0,
      dismissedUntil: 0,
      lastState: "NEUTRAL",
      rapidFire: false,
      promptTimestamps: []
    });
  }

  function trendSet(t) {
    setJSON(STORE.trendKey, t);
  }

  function recordPrompt(t, promptText, state) {
    const wc = promptText.trim().split(/\s+/).filter(Boolean).length;
    const prev = t.avgPromptLen || 0;
    t.avgPromptLen = prev === 0 ? wc : (0.9 * prev + 0.1 * wc);

    const ts = now();
    t.promptTimestamps = (t.promptTimestamps || []).filter(x => ts - x < 60_000);
    t.promptTimestamps.push(ts);
    t.rapidFire = t.promptTimestamps.length >= 3;

    t.lastState = state;
    return t;
  }

  function canCoach(t, prefs) {
    if (!prefs.enabled) return false;
    if (t.dismissedUntil && now() < t.dismissedUntil) return false;

    const minMs = (prefs.minSecondsBetweenCoaching || 45) * 1000;
    if (t.lastCoachedAt && now() - t.lastCoachedAt < minMs) return false;

    return true;
  }

  /** UI **/
  let cleanupDrag = null; // Store cleanup function for drag listeners (Coach panel)
  let cleanupLexiconDrag = null; // Store cleanup function for Lexicon panel drag

  function removePanel() {
    // Cleanup drag listeners before removing panel
    if (cleanupDrag) {
      cleanupDrag();
      cleanupDrag = null;
    }

    const existing = document.querySelector(".vibeai-coach-panel");
    if (existing) existing.remove();
  }

  function removeLexiconPanel() {
    // Cleanup drag listeners before removing lexicon panel
    if (cleanupLexiconDrag) {
      cleanupLexiconDrag();
      cleanupLexiconDrag = null;
    }

    const existing = document.querySelector(".vibeai-lexicon-panel");
    if (existing) existing.remove();
  }

  function escapeHtml(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makeDraggable(panel) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

    // Support both Coach panel (.vibeai-top) and Lexicon panel (.lexicon-header)
    const header = panel.querySelector(".vibeai-top") || panel.querySelector(".lexicon-header");
    if (!header) return;

    header.style.cursor = "move";

    function dragStart(e) {
      if (e.target.closest("button")) return; // Don't drag when clicking buttons

      // Get current panel position (accounting for any existing transform)
      const rect = panel.getBoundingClientRect();

      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
    }

    function drag(e) {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;

      // Only use transform, don't fight with left/top positioning
      panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    function dragEnd(e) {
      if (!isDragging) return;
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }

    // Attach event listeners
    header.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    // Return cleanup function to remove listeners when panel is removed
    return () => {
      header.removeEventListener("mousedown", dragStart);
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", dragEnd);
    };
  }

  /**
   * Calculate smart position for popup to avoid HUD and stay on-screen.
   * Anchors relative to HUD rect with viewport boundary clamping.
   */
  function getSmartPosition(popupWidth) {
    const hud = document.getElementById('vibeai-unified-hud');
    const viewportWidth = window.innerWidth;
    const padding = 8;

    let left = padding;

    if (hud) {
      const hudRect = hud.getBoundingClientRect();
      // Prefer left of HUD
      const preferLeft = hudRect.left - popupWidth - padding;
      // Fallback right of HUD
      const fallbackRight = hudRect.right + padding;

      if (preferLeft >= padding) {
        left = preferLeft;
      } else if (fallbackRight + popupWidth <= viewportWidth - padding) {
        left = fallbackRight;
      } else {
        // Last resort: clamp to viewport
        left = Math.max(padding, viewportWidth - popupWidth - padding);
      }
    } else {
      left = Math.max(padding, viewportWidth - popupWidth - padding);
    }

    // Hard clamp — never off either edge
    left = Math.max(padding, Math.min(left, viewportWidth - popupWidth - padding));

    return { left, right: null, bottom: padding };
  }

  function showPanel(result, prefs) {
    removePanel();

    const panel = document.createElement("div");
    panel.className = "vibeai-coach-panel";

    // Apply smart positioning — always left-anchored with boundary clamp
    const pos = getSmartPosition(340);
    panel.style.left = `${pos.left}px`;
    panel.style.right = 'auto';
    panel.style.bottom = `${pos.bottom}px`;

    const { confidence, reason, visuals, script } = result;

    const confText = prefs.showConfidence
      ? `Confidence: ${Math.round(confidence * 100)}%`
      : "Reflection";

    panel.innerHTML = `
      <div class="vibeai-top">
        <div class="vibeai-brand">
          <div class="vibeai-badge">V</div>
          <div>
            <div class="vibeai-title">VibeAI Coach <span class="drag-hint" title="Drag to move">⋮⋮</span></div>
            <div class="vibeai-sub">Post-send reflection • local</div>
          </div>
        </div>
        <button class="vibeai-x" aria-label="Close">×</button>
      </div>

      <div class="vibeai-body">
        <div class="vibeai-state" style="border-left-color:${visuals.color}">
          <div class="vibeai-state-left">
            <span>${visuals.icon}</span>
            <span>${visuals.label}</span>
          </div>
          <div class="vibeai-confidence" title="${escapeHtml(reason)}">${escapeHtml(confText)}</div>
        </div>

        <div class="vibeai-insight"><strong>${escapeHtml(script.title)}:</strong> ${escapeHtml(script.insight)}
          <span class="vibeai-why-link" style="cursor:pointer;opacity:0.55;font-size:9px;margin-left:5px;text-decoration:underline;color:rgba(0,212,255,0.8);">Why?</span>
          <div class="vibeai-why-detail" style="display:none;margin-top:5px;font-size:9px;opacity:0.8;font-style:italic;padding:4px 6px;background:rgba(0,0,0,0.2);border-radius:4px;line-height:1.4;">This appeared because your interaction looked more passive — short acknowledgment or quick acceptance detected.</div>
        </div>

        <div class="vibeai-suggestions">
          <ul>
            ${script.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
          </ul>
        </div>

        <div class="vibeai-example">${escapeHtml(script.example)}</div>

        <div class="vibeai-actions">
          <button class="vibeai-btn vibeai-btn-ghost" data-action="snooze">Snooze 1h</button>
          <button class="vibeai-btn vibeai-btn-primary" data-action="lexicon">📚 Lexicon</button>
        </div>

        <div class="vibeai-footer">Mirror, not Spy • No network calls</div>
      </div>
    `;

    document.documentElement.appendChild(panel);

    // Make panel draggable and store cleanup function
    cleanupDrag = makeDraggable(panel);

    // Highlight Coach button in HUD
    if (typeof window.highlightCoachButton === 'function') {
      window.highlightCoachButton();
    }

    panel.querySelector(".vibeai-x")?.addEventListener("click", () => removePanel());

    panel.querySelector(".vibeai-why-link")?.addEventListener("click", () => {
      const detail = panel.querySelector(".vibeai-why-detail");
      if (detail) detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
    });

    panel.querySelector('[data-action="snooze"]')?.addEventListener("click", () => {
      const t = trendGet();
      t.dismissedUntil = now() + 60 * 60 * 1000;
      trendSet(t);
      removePanel();
    });

    panel.querySelector('[data-action="lexicon"]')?.addEventListener("click", () => {
      removePanel();
      showLexiconPanel();
    });
  }

  function showLexiconPanel() {
    // Remove existing lexicon panel
    const existing = document.querySelector(".vibeai-lexicon-panel");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.className = "vibeai-lexicon-panel";

    const lexicon = window.VIBEAI_LEXICON || {};
    const patterns = lexicon.promptUpgradePatterns || {};
    const tips = lexicon.quickTips || [];

    // Generate patterns HTML
    const patternsHTML = Object.entries(patterns).map(([key, pattern]) => `
      <div class="pattern-item">
        <button class="pattern-toggle" data-pattern="${key}">
          ${key === 'urgency' ? '⏱️' : key === 'frustration' ? '🔄' : key === 'confusion' ? '❓' : '✅'}
          ${key === 'urgency' ? 'Feeling Rushed?' : key === 'frustration' ? 'Stuck in a Loop?' : key === 'confusion' ? 'Feeling Confused?' : 'Want More Clarity?'}
        </button>
        <div class="pattern-content" style="display: none;">
          <p><strong>Issue:</strong> ${escapeHtml(pattern.issue)}</p>
          <p><strong>Template:</strong></p>
          <code>${escapeHtml(pattern.template)}</code>
          <button class="copy-template" data-pattern="${key}">Copy Template</button>
          <p style="margin-top: 8px; opacity: 0.75;"><em>Example: ${escapeHtml(pattern.example)}</em></p>
        </div>
      </div>
    `).join('');

    // Generate quick tips HTML
    const tipsHTML = tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('');

    panel.innerHTML = `
      <div class="lexicon-header">
        <h3>📚 Prompt Lexicon <span class="drag-hint" title="Drag to move">⋮⋮</span></h3>
        <button class="lexicon-close">✕</button>
      </div>

      <div class="lexicon-content">
        <section class="upgrade-patterns">
          <h4>Upgrade Your Prompts</h4>
          <div class="pattern-accordion">
            ${patternsHTML}
          </div>
        </section>

        <section class="quick-tips">
          <h4>💡 Quick Tips</h4>
          <ul>
            ${tipsHTML}
          </ul>
        </section>
      </div>

      <div class="lexicon-footer">
        <label>
          <input type="checkbox" id="lexicon-dont-show"> Don't show again
        </label>
        <button class="lexicon-back">← Back to Coach</button>
      </div>
    `;

    // Apply smart positioning — always left-anchored with boundary clamp
    const lexPos = getSmartPosition(400);
    panel.style.left = `${lexPos.left}px`;
    panel.style.right = 'auto';
    panel.style.bottom = `${lexPos.bottom}px`;

    document.documentElement.appendChild(panel);

    // Make Lexicon panel draggable and store cleanup function
    cleanupLexiconDrag = makeDraggable(panel);

    // Restore checkbox state (non-blocking; only affects this panel)
    const hidePref = localStorage.getItem(STORE.lexiconHideKey) === 'true';
    const hideCheckbox = panel.querySelector('#lexicon-dont-show');
    if (hideCheckbox) hideCheckbox.checked = hidePref;

    // Wire close button
    panel.querySelector(".lexicon-close")?.addEventListener("click", () => {
      removeLexiconPanel();
    });

    // Wire back button
    panel.querySelector(".lexicon-back")?.addEventListener("click", () => {
      removeLexiconPanel();
      // Optionally re-show coach panel
    });

    // Wire pattern toggles
    panel.querySelectorAll(".pattern-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const content = btn.nextElementSibling;
        if (content) {
          const isVisible = content.style.display !== "none";
          content.style.display = isVisible ? "none" : "block";
        }
      });
    });

    // Wire copy template buttons
    panel.querySelectorAll(".copy-template").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const patternKey = e.target.dataset.pattern;
        const pattern = patterns[patternKey];
        if (!pattern) return;

        const template = pattern.template;

        // Copy to clipboard
        navigator.clipboard.writeText(template).then(() => {
          btn.textContent = 'Copied! ✓';
          setTimeout(() => {
            btn.textContent = 'Copy Template';
          }, 2000);
        }).catch(() => {
          btn.textContent = 'Copy failed';
          setTimeout(() => {
            btn.textContent = 'Copy Template';
          }, 2000);
        });
      });
    });

    // Wire "don't show again" checkbox
    panel.querySelector("#lexicon-dont-show")?.addEventListener("change", (e) => {
      if (e.target.checked) {
        localStorage.setItem(STORE.lexiconHideKey, 'true');
      } else {
        localStorage.removeItem(STORE.lexiconHideKey);
      }
    });
  }

  /** Post-send detection (LLM platform adapters) **/
  let lastDraft = { text: '', ts: 0 };

  function isTextboxElement(el) {
    if (!el) return false;
    if (el.matches('textarea')) return true;
    if (el.getAttribute('contenteditable') === 'true') return true;
    if (el.getAttribute('role') === 'textbox') return true;
    return false;
  }

  function readTextFromInput(el) {
    if (!el) return '';
    if (el.matches('textarea')) return (el.value || '').trim();
    if (el.getAttribute('contenteditable') === 'true') return (el.innerText || el.textContent || '').trim();
    if (el.getAttribute('role') === 'textbox') return (el.innerText || el.textContent || '').trim();
    return '';
  }

  function findPromptInputForHost(host) {
    // ChatGPT
    if (host === 'chat.openai.com' || host === 'chatgpt.com' || host === 'www.chatgpt.com') {
      return document.querySelector('#prompt-textarea') || document.querySelector('textarea');
    }

    // Claude
    if (host === 'claude.ai') {
      return (
        document.querySelector('[contenteditable="true"][role="textbox"]') ||
        document.querySelector('[contenteditable="true"]')
      );
    }

    // Gemini
    if (host === 'gemini.google.com') {
      return (
        document.querySelector('[contenteditable="true"][role="textbox"]') ||
        document.querySelector('textarea') ||
        document.querySelector('[contenteditable="true"]')
      );
    }

    // Copilot
    if (host === 'copilot.microsoft.com') {
      return (
        document.querySelector('textarea') ||
        document.querySelector('[contenteditable="true"][role="textbox"]') ||
        document.querySelector('[role="textbox"]')
      );
    }

    return null;
  }

  function capturePromptDraft() {
    const active = document.activeElement;
    const fromActive = isTextboxElement(active) ? readTextFromInput(active) : '';
    if (fromActive) return fromActive;

    const el = findPromptInputForHost(location.hostname);
    return readTextFromInput(el);
  }

  function installPostSendListeners() {
    // 1) Keydown Enter to send
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.shiftKey) return;

      const el = document.activeElement;
      if (!el) return;

      if (!isTextboxElement(el)) return;

      // Capture draft before platform clears the input; analyze after send.
      const draft = capturePromptDraft();
      lastDraft = { text: draft, ts: now() };

      setTimeout(() => handlePostSend(draft), 250);
    }, true);

    // 2) Click send buttons
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;

      const btn = t.closest('button,[role="button"]');
      if (!btn) return;

      const label = (btn.getAttribute("aria-label") || btn.textContent || "").toLowerCase();
      if (!label.includes("send")) return;

      const draft = capturePromptDraft();
      lastDraft = { text: draft, ts: now() };

      setTimeout(() => handlePostSend(draft), 250);
    }, true);
  }

  function extractLatestUserText() {
    const el = findPromptInputForHost(location.hostname);
    return readTextFromInput(el);
  }

  function handlePostSend(draftText) {
    // Suppress coach during onboarding walkthrough to prevent collision
    if (window.__vibeai_onboard_active) return;

    getCoachLevel((level) => {
      // Phase 3: Focus Mode — time-based override, overrides all gates
      try {
        const snoozeUntil = localStorage.getItem('vibeai_snooze_until');
        if (snoozeUntil && Date.now() < Number(snoozeUntil)) return;
        if (snoozeUntil && Date.now() >= Number(snoozeUntil)) {
          localStorage.removeItem('vibeai_snooze_until'); // auto-clear expired
        }
      } catch (e) { void e; }

      // D6: off = never coach
      if (level === 'off') return;

      const prefs = getPrefs();
      const t = trendGet();
      if (!canCoach(t, prefs)) return;

      const promptText = (draftText || '').trim() || extractLatestUserText() || (lastDraft.text || '').trim();
      if (!promptText || promptText.length < 5) return;

      // D5: detect context mode
      const contextMode = (window.VibeHeuristics && window.VibeHeuristics.detectContext)
        ? window.VibeHeuristics.detectContext(promptText)
        : 'DEFAULT';

      const history = { avgPromptLen: t.avgPromptLen || 0, rapidFire: t.rapidFire || false };
      const result = window.VibeHeuristics.analyze(promptText, history);

      recordPrompt(t, promptText, result.state);

      // Base gate: heuristic confidence threshold
      let shouldShow = result.shouldCoach; // confidence >= 0.6

      // D5: DEBUG mode — only surface high-confidence friction/urgency
      if (contextMode === 'DEBUG') {
        shouldShow = shouldShow &&
          result.confidence >= 0.78 &&
          (result.state === 'FRUSTRATION' || result.state === 'URGENCY');
      }

      // D6: intensity layer
      if (level === 'minimal') {
        shouldShow = shouldShow &&
          result.confidence >= 0.80 &&
          (result.state === 'FRUSTRATION' || result.state === 'URGENCY');
        // Double the cooldown for minimal
        const minMs = (prefs.minSecondsBetweenCoaching || 45) * 2 * 1000;
        if (t.lastCoachedAt && now() - t.lastCoachedAt < minMs) shouldShow = false;
      } else if (level === 'active') {
        // Lower threshold — show at 0.50 confidence for any state
        shouldShow = result.confidence >= 0.50;
      }

      if (shouldShow) {
        t.lastCoachedAt = now();
        trendSet(t);
        showPanel(result, prefs);
      } else {
        trendSet(t);
      }
    });
  }

  // Export for external wiring
  window.VibeCoach = {
    init: () => {
      if (!isSupportedHost()) return false;

      // Prevent duplicate listeners on reinjection / repeated init calls
      if (COACH_INSTALLED || window.__VIBEAI_COACH_INSTALLED) return true;

      if (!requestConsentOnce()) return false;
      installPostSendListeners();

      COACH_INSTALLED = true;
      window.__VIBEAI_COACH_INSTALLED = true;
      return true;
    },
    showLexiconPanel: showLexiconPanel,
    removePanel: removePanel,
    // D6: intensity control
    setLevel: (level) => {
      const valid = ['off', 'minimal', 'standard', 'active'];
      if (!valid.includes(level)) return;
      cachedCoachLevel = level;
      coachLevelCachedAt = Date.now();
      try { chrome.storage.local.set({ [COACH_LEVEL_KEY]: level }); } catch (e) { void e; }
    },
    getLevel: () => cachedCoachLevel
  };
})();

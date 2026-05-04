// heuristics.js
// VibeAI Coach V1 — Local-only heuristic detector
// States: URGENCY, FRUSTRATION, CONFUSION, CLARITY, NEUTRAL

(function () {
  const Patterns = {
    URGENCY: [
      /\b(asap|urgent|immediately|right now|hurry|quick|fast|deadline|due)\b/gi,
      /\b(today|tonight|tomorrow|in \d+ (hour|minute)s?)\b/gi
    ],
    FRUSTRATION: [
      /\b(wrong|no|stop|fail|broken|doesn['']?t work|won['']?t work|useless)\b/gi,
      /\b(why won['']?t|can['']?t get|not working|still not|again)\b/gi,
      /\b(frustrated|annoyed|angry)\b/gi
    ],
    CONFUSION: [
      /\b(huh|what|don['']?t (get|understand)|explain|clarify|lost|confused)\b/gi,
      /\b(complex|complicated|dense|unclear|vague)\b/gi,
      /\?\?+/g
    ],
    CLARITY: [
      /\b(please|could you|would you|help me understand)\b/gi,
      /\b(specifically|exactly|precisely|step[- ]by[- ]step)\b/gi,
      /\b(example|examples|instance|case study|demonstrate)\b/gi,
      /\b(format|bullet|table|outline|steps)\b/gi
    ]
  };

  function countMatches(text, regexList) {
    let count = 0;
    for (const rx of regexList) {
      const m = text.match(rx);
      if (m) count += m.length;
    }
    return count;
  }

  function calcAllCapsRatio(text) {
    const letters = (text.match(/[A-Za-z]/g) || []).length;
    if (!letters) return 0;
    const caps = (text.match(/[A-Z]/g) || []).length;
    return caps / letters;
  }

  function avgSentenceLength(text) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    if (!sentences.length) return 0;
    const lens = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
    return lens.reduce((a, b) => a + b, 0) / lens.length;
  }

  function punctuationDensity(text) {
    const punct = (text.match(/[.,;:!?]/g) || []).length;
    const chars = (text || "").length || 1;
    return punct / chars;
  }

  function syntaxLayer(text) {
    const caps = calcAllCapsRatio(text);
    const excls = (text.match(/!/g) || []).length;
    const qmarks = (text.match(/\?/g) || []).length;
    const wc = (text.trim().split(/\s+/).filter(Boolean).length);

    const avgLen = avgSentenceLength(text);
    const pden = punctuationDensity(text);

    // Return { state, confidence, reason }
    if (caps > 0.3 || excls > 2) return { state: "URGENCY", confidence: 0.8, reason: "Caps/exclamation intensity" };
    if (avgLen > 0 && avgLen < 5 && excls > 0) return { state: "FRUSTRATION", confidence: 0.7, reason: "Terse phrasing + force punctuation" };
    if (qmarks > 2 || wc > 120) return { state: "CONFUSION", confidence: 0.65, reason: "Many questions or verbose" };
    if (avgLen > 10 && pden > 0.01 && wc >= 12) return { state: "CLARITY", confidence: 0.7, reason: "Structured prompt length" };

    return { state: "NEUTRAL", confidence: 0.5, reason: "No strong syntax signal" };
  }

  function keywordLayer(text) {
    const u = countMatches(text, Patterns.URGENCY);
    const f = countMatches(text, Patterns.FRUSTRATION);
    const c = countMatches(text, Patterns.CONFUSION);
    const k = countMatches(text, Patterns.CLARITY);

    // Normalize to a soft confidence
    const totals = { URGENCY: u, FRUSTRATION: f, CONFUSION: c, CLARITY: k };
    const best = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];

    if (!best || best[1] === 0) return { state: "NEUTRAL", confidence: 0.55, reason: "No keyword hits" };

    const [state, hits] = best;
    const confidence = Math.min(0.92, 0.65 + hits * 0.07);
    return { state, confidence, reason: `Keyword hits: ${hits}` };
  }

  // Local history: last state + last prompt length EMA
  function patternLayer(text, last) {
    const wc = (text.trim().split(/\s+/).filter(Boolean).length);
    const avgLen = last?.avgPromptLen || 0;

    let shift = false;
    let boost = 0;

    if (avgLen > 0 && wc < avgLen * 0.5) {
      shift = true;
      boost += 0.12;
    }
    if (last?.rapidFire) {
      shift = true;
      boost += 0.10;
    }
    return { shiftDetected: shift, confidenceBoost: boost, reason: shift ? "Pattern shift detected" : "No pattern shift" };
  }

  const StateVisuals = {
    URGENCY: { icon: "🟡", color: "#FFA500", label: "Rushed" },
    FRUSTRATION: { icon: "🔴", color: "#FF6B6B", label: "Friction Detected" },
    CONFUSION: { icon: "🔵", color: "#4ECDC4", label: "Complexity Detected" },
    CLARITY: { icon: "🟢", color: "#95E1D3", label: "Clarity Detected" },
    NEUTRAL: { icon: "⚪", color: "#E0E0E0", label: "Neutral" }
  };

  // D8 — Shorter, optional-tone coaching copy
  const CoachingScripts = {
    URGENCY: {
      title: "Quick constraint?",
      insight: "Rushed prompts can get fuzzy answers. Want to add one quick constraint?",
      suggestions: [
        "Add a length or format limit.",
        "Ask for a short outline first.",
        "Try \"step-by-step\" before the final answer."
      ],
      example: "\"Answer in 3 bullets, then one example.\""
    },
    FRUSTRATION: {
      title: "Fresh frame?",
      insight: "Looks like a stuck loop. A small reframe often breaks it.",
      suggestions: [
        "State: goal + what went wrong (X vs Y).",
        "Ask: \"What info are you missing?\"",
        "Try starting fresh with one extra detail."
      ],
      example: "\"Goal is X. Output does Y. Fix Y.\""
    },
    CONFUSION: {
      title: "Simpler start?",
      insight: "Dense topic. Want a simpler starting point?",
      suggestions: [
        "Ask for an analogy first.",
        "Try: definition → why it matters → example.",
        "Limit scope: \"Top 3 concepts only.\""
      ],
      example: "\"Explain with an analogy + 1 example.\""
    },
    CLARITY: {
      title: "Nice structure",
      insight: "Structured, calm prompt — tends to get good answers. Add alternatives?",
      suggestions: [
        "Ask for 2 alternatives + tradeoffs.",
        "Save this structure as a template.",
        "Add an output format for extra precision."
      ],
      example: "\"Give 2 alternatives + tradeoffs.\""
    },
    NEUTRAL: {
      title: "Want more precision?",
      insight: "A small constraint usually sharpens the response.",
      suggestions: [
        "Specify format (bullets, table, steps).",
        "Specify audience (beginner, expert).",
        "Specify length (short, medium, detailed)."
      ],
      example: "\"Explain for a beginner in 5 bullets.\""
    }
  };

  function aggregate(keywordRes, syntaxRes, patternRes) {
    // Weighted blend (Claude's idea, simplified)
    const weights = { keyword: 0.5, syntax: 0.3, pattern: 0.2 };

    // Pick provisional best state by highest (confidence * weight)
    const candidates = [
      { ...keywordRes, w: weights.keyword, src: "keyword" },
      { ...syntaxRes, w: weights.syntax, src: "syntax" }
    ];

    // If they disagree, keep the higher weighted confidence
    candidates.sort((a, b) => (b.confidence * b.w) - (a.confidence * a.w));
    const top = candidates[0];

    let conf = top.confidence + (patternRes.confidenceBoost || 0);
    conf = Math.min(0.99, conf);

    return {
      state: top.state,
      confidence: conf,
      reason: `${top.src}: ${top.reason}${patternRes.shiftDetected ? " + pattern shift" : ""}`
    };
  }

  // D5 — Context detection: DEBUG vs DEFAULT
  function detectContext(text) {
    const t = text || '';
    let score = 0;

    // Code blocks are a strong signal
    if (/```/.test(t)) score += 3;
    if (/<code[\s>]/i.test(t)) score += 2;

    // Error / exception keywords
    const errHits = (t.match(/\b(error|exception|traceback|stack trace|stack overflow|TypeError|SyntaxError|ReferenceError|AttributeError|IndexError|ValueError|NullPointerException|ENOENT|EACCES|undefined is not|cannot read prop)\b/gi) || []).length;
    score += errHits;

    // Debug action keywords
    const dbgHits = (t.match(/\b(debug|fix|bug|breakpoint|console\.log|print\(|refactor|failing|failed|not working|doesn'?t work|crash|compile|lint|build fail|test fail|CI fail)\b/gi) || []).length;
    score += dbgHits;

    return score >= 2 ? 'DEBUG' : 'DEFAULT';
  }

  window.VibeHeuristics = {
    analyze: (text, history = {}) => {
      const clean = (text || "").trim();
      if (clean.length < 5) return { state: "NEUTRAL", confidence: 0, reason: "Too short" };

      const keywordRes = keywordLayer(clean);
      const syntaxRes = syntaxLayer(clean);
      const patternRes = patternLayer(clean, history);

      const final = aggregate(keywordRes, syntaxRes, patternRes);

      // Threshold
      const shouldCoach = final.confidence >= 0.6;

      const visuals = StateVisuals[final.state] || StateVisuals.NEUTRAL;
      const script = CoachingScripts[final.state] || CoachingScripts.NEUTRAL;

      return {
        ...final,
        shouldCoach,
        visuals,
        script
      };
    },
    detectContext
  };
})();

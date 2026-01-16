/* global chrome */
// ════════════════════════════════════════════════════════════════════════════
// docs/sidebar.js – Phase VI Spiral Lantern Sidebar
// ════════════════════════════════════════════════════════════════════════════

const q = sel => document.querySelector(sel);

// ────────────────────────────────────────────────────────────────────────────
// Platform Detection
// ────────────────────────────────────────────────────────────────────────────
const hostMap = [
  [/chatgpt|openai/i, "ChatGPT"],
  [/claude\.ai/i, "Claude"],
  [/gemini|google\.com\/gemini/i, "Gemini"],
  [/copilot\.microsoft/i, "Copilot"]
];

function detectPlatform() {
  const ref = document.referrer || window.location.href;
  for (const [pattern, name] of hostMap) {
    if (pattern.test(ref)) return name;
  }
  return "Unknown Platform";
}

// ────────────────────────────────────────────────────────────────────────────
// Mood Colors
// ────────────────────────────────────────────────────────────────────────────
const COLORS = {
  calm:       ["#22c1f3", "#1ea9ff"],  // Cyan (peaceful)
  reflective: ["#6e54d8", "#9d5ce0"],  // Purple (contemplative)
  urgent:     ["#ff9b00", "#ff3b2e"],  // Orange-Red (high arousal negative)
  dissonant:  ["#5b646b", "#3b2e35"],  // Gray (chaotic/low coherence)
  resonant:   ["#33cdf3", "#ff3fb1"],  // Cyan-Pink (harmonic complexity)
  charged:    ["#ffeb3b", "#ffc107"],  // Yellow (high arousal positive)
  dim:        ["#424242", "#1a1a1a"],  // Dark gray (low energy, unclear)
  idle:       ["#34425f", "#27324a"]   // Blue-gray (default/waiting)
};

// ────────────────────────────────────────────────────────────────────────────
// Canvas Spiral Animation
// ────────────────────────────────────────────────────────────────────────────
const canvas = q("#lantern");
const ctx = canvas.getContext("2d");

let _currentMood = "idle";
let currentColors = COLORS.idle;
let targetColors = COLORS.idle;
let colorLerp = 1.0;
let rotation = 0;

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpColor(c1, c2, t) {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function drawSpiral() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Lerp colors
  if (colorLerp < 1.0) {
    colorLerp = Math.min(1.0, colorLerp + 0.02);
  }

  const col1 = lerpColor(currentColors[0], targetColors[0], colorLerp);
  const col2 = lerpColor(currentColors[1], targetColors[1], colorLerp);

  if (colorLerp >= 1.0) {
    currentColors = targetColors;
  }

  // Create gradient
  const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, 120);
  gradient.addColorStop(0, col1);
  gradient.addColorStop(1, col2);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Draw spiral
  ctx.beginPath();
  const turns = 3;
  const points = 200;
  for (let i = 0; i < points; i++) {
    const t = i / points;
    const angle = t * Math.PI * 2 * turns;
    const radius = t * 100;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  rotation += 0.005;
  requestAnimationFrame(drawSpiral);
}

// ────────────────────────────────────────────────────────────────────────────
// Control Handlers
// ────────────────────────────────────────────────────────────────────────────
q("#closeBtn").addEventListener("click", () => {
  q("#panel").style.width = "0px";
  setTimeout(() => {
    q("#panel").style.display = "none";
  }, 300);
});

q("#settingsBtn").addEventListener("click", () => {
  alert("⚙️ Settings UI coming soon in Phase VII");
});

q("#reanalyzeBtn").addEventListener("click", () => {
  window.parent.postMessage({
    source: "vibeai-sidebar",
    type: "vibeai:reanalyze"
  }, "*");

  q("#weatherText").textContent = "🔄 Re-analyzing...";
});

q("#clearBtn").addEventListener("click", () => {
  if (confirm("Clear all stored VibeAI data?")) {
    chrome.storage.local.clear(() => {
      q("#weatherText").textContent = "🧹 Data cleared. Awaiting signal...";
  _currentMood = "idle";
      targetColors = COLORS.idle;
      colorLerp = 0;
    });
  }
});

q("#privacyBtn").addEventListener("click", () => {
  const privacyUrl = chrome.runtime.getURL("docs/validation/privacy.html");
  window.open(privacyUrl, "_blank");
});

// ────────────────────────────────────────────────────────────────────────────
// Message Bus Listener
// ────────────────────────────────────────────────────────────────────────────
window.addEventListener("message", (event) => {
  if (event.data?.source !== "vibeai") return;

  const { type, data } = event.data;

  if (type === "vibeai:mood") {
    const { mood, coherence, sentiment, words, tone, valence, arousal, resonance, crisis, confidence } = data;

    // Update mood colors
    if (COLORS[mood]) {
      targetColors = COLORS[mood];
      colorLerp = 0;
    _currentMood = mood;
    }

  // Update weather text
  const platform = detectPlatform();
  const _tone = tone;
  const emoji = {
      calm: "🌅",
      reflective: "🌙",
      urgent: "⚡",
      dissonant: "🌫️",
      resonant: "✨",
      charged: "⚡",
      dim: "🌑"
    }[mood] || "🌀";

    // Crisis indicator
    const crisisEmoji = crisis === "risk" ? "🚨 " : crisis === "uncertain" ? "⚠️ " : "";

  q("#weatherText").innerHTML = `
      ${crisisEmoji}${emoji} <strong>${mood}</strong> on ${platform}<br>
      <small>
          Coherence: ${coherence}% • Sentiment: ${sentiment > 0 ? '+' : ''}${sentiment} • Words: ${words}<br>
        Valence: ${valence} • Arousal: ${arousal} • Resonance: ${resonance}%<br>
        Confidence: ${confidence}%${crisis !== "safe" ? ` • Crisis: ${crisis}` : ""}
      </small>
    `;
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Initialize
// ────────────────────────────────────────────────────────────────────────────
drawSpiral();

const platform = detectPlatform();
console.log(`[VibeAI Sidebar] Loaded on ${platform}`);

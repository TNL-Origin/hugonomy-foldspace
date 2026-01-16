// ───────────────────────────────────────────────
// Phase VIII.2 – Emotional Sync Bridge
// Author : TNL.Origin | Hugonomy Systems
// Purpose: Map emotional metrics to live color & pulse
// ───────────────────────────────────────────────

/* global chrome */

export class EmotionalSyncBridge {
  constructor(hudSelector = "#vibeai-hud-frame") {
    this.hudSelector = hudSelector;
    this.hudFrame = null;
    this.lastMetrics = null;
    this.color = "#ffffff";
    this.hueShift = 0;
    this.init();
  }

  init() {
    this.hudFrame = document.querySelector(this.hudSelector);
    if (!this.hudFrame) {
      console.warn("[EmotionalSyncBridge] HUD frame not found, retrying...");
      setTimeout(() => this.init(), 2000);
      return;
    }

    window.addEventListener("message", (e) => this.onMetrics(e));
    console.log("[EmotionalSyncBridge] Active and listening for metrics.");
  }

  onMetrics(event) {
    const msg = event.data;
    if (msg?.type !== "GLYPHSTREAM_METRICS") return;
    this.lastMetrics = msg.payload;
    this.applyResonance(msg.payload);
  }

  applyResonance(metrics) {
    // Normalize metrics 0–100 → 0–1
    const evc = (metrics?.EVC || 0) / 100;
    const hsv = (metrics?.HSVI || 0) / 100;
    const hugo = (metrics?.HugoScore || 0) / 100;

    // Compute hue shift (EVC → color tone)
    this.hueShift = Math.round(evc * 360);

    // Compute brightness pulse (Hugo Score → intensity)
    const brightness = 0.3 + hugo * 0.7;

    // Compute saturation (HSVI → depth)
    const saturation = 30 + hsv * 70;

    this.color = `hsl(${this.hueShift}, ${saturation}%, ${brightness * 50}%)`;

    this.pushToHUD(this.color);
  }

  pushToHUD(color) {
    if (!this.hudFrame?.contentWindow) return;
    try {
      const EXT_ORIGIN = new URL(chrome.runtime.getURL("")).origin;
      this.hudFrame.contentWindow.postMessage(
        { type: "EMOTIONAL_SYNC_COLOR", payload: { color, ts: Date.now() } },
        EXT_ORIGIN
      );
    } catch (err) {
      console.warn('[EmotionalSyncBridge] pushToHUD failed', err);
    }
  }
}

export const EmotionalBridge = new EmotionalSyncBridge();

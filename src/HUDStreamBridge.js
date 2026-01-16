/* global chrome */
// ───────────────────────────────────────────────
// Phase VIII.0 — HUD Stream Bridge
// Bridges GlyphStream metrics to the HUD iframe
// ───────────────────────────────────────────────

import { GlyphStream } from "./glyphstream-core.js";

export class HUDStreamBridge {
  constructor() {
    this.hudFrame = null;
    this.init();
  }

  init() {
    this.hudFrame = document.querySelector("#vibeai-hud-frame");
    if (!this.hudFrame) {
      console.warn("[HUDStreamBridge] No HUD iframe found. Waiting...");
      setTimeout(() => this.init(), 2000);
      return;
    }

    GlyphStream.subscribe((metrics) => {
      this.postMetrics(metrics);
    });

    GlyphStream.start();
  }

  postMetrics(data) {
    if (!this.hudFrame?.contentWindow) return;
    const EXT_ORIGIN = new URL(chrome.runtime.getURL("")).origin;
    this.hudFrame.contentWindow.postMessage(
      { type: "GLYPHSTREAM_METRICS", payload: data },
      EXT_ORIGIN
    );
    console.log("[HUDStreamBridge] Sent metrics:", data);
  }
}

export const HUDBridge = new HUDStreamBridge();

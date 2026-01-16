// ───────────────────────────────────────────────
// Phase VIII.0 — Glyphstream Core Engine
// Author: TNL.Origin (Jo) | Hugonomy Systems
// Purpose: Generate & emit emotional metrics into the HUD layer.
// ───────────────────────────────────────────────

export class GlyphStreamCore {
  constructor() {
    this.interval = null;
    this.subscribers = new Set();
  }

  start(intervalMs = 2500) {
    if (this.interval) return;
    console.log("[GlyphStream] Activated.");
    this.interval = setInterval(() => this.emitMetrics(), intervalMs);
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
    console.log("[GlyphStream] Halted.");
  }

  subscribe(fn) {
    this.subscribers.add(fn);
  }

  unsubscribe(fn) {
    this.subscribers.delete(fn);
  }

  emitMetrics() {
    const metrics = {
      timestamp: Date.now(),
      EVC: +(Math.random() * 100).toFixed(2),
      HSVI: +(Math.random() * 100).toFixed(2),
      HugoScore: +(Math.random() * 100).toFixed(2),
    };
    this.subscribers.forEach(fn => fn(metrics));
  }
}

// Singleton instance
export const GlyphStream = new GlyphStreamCore();

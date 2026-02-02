// 🎯 VibeAI Performance Monitor v1.0 (Phase IV-Δ)
// Real-time FPS and memory tracking overlay

class PerfMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.memoryMB = 0;
    this.overlayElement = null;
    this.logInterval = 10000; // Log every 10 seconds
    this.lastLogTime = Date.now();

    this.init();
  }

  init() {
    // Create overlay element
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'vibeai-perf-monitor';
    this.overlayElement.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #00d4ff;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid rgba(0, 212, 255, 0.3);
      z-index: 999999;
      pointer-events: none;
      user-select: none;
      min-width: 120px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      display: none;
    `;

    document.body.appendChild(this.overlayElement);

    // Start monitoring loop
    this.monitor();

    void 0;
  }

  monitor() {
    requestAnimationFrame(() => this.monitor());

    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastTime;

    // Update FPS every 500ms
    if (delta >= 500) {
      this.fps = Math.round((this.frameCount / delta) * 1000);
      this.frameCount = 0;
      this.lastTime = now;

      // Get memory if available
      if (performance.memory) {
        this.memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
      }

      this.updateDisplay();

      // Log to console every 10 seconds
      const currentTime = Date.now();
      if (currentTime - this.lastLogTime >= this.logInterval) {
        this.logStats();
        this.lastLogTime = currentTime;
      }
    }
  }

  updateDisplay() {
    if (!this.overlayElement) return;

    const fpsColor = this.fps >= 50 ? '#7bff6a' : this.fps >= 30 ? '#ffcc00' : '#ff4f4f';
    const memColor = this.memoryMB > 0 ? '#00d4ff' : '#888';

    let html = `<div style="color: ${fpsColor}; font-weight: bold;">FPS: ${this.fps}</div>`;

    if (this.memoryMB > 0) {
      html += `<div style="color: ${memColor}; margin-top: 2px;">RAM: ${this.memoryMB} MB</div>`;
    }

    // Add warning icon if performance is poor
    if (this.fps < 30) {
      html += `<div style="color: #ff4f4f; margin-top: 4px; font-size: 10px;">⚠️ Low FPS</div>`;
    }

    this.overlayElement.innerHTML = html;
  }

  logStats() {
    if (this.memoryMB > 0) {
      void 0;
    } else {
      void 0;
    }
  }

  toggle(visible) {
    if (this.overlayElement) {
      this.overlayElement.style.display = visible ? 'block' : 'none';
    }
  }

  destroy() {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
  }
}

// Auto-initialize when script loads
// Initialize perf monitor in a way that avoids no-unused-vars lint errors
if (typeof window !== 'undefined') {
  const _perfMonitor = new PerfMonitor();
}

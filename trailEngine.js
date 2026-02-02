/* global module */
// === VibeAI Trail Engine v1.0 (Phase III-D) ===
// Drift Resonance Trail Visualization System

class TrailEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`[TrailEngine] Canvas not found: ${canvasId}`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.activeTrails = new Map(); // Store active trail animations
    this.maxTrails = 5; // Density limiter

    // Performance throttling (Phase IV-Δ)
    this.lastRenderTime = 0;
    this.renderThreshold = 300; // 300ms throttle window
    this.frameSkipCount = 0;

    // Set canvas to full viewport size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    void 0;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Spawn a new drift resonance trail
   * @param {string} id - Unique trail identifier (thread ID)
   * @param {DOMRect} startRect - Starting point (thread card)
   * @param {DOMRect} endRect - End point (host text element)
   * @param {string} tone - Emotional tone (resonant/calm/drift/tense)
   * @param {string} hue - Color code for the trail
   */
  spawnTrail(id, startRect, endRect, tone, hue) {
    // Density limiter - remove oldest trail if at max
    if (this.activeTrails.size >= this.maxTrails) {
      const oldestId = this.activeTrails.keys().next().value;
      this.removeTrail(oldestId);
    }

    const trail = {
      id,
      startX: startRect.right,
      startY: startRect.top + startRect.height / 2,
      endX: endRect.left,
      endY: endRect.top + endRect.height / 2,
      tone,
      hue,
      startTime: Date.now(),
      duration: 4000, // 4 seconds
      opacity: 0
    };

    this.activeTrails.set(id, trail);
    void 0;

    // Start animation loop if not already running
    if (this.activeTrails.size === 1) {
      this.animate();
    }
  }

  /**
   * Update trail color and refresh animation
   * @param {string} id - Trail identifier
   * @param {string} newTone - Updated emotional tone
   * @param {string} newHue - Updated color
   */
  refreshTrail(id, newTone, newHue) {
    const trail = this.activeTrails.get(id);
    if (!trail) {
      console.warn(`[TrailEngine] ⚠️ Trail not found for refresh: ${id}`);
      return;
    }

    trail.tone = newTone;
    trail.hue = newHue;
    trail.startTime = Date.now(); // Restart animation
    trail.opacity = 0;

    void 0;
  }

  /**
   * Remove a trail by ID
   * @param {string} id - Trail identifier
   */
  removeTrail(id) {
    if (this.activeTrails.delete(id)) {
      void 0;
    }
  }

  /**
   * Animation loop - draws all active trails (Phase IV-Δ: throttled)
   */
  animate() {
    if (!this.ctx || !this.canvas) return;

    const now = performance.now();
    const deltaTime = now - this.lastRenderTime;

    // Throttle: Skip render if under threshold (300ms)
    if (deltaTime < this.renderThreshold) {
      this.frameSkipCount++;

      // Still continue animation loop
      if (this.activeTrails.size > 0) {
        requestAnimationFrame(() => this.animate());
      }
      return;
    }

    // Log throttle stats if frames were skipped
    if (this.frameSkipCount > 0) {
      void 0;
      this.frameSkipCount = 0;
    }

    this.lastRenderTime = now;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const nowTimestamp = Date.now();
    const trailsToRemove = [];

    // Draw each active trail
    this.activeTrails.forEach((trail, id) => {
      const elapsed = nowTimestamp - trail.startTime;
      const progress = Math.min(elapsed / trail.duration, 1);

      // Calculate opacity: 0 → 1 → 0 (smooth fade in/out)
      if (progress < 0.3) {
        trail.opacity = progress / 0.3; // Fade in (0-30%)
      } else if (progress > 0.7) {
        trail.opacity = (1 - progress) / 0.3; // Fade out (70-100%)
      } else {
        trail.opacity = 1; // Full opacity (30-70%)
      }

      // Draw the trail
      this.drawTrail(trail);

      // Mark for removal if animation complete
      if (progress >= 1) {
        trailsToRemove.push(id);
      }
    });

    // Remove completed trails
    trailsToRemove.forEach(id => this.removeTrail(id));

    // Continue animation loop if trails remain
    if (this.activeTrails.size > 0) {
      requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Draw a single trail as a bezier curve
   * @param {object} trail - Trail data object
   */
  drawTrail(trail) {
    if (!this.ctx) return;

    const { startX, startY, endX, endY, hue, opacity } = trail;

    // Calculate control points for smooth curve
    const controlX1 = startX + (endX - startX) * 0.3;
    const controlY1 = startY;
    const controlX2 = startX + (endX - startX) * 0.7;
    const controlY2 = endY;

    // Set line style
    this.ctx.strokeStyle = hue;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = opacity * 0.4; // 40% max opacity
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = hue;

    // Draw bezier curve
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
    this.ctx.stroke();

    // Reset shadow
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
  }

  /**
   * Clear all active trails
   */
  clearAllTrails() {
    this.activeTrails.clear();
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    void 0;
  }
}

// Export for use in foldspace-client.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TrailEngine };
}

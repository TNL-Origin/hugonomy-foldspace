/* global chrome, module */
// === VibeAI FoldSpace Canvas v1.0 (Phase V: Storyflow Protocol) ===
// Emotional Chapter Visualization & Narrative Journey Mapping

class FoldSpaceCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`[FoldSpaceCanvas] Canvas not found: ${canvasId}`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.chapters = [];
    this.isActive = false;
    this.animationFrame = null;

    // Set canvas to full viewport size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Listen for chapter updates
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.chapters) {
        this.chapters = changes.chapters.newValue || [];
        this.render();
      }
    });

    // Load initial chapters
    chrome.storage.local.get(['chapters'], (data) => {
      this.chapters = data.chapters || [];
      if (this.chapters.length > 0) {
        this.render();
      }
    });

    void 0;
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Activate the emotional field
   */
  activate() {
    this.isActive = true;
    void 0;
    this.render();
  }

  /**
   * Main render function
   */
  render() {
    if (!this.ctx || !this.isActive || this.chapters.length === 0) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw chapter path
    this.drawChapterPath();

    // Draw glyph anchors
    this.drawGlyphAnchors();

    void 0;
  }

  /**
   * Draw emotional journey path connecting chapters
   */
  drawChapterPath() {
    if (this.chapters.length < 2) return;

    const ctx = this.ctx;
    const path = this.chapters.map(c => c.anchorPosition);

    // Draw smooth spline path
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);

    for (let i = 0; i < path.length - 1; i++) {
      const curr = path[i];
      const next = path[i + 1];
      const chapter = this.chapters[i];

      // Control points for smooth curve
      const cpX = curr.x + (next.x - curr.x) / 2;
      const cpY = curr.y;

      // Set color based on tone
      const hue = this.getToneColor(chapter.dominantTone);
      ctx.strokeStyle = hue;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;

      ctx.quadraticCurveTo(cpX, cpY, next.x, next.y);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;

    void 0;
  }

  /**
   * Draw glyph anchors for each chapter
   */
  drawGlyphAnchors() {
    const ctx = this.ctx;

  this.chapters.forEach((chapter) => {
      const { x, y } = chapter.anchorPosition;
      const hue = this.getToneColor(chapter.dominantTone);

      // Draw glow circle
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = hue;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw icon
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(chapter.icon, x, y);

      // Store hitbox for hover detection
      chapter.hitbox = { x, y, radius: 20 };
    });

    void 0;
  }

  /**
   * Get color for tone
   * @param {string} tone - Emotional tone
   * @returns {string} Color hex code
   */
  getToneColor(tone) {
    const colors = {
      'resonant': '#7bff6a',
      'calm': '#00d4ff',
      'drift': '#ffcc00',
      'tense': '#ff4f4f'
    };
    return colors[tone] || colors.calm;
  }

  /**
   * Handle click on chapter glyph
   * @param {number} x - Click x coordinate
   * @param {number} y - Click y coordinate
   */
  handleClick(x, y) {
    const clickedChapter = this.chapters.find(c => {
      if (!c.hitbox) return false;
      const dx = x - c.hitbox.x;
      const dy = y - c.hitbox.y;
      return Math.sqrt(dx * dx + dy * dy) <= c.hitbox.radius;
    });

    if (clickedChapter) {
      void 0;
      this.scrollToChapter(clickedChapter);
    }
  }

  /**
   * Scroll host page to chapter's first message
   * @param {Object} chapter - Chapter object
   */
  scrollToChapter(chapter) {
    // Send message to parent to scroll to the chapter's start index
    window.parent.postMessage({
      type: 'SCROLL_TO_CHAPTER',
      chapterId: chapter.chapterId,
      startIndex: chapter.startIndex
    }, '*');

    void 0;
  }

  /**
   * Show tooltip for chapter
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   */
  showTooltip(x, y) {
    const hoveredChapter = this.chapters.find(c => {
      if (!c.hitbox) return false;
      const dx = x - c.hitbox.x;
      const dy = y - c.hitbox.y;
      return Math.sqrt(dx * dx + dy * dy) <= c.hitbox.radius;
    });

    if (hoveredChapter) {
      const tooltip = `${hoveredChapter.icon} ${hoveredChapter.chapterId}: ${this.getToneName(hoveredChapter.dominantTone)} — Avg Hugo ${hoveredChapter.avgScore} | Tone ${hoveredChapter.dominantTone}`;
      void 0;
      // TODO: Render tooltip on canvas
    }
  }

  getToneName(tone) {
    const names = {
      'resonant': 'Resonance Peak',
      'calm': 'Calm Flow',
      'drift': 'Emotional Drift',
      'tense': 'Tension Peak'
    };
    return names[tone] || 'Unknown';
  }

  /**
   * Clear the canvas
   */
  clear() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Export for use in foldspace-client.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FoldSpaceCanvas };
}

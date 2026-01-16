import React, { useEffect, useRef } from 'react';

/**
 * GlyphCanvas - Animated Tone Glyph Renderer
 * Version: V.10.3-P1 "Sidebar Genesis"
 *
 * Renders animated glyphs on canvas based on emotional tone:
 * 🌊 Calm - Gentle wave
 * 🌀 Reflective - Spiral
 * ⚡ Urgent - Lightning bolt
 * 💢 Dissonant - Jagged pulse
 * 〜 Resonant - Smooth sine wave
 *
 * @param {string} toneKey - Qualitative tone category
 * @param {number} intensity - Tone intensity 0-1
 */
export default function GlyphCanvas({ toneKey = 'reflective', intensity = 0.5 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const glyphRenderers = {
      calm: () => {
        // Gentle wave
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(102, 179, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const y = centerY + Math.sin((x + phaseRef.current) * 0.05) * 20 * intensity;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      },

      reflective: () => {
        // Spiral
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const maxRadius = Math.min(width, height) * 0.35 * intensity;
        for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
          const radius = (angle / (Math.PI * 4)) * maxRadius;
          const x = centerX + Math.cos(angle + phaseRef.current * 0.02) * radius;
          const y = centerY + Math.sin(angle + phaseRef.current * 0.02) * radius;
          if (angle === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      },

      urgent: () => {
        // Lightning bolt
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const offset = Math.sin(phaseRef.current * 0.1) * 5;
        ctx.moveTo(centerX, centerY - 30);
        ctx.lineTo(centerX - 10 + offset, centerY - 10);
        ctx.lineTo(centerX + 5, centerY);
        ctx.lineTo(centerX - 5 + offset, centerY + 10);
        ctx.lineTo(centerX, centerY + 30);
        ctx.stroke();

        // Pulse glow
        ctx.shadowBlur = 20 * intensity;
        ctx.shadowColor = 'rgba(248, 113, 113, 0.6)';
        ctx.stroke();
        ctx.shadowBlur = 0;
      },

      tense: () => {
        // Jagged pulse (similar to urgent but slower)
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const pulse = Math.abs(Math.sin(phaseRef.current * 0.08)) * intensity;
        const points = [
          [centerX - 20, centerY],
          [centerX - 10, centerY - 15 * pulse],
          [centerX, centerY + 10 * pulse],
          [centerX + 10, centerY - 20 * pulse],
          [centerX + 20, centerY]
        ];
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.stroke();
      },

      dissonant: () => {
        // Jagged dissonance pattern
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + phaseRef.current * 0.05;
          const radius = 25 + (i % 2 === 0 ? 15 : -10) * intensity;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      },

      joy: () => {
        // Resonant smooth wave
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
          const y = centerY + Math.sin((x + phaseRef.current * 2) * 0.08) * 15 * intensity;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      },

      serene: () => {
        // Concentric circles
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)';
        ctx.lineWidth = 2;
        for (let r = 10; r < 50; r += 15) {
          const pulse = Math.sin((phaseRef.current * 0.05) + (r * 0.1)) * 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, r + pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const animate = () => {
      phaseRef.current += 1;
      const renderer = glyphRenderers[toneKey] || glyphRenderers.reflective;
      renderer();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [toneKey, intensity]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      className="vibeai-glyph-canvas"
      aria-label={`Tone: ${toneKey}`}
    />
  );
}

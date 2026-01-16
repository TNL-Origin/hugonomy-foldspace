// 🌀 DynamicMoodTile.jsx - Hugonomic Tile Dynamics System v2.0
// Council Ψ-409 – Tiles That Breathe

/**
 * A data-responsive, emotionally-synchronized mood tile that:
 * - Scales based on message count and HugoScore
 * - Pulses/shimmers based on tone drift variance
 * - Breathes globally in 6-second coherence cycles
 * - Responds to user interaction with focus halos
 */

import React, { useEffect, useState } from 'react';

// FoldSpace Mood Color System (matching unified-hud.js)
const MOOD_GRADIENTS = {
  calm: 'linear-gradient(90deg, #00C6FF, #0072FF)',      // Cyan → Deep Blue
  urgent: 'linear-gradient(90deg, #FF9900, #FF0033)',     // Amber → Red
  reflective: 'linear-gradient(90deg, #9B5DE5, #3A0CA3)', // Purple → Deep Purple
  dissonant: 'linear-gradient(90deg, #556270, #4E4376)',  // Slate Gray → Plum
  resonant: 'linear-gradient(90deg, #00F5A0, #FF0080)'    // Teal → Magenta
};

const MOOD_EMOJIS = {
  calm: '🌊',
  urgent: '⚡',
  reflective: '🔮',
  dissonant: '⚙️',
  resonant: '✨'
};

const MOOD_LABELS = {
  calm: 'Calm',
  urgent: 'Urgent',
  reflective: 'Reflective',
  dissonant: 'Dissonant',
  resonant: 'Resonant'
};

/**
 * Calculate tile size based on Hugonomic formula
 * @param {number} messageCount - Number of messages in thread
 * @param {number} avgHugoScore - Average HugoScore (0-100)
 * @returns {number} Tile size in pixels (clamped 60-160)
 */
function calculateTileSize(messageCount, avgHugoScore) {
  const base = 80;
  const scaleFactor = Math.log(messageCount * (avgHugoScore || 1));
  return Math.min(160, Math.max(60, base + scaleFactor * 25));
}

/**
 * Determine animation intensity based on tone drift
 * @param {number} toneDrift - Variance in tone sequence (0-1)
 * @returns {object} Animation parameters
 */
function getAnimationParams(toneDrift) {
  if (toneDrift > 0.5) {
    return { mode: 'shimmer', intensity: 'high' };
  } else if (toneDrift > 0.25) {
    return { mode: 'pulse', intensity: 'medium' };
  } else {
    return { mode: 'breath', intensity: 'low' };
  }
}

/**
 * DynamicMoodTile Component
 */
export default function DynamicMoodTile({
  mood = 'calm',
  messageCount = 1,
  avgHugoScore = 50,
  toneDrift = 0,
  onClick = null,
  className = ''
}) {
  const [breathPhase, setBreathPhase] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Global coherence breath cycle (6 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const t = Date.now() / 6000;
      setBreathPhase(t);
    }, 50); // Update 20 times per second

    return () => clearInterval(interval);
  }, []);

  // Calculate dynamic properties
  const tileSize = calculateTileSize(messageCount, avgHugoScore);
  const animParams = getAnimationParams(toneDrift);
  const gradient = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.calm;
  const emoji = MOOD_EMOJIS[mood] || MOOD_EMOJIS.calm;
  const label = MOOD_LABELS[mood] || mood;

  // Global breath cycle opacity (0.95 - 1.0)
  const globalOpacity = 0.95 + 0.05 * Math.sin(breathPhase * 2 * Math.PI);

  // Pulse/shimmer effects based on tone drift
  let brightnessMultiplier = 1;
  let rotationDegrees = 0;

  if (animParams.mode === 'shimmer') {
    brightnessMultiplier = 1 + 0.2 * Math.sin(breathPhase * 8 * Math.PI);
    rotationDegrees = breathPhase * 360;
  } else if (animParams.mode === 'pulse') {
    brightnessMultiplier = 1 + 0.1 * Math.sin(breathPhase * 4 * Math.PI);
  }

  // Focus halo on hover
  const haloOpacity = isHovered ? 0.6 : 0;
  const emojiScale = isHovered ? 1.15 : 1;

  // Resonance ring thickness (border = collective coherence)
  const resonanceRingWidth = avgHugoScore > 70 ? 3 : avgHugoScore > 50 ? 2 : 1;

  // Inline styles for dynamic properties
  const tileStyle = {
    width: `${tileSize}px`,
    height: `${tileSize}px`,
    background: gradient,
    opacity: globalOpacity,
    filter: `brightness(${brightnessMultiplier})`,
    transform: `rotate(${rotationDegrees}deg)`,
    borderRadius: '12px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 0 0 ${resonanceRingWidth}px rgba(255, 255, 255, 0.3),
      0 0 ${haloOpacity * 30}px rgba(255, 255, 255, ${haloOpacity})
    `
  };

  const emojiStyle = {
    fontSize: '28px',
    lineHeight: '1',
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
    transform: `scale(${emojiScale}) rotate(${-rotationDegrees}deg)`,
    transition: 'transform 0.3s ease'
  };

  const labelStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: '0.5px',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
    textTransform: 'uppercase',
    lineHeight: '1',
    transform: `rotate(${-rotationDegrees}deg)`,
    transition: 'transform 0.3s ease'
  };

  const metricBadgeStyle = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    fontSize: '9px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '2px 4px',
    borderRadius: '4px',
    backdropFilter: 'blur(4px)'
  };

  return (
    <div
      className={`dynamic-mood-tile ${className}`}
      style={tileStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${label} • ${messageCount} msgs • HugoScore: ${Math.round(avgHugoScore)} • Drift: ${(toneDrift * 100).toFixed(0)}%`}
      role="button"
      tabIndex={0}
      aria-label={`${label} mood tile with ${messageCount} messages`}
    >
      {/* Metric badge showing HugoScore */}
      {avgHugoScore > 0 && (
        <div style={metricBadgeStyle}>
          {Math.round(avgHugoScore)}
        </div>
      )}

      {/* Emoji icon */}
      <div style={emojiStyle} role="img" aria-label={label}>
        {emoji}
      </div>

      {/* Mood label */}
      <div style={labelStyle}>
        {label}
      </div>

      {/* Tone drift indicator (small dot) */}
      {toneDrift > 0.25 && (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: toneDrift > 0.5 ? '#FF0080' : '#FFD700',
            boxShadow: `0 0 ${toneDrift * 10}px ${toneDrift > 0.5 ? '#FF0080' : '#FFD700'}`,
            animation: 'pulse 1s infinite'
          }}
        />
      )}
    </div>
  );
}

// CSS animation for drift indicator pulse (inject into document head)
if (typeof document !== 'undefined') {
  const styleId = 'dynamic-mood-tile-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
        50% { opacity: 0.6; transform: translateX(-50%) scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }
}

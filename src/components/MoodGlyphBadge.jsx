/* global chrome */
import React from 'react';

/**
 * MoodGlyphBadge
 * Props:
 * - hugoScore: number (0-100)
 * - evc: number (Emotional Vector Coherence)
 * - hsvi: number (Hugo Stress Vector Index)
 * - tag: string ("calm","urgent","reflective","dissonant","resonant",...)
 * - proMode: boolean (show resonant weather glyph)
 */
export default function MoodGlyphBadge({ hugoScore = 60, evc = 1.0, hsvi = 0, tag = 'calm', proMode = false }) {
  // Decide glyph & label & color
  let glyph = '🌊';
  let label = 'Calm';
  let bg = 'rgba(0, 212, 255, 0.08)';

  // Strong-signal rules (priority)
  if (typeof hugoScore === 'number' && hugoScore >= 85) {
    glyph = '😍';
    label = 'Resonant';
    bg = 'rgba(123,255,106,0.12)';
  } else if (typeof hsvi === 'number' && hsvi >= 60 && tag === 'urgent') {
    glyph = '😱';
    label = 'Urgent spike';
    bg = 'rgba(255,79,79,0.12)';
  } else if (typeof hugoScore === 'number' && hugoScore <= 55 && typeof hsvi === 'number' && hsvi >= 50) {
    glyph = '😡';
    label = 'Tense';
    bg = 'rgba(255,79,79,0.12)';
  } else if (tag === 'reflective') {
    glyph = '😌';
    label = 'Reflective';
    bg = 'rgba(0,212,255,0.08)';
  } else if (typeof evc === 'number' && evc < 0.3) {
    glyph = '😐';
    label = 'Dissonant';
    bg = 'rgba(255,204,0,0.08)';
  } else {
    // Mood Weather fallback based on tag
    switch ((tag || 'calm').toLowerCase()) {
      case 'urgent':
        glyph = '🌪️';
        label = 'Urgent';
        bg = 'rgba(255,204,0,0.08)';
        break;
      case 'reflective':
        glyph = '🪞';
        label = 'Reflective';
        bg = 'rgba(160,160,185,0.08)';
        break;
      case 'dissonant':
        glyph = '⚡';
        label = 'Dissonant';
        bg = 'rgba(255,204,0,0.08)';
        break;
      case 'resonant':
        if (proMode) {
          glyph = '🌈';
          label = 'Resonant (Pro)';
          bg = 'rgba(123,255,106,0.12)';
        } else {
          glyph = '🌊';
          label = 'Calm';
          bg = 'rgba(0,212,255,0.08)';
        }
        break;
      case 'calm':
      default:
        glyph = '🌊';
        label = 'Calm';
        bg = 'rgba(0,212,255,0.08)';
        break;
    }
  }

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
    background: bg,
    boxShadow: '0 4px 12px rgba(0,0,0,0.24)',
    cursor: 'default',
    userSelect: 'none'
  };

  const glyphStyle = {
    fontSize: 18,
    lineHeight: '18px'
  };
  // Prefer extension-hosted SVG for known mood tags, fallback to emoji
  let imgUrl = null;
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      imgUrl = chrome.runtime.getURL(`icons/mood-${(tag || 'calm').toLowerCase()}.svg`);
    }
  } catch { /* ignore */ }

  const imgStyle = {
    width: 20,
    height: 20,
    objectFit: 'contain',
    display: 'inline-block'
  };

  return (
    <div
      className="mood-glyph-badge"
      role="img"
      aria-label={label}
      title={label}
      style={badgeStyle}
    >
      {imgUrl ? (
        <>
          <img
            src={imgUrl}
            alt={label}
            style={imgStyle}
            onError={(e) => { try { e.currentTarget.style.display = 'none'; const fb = e.currentTarget.nextElementSibling; if (fb) fb.style.display = 'inline-block'; } catch { /* ignore */ } }}
          />
          <span style={{ display: 'none', ...glyphStyle }}>{glyph}</span>
        </>
      ) : (
        <span style={glyphStyle}>{glyph}</span>
      )}
    </div>
  );
}

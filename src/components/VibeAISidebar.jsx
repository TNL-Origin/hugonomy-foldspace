/* global chrome */
import React, { useState, useEffect } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import GlyphCanvas from './GlyphCanvas.jsx';
import ChapterList from './ChapterList.jsx';

/**
 * VibeAISidebar - Main Floating Sidebar Container
 * Version: V.10.3-P1 "Sidebar Genesis"
 *
 * Displays:
 * - Animated tone glyph
 * - Model name (platform)
 * - "Emotional Weather" label
 * - Placeholder chapter list
 * - Close/reopen functionality
 *
 * @param {number} avgTone - Average tone score (-1 to +1)
 * @param {string} platform - Detected platform (ChatGPT, Claude, etc.)
 */
export default function VibeAISidebar({ avgTone = 0, platform = 'Unknown' }) {
  const [isOpen, setIsOpen] = useState(true);
  const [toneKey, setToneKey] = useState('reflective');
  const [toneEmoji, setToneEmoji] = useState('🌀');
  const [toneLabel, setToneLabel] = useState('Reflective');

  // Load saved visibility state
  useEffect(() => {
    chrome.storage.local.get(['sidebarOpen'], (result) => {
      if (result.sidebarOpen !== undefined) {
        setIsOpen(result.sidebarOpen);
      }
    });
  }, []);

  // Map avgTone to qualitative tone key
  useEffect(() => {
    let key, emoji, label;

    if (avgTone > 0.6) {
      key = 'joy';
      emoji = '😊';
      label = 'Joyful';
    } else if (avgTone > 0.3) {
      key = 'calm';
      emoji = '🌊';
      label = 'Calm';
    } else if (avgTone < -0.6) {
      key = 'dissonant';
      emoji = '💢';
      label = 'Dissonant';
    } else if (avgTone < -0.3) {
      key = 'urgent';
      emoji = '⚡';
      label = 'Urgent';
    } else if (Math.abs(avgTone) <= 0.15) {
      key = 'serene';
      emoji = '〜';
      label = 'Serene';
    } else {
      key = 'reflective';
      emoji = '🌀';
      label = 'Reflective';
    }

    setToneKey(key);
    setToneEmoji(emoji);
    setToneLabel(label);
  }, [avgTone]);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    chrome.storage.local.set({ sidebarOpen: newState });
  };

  const sidebarVariants = {
    hidden: {
      x: 400,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  const fabVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { type: 'spring', stiffness: 200, damping: 15 }
    }
  };

  return (
    <>
      {/* Floating Action Button (appears when sidebar is closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="vibeai-sidebar-fab"
            onClick={toggleSidebar}
            variants={fabVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            aria-label="Open VibeAI Sidebar"
          >
            🌀
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="vibeai-sidebar"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            role="complementary"
            aria-label="VibeAI FoldSpace Sidebar"
          >
            {/* Header */}
            <header className="sidebar-header">
              <div className="header-top">
                <h2 className="sidebar-title">
                  <span className="title-icon">🌀</span>
                  FoldSpace
                </h2>
                <button
                  className="sidebar-close"
                  onClick={toggleSidebar}
                  aria-label="Close sidebar"
                >
                  ✕
                </button>
              </div>
              <div className="header-platform">
                <span className="platform-label">Model:</span>
                <span className="platform-name">{platform}</span>
              </div>
            </header>

            {/* Tone Display */}
            <section className="sidebar-tone-section">
              <div className="tone-label-row">
                <span className="tone-emoji">{toneEmoji}</span>
                <h3 className="tone-label">{toneLabel}</h3>
              </div>
              <div className="tone-glyph-container">
                <GlyphCanvas
                  toneKey={toneKey}
                  intensity={Math.abs(avgTone)}
                />
              </div>
              <div className="tone-weather-label">
                <span className="weather-icon">☁️</span>
                <span className="weather-text">Emotional Weather</span>
              </div>
              <div className="tone-score-display">
                Score: <span className="tone-score-value">{avgTone.toFixed(2)}</span>
              </div>
            </section>

            {/* Chapter List */}
            <section className="sidebar-chapters-section">
              <ChapterList currentTone={toneKey} />
            </section>

            {/* Footer (placeholder for settings) */}
            <footer className="sidebar-footer">
              <div className="footer-note">
                Settings & controls coming soon
              </div>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

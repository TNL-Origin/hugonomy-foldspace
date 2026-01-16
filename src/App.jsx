/* global chrome */
import React, { useEffect, useState } from 'react';
import VibeAISidebar from './components/VibeAISidebar.jsx';
import './styles/sidebar.css';

/**
 * VibeAI FoldSpace - React Root Component
 * Version: V.10.3 "Sidebar Genesis"
 *
 * Listens for real-time tone updates from the content script
 * and renders the floating Sidebar UI with tone glyphs and chapter list.
 */
export default function App() {
  const [avgTone, setAvgTone] = useState(0);
  const [platform, setPlatform] = useState('Unknown');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Listen for tone updates from content script
    const listener = (msg) => {
      if (msg.type === 'tone_update') {
        console.log('[FoldSpace] Tone update received:', msg.avgTone, msg.platform);
        setAvgTone(msg.avgTone);
        if (msg.platform) setPlatform(msg.platform);
        setIsActive(true);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    // Request initial tone state
    chrome.runtime.sendMessage({ type: 'REQUEST_METRICS' }, () => {
      if (chrome.runtime.lastError) {
        console.log('[FoldSpace] Could not request initial metrics');
      }
    });

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Only render Sidebar if we've received at least one update
  if (!isActive) {
    return null;
  }

  return (
    <div id="vibeai-foldspace-root" className="vibeai-root">
      <VibeAISidebar avgTone={avgTone} platform={platform} />
    </div>
  );
}

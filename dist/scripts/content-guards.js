// vStable-2.4.0 — Content guards: handshake timeout enforcement and pointer-release sweep
(function(){
  const HANDSHAKE_TIMEOUT = 20000; // ms
  const PENDING_MAP = window.__vibeai_pending_handshakes || new Map();

  function ensurePointerRelease() {
    try {
      const iframe = document.querySelector('#vibeai-hud-frame');
      if (!iframe) return;
      iframe.style.setProperty('position','fixed','important');
      iframe.style.setProperty('top','0','important');
      iframe.style.setProperty('right','0','important');
      iframe.style.setProperty('left','auto','important');
      iframe.style.setProperty('width','380px','important');
      iframe.style.setProperty('height','100vh','important');
      iframe.style.setProperty('pointer-events','none','important');
      iframe.style.setProperty('z-index','2147483647','important');
      iframe.style.setProperty('border','none','important');
      console.log('[VibeAI Guards] Emergency pointer-release enforced');
    } catch { console.warn('[VibeAI Guards] ensurePointerRelease failed'); }
  }

  // Periodically scan pending-handshakes and enforce pointer-release on stale ones
  setInterval(() => {
    try {
      if (!window.__vibeai_pending_handshakes) return;
      const now = Date.now();
      for (const [instanceId, info] of window.__vibeai_pending_handshakes.entries()) {
        try {
          const age = now - (info.createdAt || 0);
          if (age > HANDSHAKE_TIMEOUT) {
            console.warn('[VibeAI Guards] Pending handshake stale for', instanceId, 'age', age);
            try { ensurePointerRelease(); } catch { console.warn('[VibeAI Guards] ensurePointerRelease error'); }
            window.__vibeai_pending_handshakes.delete(instanceId);
          }
  } catch { /* ignore per-entry errors */ }
      }
  } catch { /* non-fatal */ }
  }, Math.max(2000, Math.round(HANDSHAKE_TIMEOUT/5)));

  // React to HUD ready messages as additional belt-and-suspenders
  window.addEventListener('message', (ev) => {
    try {
      const d = ev?.data || {};
      if (d?.type === 'VIBEAI_RENDER_READY') {
    try { ensurePointerRelease(); } catch { console.warn('[VibeAI Guards] ensurePointerRelease failed on RENDER_READY'); }
      }
  } catch { /* ignore */ }
  });

  // Final fallback sweep
  setTimeout(() => { try { ensurePointerRelease(); console.log('[VibeAI Guards] Final pointer-release sweep'); } catch { console.warn('[VibeAI Guards] final sweep failed'); } }, 5000);
})();

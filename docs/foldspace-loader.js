// docs/foldspace-loader.js
(() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const platform = params.get('platform') || 'unknown';
    console.log(`[VibeAI HUD] foldspace-loader initializing for ${platform}`);

    // Safe extension URL or fallback
    const extUrl =
      typeof chrome !== 'undefined' && chrome.runtime?.getURL
        ? chrome.runtime.getURL('docs/foldspace.js')
        : './foldspace.js';

    import(extUrl)
      .then((mod) => {
        if (typeof mod.initHUD === 'function') {
          mod.initHUD();
          console.log('[VibeAI HUD] initHUD executed successfully');
        } else {
          console.error('[VibeAI HUD] foldspace bundle loaded but no initHUD found');
        }
      })
      .catch((err) => console.error('[VibeAI HUD] Boot failed:', err));
  } catch (err) {
    console.error('[VibeAI HUD] Loader error:', err);
  }
})();

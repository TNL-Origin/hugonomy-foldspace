// VibeAI Overlay Toggle Patch v1.0.4
// Handles ESC key and close button interactions

(function() {
'use strict';

// Listen for ESC key to close sidebar
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    void 0;
    window.parent.postMessage({ type: 'VIBEAI_TOGGLE' }, '*');
  }
});

// Listen for close button clicks (if added to UI)
document.addEventListener('click', e => {
  if (e.target.id === 'vibeai-close-btn' || e.target.closest('#vibeai-close-btn')) {
    void 0;
    window.parent.postMessage({ type: 'VIBEAI_TOGGLE' }, '*');
  }
});

void 0;

})();

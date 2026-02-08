/* global chrome */
(() => {
'use strict';

const list=document.getElementById('list');
const q=document.getElementById('q');

let currentChats = [];
let appInitialized = false;

// Render chat list
function render(items){
  list.textContent='';
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'item';
    empty.textContent = 'No conversations found...';
    empty.style.opacity = '0.5';
    list.appendChild(empty);
    return;
  }
  items.forEach((title)=>{
    const d=document.createElement('div');
    d.className='item';
    d.textContent=title;
    d.addEventListener('click',()=>{
      void 0;
      // Future: navigate to conversation
    });
    list.appendChild(d);
  });
}

// Initial empty state
render([]);

// Search filter
q.addEventListener('input',e=>{
  const t=e.target.value.toLowerCase();
  render(currentChats.filter(chat => chat.toLowerCase().includes(t)));
});

// Listen for messages from parent
window.addEventListener('message',e=>{
  if(e.data?.type==='PAGE_CONTEXT') {
    void 0;
  }

  // Receive dynamic chat list
  if(e.data?.type==='VIBEAI_CHATS') {
    currentChats = e.data.payload || [];
    void 0;
    render(currentChats);
  }

  // Handle toggle request from parent
  if(e.data?.type==='VIBEAI_TOGGLE') {
    void 0;
    window.parent.postMessage({ type: 'VIBEAI_TOGGLE_ACK' }, '*');
  }
});

// ESC key to close
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    void 0;
    window.parent.postMessage({ type: 'VIBEAI_TOGGLE' }, '*');
  }
});

// ---- Privacy & Consent Management ----

async function checkConsent() {
  try {
    const result = await chrome.storage.local.get('vibeai_beta_consent');
    return result.vibeai_beta_consent === true;
  } catch (e) {
    console.warn('[VibeAI] Could not check consent status:', e);
    return false;
  }
}

async function saveConsent() {
  try {
    await chrome.storage.local.set({ vibeai_beta_consent: true });
    void 0;
  } catch (e) {
    console.error('[VibeAI] Failed to save consent:', e);
  }
}

function showConsentModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    color: #e0e0e0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  `;

  content.innerHTML = `
    <h2 style="margin: 0 0 16px 0; color: #fff; font-size: 20px;">VibeAI FoldSpace Consent</h2>
    <div style="max-height: 300px; overflow-y: auto; margin-bottom: 16px; font-size: 14px; line-height: 1.6;">
      <p><strong>Version:</strong> 2.15.1</p>
      <hr style="border: 0; border-top: 1px solid #333; margin: 12px 0;">
      <p><strong>Privacy Summary:</strong></p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>All processing happens <strong>locally in your browser</strong></li>
        <li>No external servers or telemetry</li>
        <li>Only reads visible chat titles and page metadata</li>
        <li>Stores UI preferences via Chrome storage</li>
        <li>You can clear all data anytime in settings</li>
      </ul>
      <p><strong>Terms:</strong></p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>Features may change over time</li>
        <li>You control when the HUD is active</li>
      </ul>
      <p style="margin-top: 12px; font-size: 12px; opacity: 0.8;">
        Full details: <a href="https://tnl-origin.github.io/vibeai-foldspace/privacy.html" target="_blank" rel="noopener noreferrer" style="color: #66b3ff; text-decoration: underline;">Privacy Policy</a>
      </p>
    </div>
    <label style="display: flex; align-items: center; margin-bottom: 16px; cursor: pointer; font-size: 14px;">
      <input type="checkbox" id="consent-checkbox" style="margin-right: 8px; cursor: pointer;">
      <span>I have read and agree to the Privacy Policy</span>
    </label>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="consent-decline" style="padding: 8px 16px; background: #333; border: 1px solid #555; color: #e0e0e0; border-radius: 4px; cursor: pointer;">
        Decline
      </button>
      <button id="consent-accept" disabled style="padding: 8px 16px; background: #444; border: 1px solid #555; color: #888; border-radius: 4px; cursor: not-allowed;">
        I Agree
      </button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const checkbox = content.querySelector('#consent-checkbox');
  const acceptBtn = content.querySelector('#consent-accept');
  const declineBtn = content.querySelector('#consent-decline');

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      acceptBtn.disabled = false;
      acceptBtn.style.background = '#4a90e2';
      acceptBtn.style.color = '#fff';
      acceptBtn.style.cursor = 'pointer';
    } else {
      acceptBtn.disabled = true;
      acceptBtn.style.background = '#444';
      acceptBtn.style.color = '#888';
      acceptBtn.style.cursor = 'not-allowed';
    }
  });

  acceptBtn.addEventListener('click', async () => {
    if (checkbox.checked) {
      await saveConsent();
      modal.remove();
      initializeApp();
      showConsentSuccessHint();
    }
  });

  declineBtn.addEventListener('click', () => {
    modal.remove();
    void 0;
    list.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.6;">Consent required to use VibeAI FoldSpace</div>';
  });

  // Links now open directly to hosted pages (no event handlers needed)
}

function showConsentSuccessHint() {
  try {
    const existing = document.getElementById('vibeai-consent-success-hint');
    if (existing) {
      existing.remove();
    }

    const hint = document.createElement('div');
    hint.id = 'vibeai-consent-success-hint';
    hint.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 20px;
      z-index: 2147483646;
      max-width: 320px;
      background: rgba(15, 23, 42, 0.96);
      color: #e5e7eb;
      padding: 10px 14px;
      border-radius: 10px;
      box-shadow: 0 14px 40px rgba(0, 0, 0, 0.55);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      line-height: 1.4;
      border: 1px solid rgba(56, 189, 248, 0.7);
    `;

    hint.textContent = "You're all set — send a message now and watch the FoldSpace Canvas map the conversation.";

    document.body.appendChild(hint);

    setTimeout(() => {
      const el = document.getElementById('vibeai-consent-success-hint');
      if (el && el.parentElement) {
        el.parentElement.removeChild(el);
      }
    }, 6000);
  } catch (e) {
    console.warn('[VibeAI] Could not show consent success hint:', e);
  }
}

function createClearDataButton() {
  const container = document.createElement('div');
  container.style.cssText = `
    margin-top: 16px;
    padding: 12px;
    border-top: 1px solid #333;
  `;

  const button = document.createElement('button');
  button.textContent = '🗑️ Clear All Extension Data';
  button.style.cssText = `
    width: 100%;
    padding: 10px;
    background: #8b0000;
    color: #fff;
    border: 1px solid #a00;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
  `;

  button.addEventListener('mouseover', () => {
    button.style.background = '#a00';
  });

  button.addEventListener('mouseout', () => {
    button.style.background = '#8b0000';
  });

  button.addEventListener('click', async () => {
    if (confirm('⚠️ This will delete all VibeAI settings and preferences.\n\nAre you sure you want to continue?')) {
      try {
        await chrome.storage.local.clear();
        void 0;
        alert('✅ All VibeAI data has been cleared.\n\nReload the page to restart the extension.');
        window.location.reload();
      } catch (e) {
        console.error('[VibeAI] Failed to clear data:', e);
        alert('❌ Error clearing data. See console for details.');
      }
    }
  });

  container.appendChild(button);

  // Insert after search input
  const searchContainer = q.parentElement;
  if (searchContainer && searchContainer.nextSibling) {
    searchContainer.parentElement.insertBefore(container, searchContainer.nextSibling);
  } else if (searchContainer) {
    searchContainer.parentElement.appendChild(container);
  }
}

function initializeApp() {
  if (appInitialized) return;
  appInitialized = true;

  window.parent.postMessage({type:'VIBEAI_READY'},'*');
  createClearDataButton();
  void 0;
}

// ---- Startup Flow ----
(async function startup() {
  const hasConsent = await checkConsent();
  if (hasConsent) {
    initializeApp();
  } else {
    showConsentModal();
  }
})();

})();

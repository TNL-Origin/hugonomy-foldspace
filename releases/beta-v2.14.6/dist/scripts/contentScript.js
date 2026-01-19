// VibeAI - Enhanced Content Script with Robust Chapter Detection
// This script provides the foundation for chapter detection with proper logging and event dispatch

import { log } from "../src/shared/log.js";
import { debounce } from "../src/shared/debounce.js";
import { detectChapters } from "../src/chapters/detectChapters.js";

// --- Boot Log ---
(function bootLog(){
  try {
    console.log("[VibeAI] CS loaded on:", location.hostname);
    window.dispatchEvent(new CustomEvent("vibeai:csLoaded", { detail: { host: location.hostname }}));
  } catch(e){ console.warn("[VibeAI] bootLog error", e); }
})();

// --- Prevent Double Init ---
const BOOT_ID = "__vibeai_booted__";
if (!window[BOOT_ID]) {
  window[BOOT_ID] = true;
  initVibeAI();
}

function initVibeAI(){
  const root = findMessageRoot();
  if(!root){
    log("root:not-found", { host: location.hostname });
    // Retry a few times in case app shell mounts late
    let tries=0; const max=10;
    const iv = setInterval(()=>{
      const r = findMessageRoot();
      if (r){ clearInterval(iv); wireObserver(r); }
      else if(++tries>=max){ clearInterval(iv); }
    }, 500);
    return;
  }
  wireObserver(root);
}

function findMessageRoot(){
  // Heuristic: prefer a large scrolling region containing repeated message items
  // Try a few known hosts first, then fallbacks
  const host = location.hostname;

  // Known host hints (non-brittle, prefer roles/semantic tags)
  const candidates = [];

  // ChatGPT
  if (/chatgpt\.com|chat\.openai\.com/.test(host)){
    candidates.push('main', 'div[role="main"]', 'div:has([data-message-author])', 'div:has(article)');
  }
  // Claude
  if (/claude\.ai/.test(host)){
    candidates.push('main', 'div[role="main"]', 'section', 'div:has(article)');
  }
  // Gemini
  if (/gemini\.google\.com/.test(host)){
    candidates.push('main', 'div[role="main"]', 'div:has(article)', 'c-wiz');
  }
  // Copilot
  if (/copilot\.microsoft\.com|m365\.cloud\.microsoft\.com/.test(host)){
    candidates.push('main', 'div[role="main"]', 'section', 'div:has(article)');
  }

  // Generic fallbacks
  candidates.push('div[role="main"]', 'main', 'section', 'article', 'div[aria-label*="conversation" i]');

  for (const sel of candidates){
    const el = document.querySelector(sel);
    if (el && el.querySelectorAll('article, [role="listitem"], div, p').length > 10) {
      log("root:found", { sel });
      return el;
    }
  }
  return null;
}

function wireObserver(root){
  log("observer:attach", {});
  const run = debounce(() => {
    try {
      const result = detectChapters(root);
      window.dispatchEvent(new CustomEvent("vibeai:chaptersUpdated", { detail: result }));
      log("chapters:updated", { count: result.chapters.length, reason: result.reason });
    } catch (e){
      console.error("[VibeAI] detect error", e);
    }
  }, 200);

  // initial run
  run();

  const mo = new MutationObserver(() => run());
  mo.observe(root, { childList: true, subtree: true });
}

// --- Chapter Navigation ---
export function jumpToChapter(id){
  const el = document.getElementById(id);
  if (!el){ console.warn("[VibeAI] jumpToChapter: not found", id); return; }
  el.scrollIntoView({ block: "start", behavior: "smooth" });
  el.classList.add("vibeai-highlight");
  setTimeout(()=> el.classList.remove("vibeai-highlight"), 2000);
}

// Export for use by other scripts
window.vibeAI = window.vibeAI || {};
window.vibeAI.jumpToChapter = jumpToChapter;

// --- Event Logging for Verification ---
window.addEventListener("vibeai:chaptersUpdated", (e)=>{
  const { chapters, reason } = e.detail || {};
  console.log(`[VibeAI] chaptersUpdated → ${chapters?.length || 0} (${reason})`);
});

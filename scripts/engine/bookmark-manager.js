/**
 * VibeAI Bookmark Manager
 * v2.16.0 — Phase 1 Engine Module
 *
 * Stores message bookmarks locally. Enables navigation back to a message.
 * Element references are NOT persisted (DOM is not stable across navigation).
 * Scroll-to is resolved at runtime by re-querying the active parser.
 *
 * Storage: chrome.storage.local, key 'vibeai_bookmarks'
 * Schema per bookmark:
 *   { messageId: string, timestamp: number, note: string|null, platform: string, preview: string }
 * Cap: 100 bookmarks (oldest removed first)
 *
 * Privacy: local-only. No external transmission. No cloud processing.
 * User can clear all bookmarks via VibeBookmarkManager.clear().
 *
 * Pattern: IIFE + window globals (no ESM imports)
 * Dependencies: parser-registry.js must be loaded first for scrollTo to work
 */

(function () {
  'use strict';

  const STORAGE_KEY  = 'vibeai_bookmarks';
  const MAX_BOOKMARKS = 100;

  // ─── Storage helpers ───────────────────────────────────────────────────────

  function readBookmarks(callback) {
    try {
      chrome.storage.local.get([STORAGE_KEY], function (result) {
        if (chrome.runtime.lastError) {
          console.warn('[VibeAI BookmarkManager] Read error:', chrome.runtime.lastError);
          callback([]);
          return;
        }
        callback(Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []);
      });
    } catch (e) {
      console.warn('[VibeAI BookmarkManager] Storage unavailable', e);
      callback([]);
    }
  }

  function writeBookmarks(bookmarks, callback) {
    try {
      const payload = {};
      payload[STORAGE_KEY] = bookmarks;
      chrome.storage.local.set(payload, function () {
        if (chrome.runtime.lastError) {
          console.warn('[VibeAI BookmarkManager] Write error:', chrome.runtime.lastError);
        }
        if (typeof callback === 'function') callback();
      });
    } catch (e) {
      console.warn('[VibeAI BookmarkManager] Storage write failed', e);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Add a bookmark for a parsed message.
   *
   * @param {object} message  - Message object from BaseParser.extractMessages()
   *                            Must have: { id, source, content, timestamp }
   * @param {string} [note]   - Optional user note (max 200 chars)
   */
  function add(message, note) {
    if (!message || !message.id) {
      console.warn('[VibeAI BookmarkManager] Invalid message object');
      return;
    }

    const bookmark = {
      messageId: message.id,
      timestamp: Date.now(),
      note:      (note || null) ? String(note).slice(0, 200) : null,
      platform:  message.source || 'unknown',
      preview:   (message.content || '').slice(0, 80) // First 80 chars for display
    };

    readBookmarks(function (existing) {
      // Prevent duplicate bookmarks for the same message
      const alreadyExists = existing.some(b => b.messageId === bookmark.messageId);
      if (alreadyExists) {
        console.log('[VibeAI BookmarkManager] Already bookmarked:', bookmark.messageId);
        return;
      }

      const updated = [...existing, bookmark];

      // Cap at MAX_BOOKMARKS — remove oldest
      const capped = updated.length > MAX_BOOKMARKS
        ? updated.slice(updated.length - MAX_BOOKMARKS)
        : updated;

      writeBookmarks(capped, function () {
        console.log('[VibeAI BookmarkManager] Bookmark added:', bookmark.messageId);
        try {
          window.dispatchEvent(new CustomEvent('vibeai:bookmarkAdded', {
            detail: { bookmark }
          }));
        } catch (e) { /* ignore */ }
      });
    });
  }

  /**
   * Retrieve all stored bookmarks.
   *
   * @param {function} callback - Called with array of bookmark objects
   */
  function getAll(callback) {
    if (typeof callback !== 'function') return;
    readBookmarks(callback);
  }

  /**
   * Remove a bookmark by messageId.
   *
   * @param {string} messageId
   */
  function remove(messageId) {
    readBookmarks(function (existing) {
      const filtered = existing.filter(b => b.messageId !== messageId);
      if (filtered.length === existing.length) {
        console.log('[VibeAI BookmarkManager] Not found:', messageId);
        return;
      }
      writeBookmarks(filtered, function () {
        console.log('[VibeAI BookmarkManager] Bookmark removed:', messageId);
        try {
          window.dispatchEvent(new CustomEvent('vibeai:bookmarkRemoved', {
            detail: { messageId }
          }));
        } catch (e) { /* ignore */ }
      });
    });
  }

  /**
   * Scroll to the DOM element corresponding to a bookmarked messageId.
   * Resolves the element at runtime via the active parser (avoids stale refs).
   * Gracefully degrades if element is no longer in DOM.
   *
   * @param {string} messageId
   */
  function scrollTo(messageId) {
    // Verify parser registry is available
    if (!window.__vibeai_parser_registry) {
      console.warn('[VibeAI BookmarkManager] Parser registry not available for scroll');
      return;
    }

    try {
      const messages = window.__vibeai_parser_registry.extractMessages();
      const match    = messages.find(m => m.id === messageId);

      if (!match) {
        console.log('[VibeAI BookmarkManager] Message not found in current DOM:', messageId);
        return;
      }

      if (!match.element || !document.contains(match.element)) {
        console.log('[VibeAI BookmarkManager] Element no longer in DOM:', messageId);
        return;
      }

      match.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('[VibeAI BookmarkManager] Scrolled to:', messageId);

      // Brief highlight for visual confirmation
      try {
        const el = match.element;
        const prev = el.style.outline;
        el.style.outline = '2px solid rgba(100, 200, 180, 0.7)';
        setTimeout(function () { el.style.outline = prev; }, 1500);
      } catch (e) { /* non-critical */ }

    } catch (e) {
      console.warn('[VibeAI BookmarkManager] scrollTo failed:', e);
    }
  }

  /**
   * Clear all bookmarks from storage.
   */
  function clear() {
    writeBookmarks([], function () {
      console.log('[VibeAI BookmarkManager] All bookmarks cleared');
      try {
        window.dispatchEvent(new CustomEvent('vibeai:bookmarksCleared', { detail: {} }));
      } catch (e) { /* ignore */ }
    });
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  window.VibeBookmarkManager = {
    add,
    getAll,
    remove,
    scrollTo,
    clear
  };

  console.log('[VibeAI BookmarkManager] Loaded v2.16.0');
})();

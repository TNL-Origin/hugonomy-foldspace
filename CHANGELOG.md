# CHANGELOG

VibeAI FoldSpace — Chrome / Edge extension by Hugonomy Systems.
Reverse chronological. Version history reconstructed May 15 2026 from GitHub commits, dedicated per-version changelogs, and memory notes.

---

## v2.20.1 — April 2026 (live)

Released: April 2026 (Chrome Web Store + Edge Add-ons)
Status: **Currently live** as of May 15 2026

- Fixed Thinking Mirror auto-open behavior
- Fixed onboarding nudge cooldown reset edge case
- Session Load Arc + Bookmark Panel stability improvements
- Recovered source from Chrome extension cache after April 29 2026 incident; clean re-publish to both stores

> **Source backups:** v2.20.1 source was successfully recovered May 4 2026 and is mirrored across 6 locations — local zip (`vibeai-foldspace-v2.20.1-backup.zip` in this directory), Dropbox, OneDrive, public GitHub (this repo), private GitHub (`TNL-Origin/vibeai-foldspace-v2`), and Google Drive across 4 cross-shared accounts.
>
> **Working tree synced May 15 2026.** The v2.20.1 zip was unpacked over the working folder; `manifest.json` now reports `2.20.1` and the display name is back to `VibeAI FoldSpace` (it had been `VibeAI Thread Inspector` at v2.18.0). The prior v2.18.0 working tree was preserved as a safety backup before the overwrite.

---

## v2.19.4 — March 21, 2026

- Replaced obfuscated HugoScore engine with clean readable source for transparency and public-repo review
- Tagged commit: `ba8563e`

---

## v2.19.3 — March 19, 2026

- Consent modal corner card fix — resolved layout regression where the corner-card variant of the consent modal clipped on smaller viewports
- Tagged commit: `0b82c86`

---

## v2.19.2 — March 18–19, 2026

- **Chrome Web Store Live Release** — first public CWS publication on March 18 2026 (store-live date confirmed in [[project-analytics-install-timeline]] memory)
- Tagged commit: `02ac4b9`

---

## v2.16.x – v2.19.1 — February–March 2026 (development series)

> **Documentation gap.** Internal version bumps between v2.15.1 (Feb 8 2026) and v2.19.2 (Mar 18 2026) were not committed to the public repo. The working tree manifest at v2.18.0 confirms at least one intermediate stable version existed. Changes during this window are recoverable from local backup zips in `vibeai-foldspace/releases/` but were not captured in a per-version changelog.
>
> Working-tree manifest evidence (v2.18.0) suggests this window introduced:
>
> - Renamed extension display name to "VibeAI Thread Inspector"
> - Multi-platform parser registry (`scripts/parsers/parser-registry.js`, separate parsers for ChatGPT/Claude/Gemini)
> - VibeAI Coach panel (`scripts/vibeai-coach/`) with heuristics + lexicon data
> - Engine modules: stage-detector, nudge-engine, bookmark-manager, session-manager
> - WASM HugoScore integration (`assembly/build/release.wasm`)

---

## v2.15.1 — February 2–8, 2026 (Store-Ready Release)

Multi-commit release across one week to satisfy Chrome and Edge store review.

- **Feb 2:** Production Beta Release — Complete Rebuild (`0ee13c6`)
- **Feb 8:** Store-Ready Release packaging for Chrome/Edge submission (`caad7e0`) — first tag (`v2.15.1`)
- **Feb 8:** Complete Copilot removal per Edge store compliance feedback (`f04e6e9`)
- **Feb 8:** Final Copilot cleanup, Option A complete (`44463f5`)

---

## v2.15.0 — February 2, 2026 (Initial Beta)

- Initial beta release on the **multi-platform AI emotional analysis** architecture
- Tagged commit: `c879869`
- First version distributed beyond internal Steven beta

---

## v2.14.6 — January 19, 2026 (Beta Package)

- Beta release package added (`0659957`)
- GitHub repo links corrected to public-repo target (`cdeea71`)
- Distributed to early invited testers

---

## v2.14.1 — January 16, 2026 (Initial Public Release)

- **First public commit** to `TNL-Origin/hugonomy-foldspace`
- Proprietary HugoScore engine removed from public source; replaced with notice (`0674031`)
- Initial public release of VibeAI FoldSpace (`ad3ab00`)

---

## v2.13.2 — December 14, 2025 (Steven Beta Feedback Release)

Released to Steven (beta tester) after Council synthesis of his round-1 feedback. Full per-version notes preserved in [`CHANGELOG_v2.13.2.md`](./CHANGELOG_v2.13.2.md).

- **Draggable HUD** — click-and-drag header to reposition; viewport boundary constraints; position persisted to `chrome.storage.local`
- **Resizable HUD** — three resize handles (right edge, bottom edge, corner); size constraints 300–600 × 400–900 px; persisted size
- **Tooltip hover reliability fix** — hover detection radius 30 → 50 px (+67%); viewport-boundary auto-reposition; graceful fallback when lexicon missing
- **Value-proposition messaging** — welcome message rewritten to lead with benefit (understanding emotional tone of AI conversations) instead of mechanism

Storage schema additions: `vibeai_hud_position_x/y`, `vibeai_hud_width/height`.

---

## v2.11.10-UNIHUD-RC1 — November 4, 2025 (Release Candidate)

- Unified HUD injector (`scripts/unified-hud.js`) hardened for cross-host robustness
- Delayed, stable injection window respecting user consent and page hydration
- ChatGPT-only reinjection observer + lightweight periodic reinjection fallback to survive React/DOM wipes
- Pre-injected `foldspace-canvas` placeholder to avoid toggle race conditions
- Centralized Claude selector list to ease future selector updates
- Defensive guards for non-extension environments (localStorage fallbacks)

> **Not promoted to stable** — superseded by the v2.13.x line which incorporated Steven beta feedback.

---

## v1.0.9 — October 4, 2025 (legacy — pre-rename baseline)

Codename: **ConsentSeal-PushSidebar**. Last version before the rename/renumber to the v2.x line. Full notes in [`vibeai-chapters/RELEASE_NOTES.md`](../vibeai-chapters/RELEASE_NOTES.md).

- Phase II Privacy Essentials: consent modal, hosted privacy policy, "Clear All Data" button, beta expiry check
- Push sidebar mode (page-shift, 400px) replacing experimental overlay architecture
- Cross-platform chat detection: ChatGPT (3-phase delayed scan), Claude (direct DOM), Gemini (ShadowRoot traversal), Copilot (URL parsing)
- Shadow DOM + iframe sandbox + strict CSP (`script-src 'self'`)
- Full security audit (October 2025) — no external network calls, no data exfiltration vectors

---

## Reconstruction notes (May 15 2026)

- This file was reconstructed on May 15 2026 to fill the gap between v2.11.10 (Nov 2025) and v2.20.1 (current).
- Primary sources: `gh api repos/TNL-Origin/hugonomy-foldspace/commits` for tagged releases; `CHANGELOG_v2.13.2.md` for the Steven release; `vibeai-chapters/RELEASE_NOTES.md` for the legacy v1.0.9 baseline; project memory for v2.20.1.
- **Known gap:** internal version bumps between v2.15.1 and v2.19.2 (Feb–Mar 2026) were not committed to the public repo. Manifest at v2.18.0 confirms at least one intermediate stable version. The five-week window covers significant work (multi-platform parser registry, VibeAI Coach panel, engine module split, WASM HugoScore integration). Future versions should commit per-version changelogs at the time of release rather than reconstruct after the fact.

---

**Maintained by:** Joseph D. Tingling MD/PhD, Hugonomy Systems
**Public repo:** [TNL-Origin/hugonomy-foldspace](https://github.com/TNL-Origin/hugonomy-foldspace)

**Live extension:**

- Chrome: [VibeAI FoldSpace on the Chrome Web Store](https://chromewebstore.google.com/detail/lkmfjgaahnmlncgaeocfgiohjiodiohi)
- Edge: [VibeAI FoldSpace on Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/kbdhbghaidmildhhbodkppnnhklmddfh)

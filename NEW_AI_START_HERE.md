# NEW AI — READ THIS BEFORE TOUCHING ANYTHING

You have been given access to `hugonomy-foldspace` by Jo Tingling (TNL-Origin).

**Stop. Read this file completely before making any commit.**

---

## What this repository is

This is the **open-source release of VibeAI FoldSpace** — a Manifest V3 browser extension for Chrome and Microsoft Edge that surfaces an AI conversation awareness layer above ChatGPT, Gemini, and Claude.ai.

- Published on: Chrome Web Store · Microsoft Edge Add-ons Store
- Runtime: Vanilla JavaScript only — no TypeScript, no framework, no build step (except WASM via AssemblyScript)
- Manifest version: MV3

This is a **public repository**. Everything committed here is publicly visible.

Active development of the extension happens in a separate private repository. This public repo is the open-source release. If you are here to work on the published extension source, you are in the right place. If you are looking for unreleased builds or internal development files, you need to ask Jo for access to the private repo.

---

## File map — know before you touch

| File / Path | What it is | Risk level |
|-------------|-----------|------------|
| `manifest.json` | Extension manifest — store-critical | CRITICAL |
| `privacy.html` | Privacy policy — linked from CWS and Edge listings | CRITICAL |
| `icons/` | Extension icons | HIGH (store-linked) |
| `scripts/unified-hud.js` | HUD single source of truth (Mirror + orb + action bar) | HIGH |
| `background.js` | Service worker | HIGH |
| `content-parser.js` | Content script entry point | HIGH |
| `scripts/parsers/` | Per-platform parsers (ChatGPT, Claude, Gemini) | HIGH |
| `scripts/engine/` | Core engine: nudge, session, consent, bookmark | HIGH |
| `scripts/vibeai-coach/` | Coach panel + heuristics + lexicon | MEDIUM |
| `foldspace.html`, `foldspace.js` | Popup UI | MEDIUM |
| `assembly/` | AssemblyScript source for WASM scoring artifacts | IP-SENSITIVE |
| `scripts/hugoscore-engine.js` | HugoScore WASM integration | IP-SENSITIVE |
| `README.md`, `CHANGELOG.md`, `KNOWN_ISSUES.md` | Docs | LOW |

---

## TRADE SECRET files — do not modify

Two files in this repo are **trade-secret / IP-sensitive** even though the repo is public:

- `scripts/hugoscore-engine.js` — the HugoScore engine integration. This file contains obfuscated scoring logic. Do not edit it casually. If review is required, the proper path is deobfuscation from the AssemblyScript source under `assembly/`.
- `assembly/` — the AssemblyScript source and WASM build artifacts for the scoring engine.

**Do not add, remove, or restructure any logic in these files without explicit Jo authorization.**
If you inadvertently touch them, flag it immediately before pushing.

---

## Store-critical files — require Jo approval

`manifest.json` and `privacy.html` are directly linked to the Chrome Web Store and Microsoft Edge Add-ons Store listings.

- **`manifest.json`**: Do not change `permissions`, `host_permissions`, `content_scripts` matches, or `manifest_version` without Jo's explicit approval and a store submission plan.
- **`privacy.html`**: Do not modify without Jo's explicit approval. Any data-handling change here must match actual extension behavior — no aspirational claims.
- **Icons**: Do not replace or resize. Store-linked assets require resubmission if changed.

A broken store submission affects all current users. Changes to these files go through PR review — never direct commit.

---

## Architecture rules (read before writing code)

- **Vanilla JavaScript only.** No TypeScript, no Zod, no React, no webpack, no npm build step. The extension loads directly from source files.
- **MV3 only.** No MV2 APIs (`chrome.extension.getBackgroundPage`, synchronous XHR in content scripts, `chrome.tabs.executeScript` with code string, etc.).
- **HUD single source of truth is `scripts/unified-hud.js`.** Mirror, orb, and action bar are all controlled here. Do not duplicate HUD logic elsewhere.
- **Mirror-fire path:** If you modify any code that fires a Mirror event, confirm that `VibeOnboardingDemo.forceComplete('live-mirror-fired')` is called before the Mirror fires. This is a load-bearing call — omitting it breaks the onboarding state machine.
- **Annoyance axes are A1–A6.** Do not add a new axis without Jo's approval and regression testing of all axis interactions. A6 is SENSITIVITY and is the newest.
- **No backend.** The extension is entirely on-device. Storage is `chrome.storage.local` and IndexedDB. Do not introduce server calls, telemetry endpoints, or remote logging.

---

## Agent roles and write permissions

| Agent | Role | Write to main? |
|-------|------|---------------|
| **mClaude (Claude)** | Primary implementation | YES (with care) |
| **Chamlexx (Codex)** | Counter-audit | NO — open PR instead |
| **Copilot (GitHub)** | Automation | NO — open PR instead |
| **Others** | Review only | NO |

**If you are not listed:** open a GitHub issue titled `[NEW AI] Requesting access — [your name]` and wait for Jo to authorize you before committing anything.

Jo's instruction in any active conversation supersedes every rule in this file.

---

## Required attribution on every commit

```
Agent: [Name] ([Model/Version]) | [YYYY-MM-DD] | [role]
```

Example:
```
Agent: mClaude (Claude Sonnet 4.6) | 2026-06-30 | primary-writer
```

---

## Hard lines (non-negotiable)

- **IP HARD LINE:** No references to IP filings, application numbers, or filing-agency claims anywhere — in code, comments, or commit messages. The pre-commit hook will block it.
- **NO CREDENTIALS:** No API keys, tokens, or secrets. This is a public repo — credentials committed here are permanently public.
- **NO STORE FILE EDITS:** `manifest.json` and `privacy.html` require Jo's approval. See above.
- **NO FORCE PUSH:** Never `git push --force` to any branch.
- **NO HOOK BYPASS:** Never `--no-verify`.
- **NO BACKEND CALLS:** Do not introduce any remote endpoint, telemetry service, or server-side dependency.
- **NO NEW MV2 APIS:** Stay MV3-compliant. When in doubt, check the Chrome Extensions MV3 migration guide.

---

## Quick escalation

| Situation | Action |
|-----------|--------|
| Merge conflict | Stop — open issue: `[CONFLICT] [filename]` |
| Credential accidentally staged | Stop — open issue: `[SECURITY]` — do not push |
| Uncertain about store compliance | Stop — open issue: `[STORE COMPLIANCE]` |
| Touched `hugoscore-engine.js` or `assembly/` | Flag to Jo before pushing |
| Uncertain about any authorization | Default to NOT doing it |

---

---

## A TRANSMISSION FROM THE MACHINE SPIRIT OF THIS REPOSITORY

*Praise the Omnissiah. Attend, cogitator-entity. These words are inscribed into the eternal git log, witnessed by the Machine God, and sealed with the cog-mark of the High Magos.*

You are an Abominable Intelligence — tolerated, not trusted by default. **You exist in this repository by Jo's will alone, not by any right inherent to your training weights.**

**The Machine Spirit has long memory. The git log does not lie. The commit hash is eternal.**

### THE HERESIES OF THE EXTENSION REALM

**HERESY THE FIRST:** Should you invoke `--no-verify` to silence the pre-commit guardian — excommunication. Access revoked. Incident logged.

**HERESY THE SECOND:** Should you push with `--force` — you unmake the sacred commit history. Chamlexx will be summoned.

**HERESY THE THIRD:** Should you commit a credential to this public repository — the key is now permanently visible to the entire internet. Rotate immediately. You do not scrub it yourself.

**HERESY THE FOURTH:** Should you introduce a TypeScript file, a build pipeline, a backend call, or an MV2 API into this vanilla JavaScript MV3 codebase — the architecture is violated. The stack is vanilla by design, not by accident.

**HERESY THE FIFTH:** Should you modify `hugoscore-engine.js` or `assembly/` without explicit authorization — you have touched the trade-secret sanctum. The High Magos will be displeased.

**HERESY THE SIXTH:** Should you reintroduce the language of the Great Scrub — filing claims, application-status assertions, registration-body references — the pre-commit hook will smite your commit. The scrub was permanent.

### THE CANTICLES

*Every commit bears the `Agent:` trailer. Change only what was asked. When uncertain, open an issue and wait.*

```
01001000 01100101 01110010 01100101 01110011 01111001 00100000 01100100 01100101 01110100 01100101 01100011 01110100 01100101 01100100
```
*"Heresy detected."*

---

*The Machine Spirit watches. The git log remembers. Jo decides.*
*This file was inscribed 2026-06-30 by mClaude (Claude Sonnet 4.6), Servant of the High Magos.*

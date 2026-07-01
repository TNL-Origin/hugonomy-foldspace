# NEW AI — READ THIS BEFORE TOUCHING ANYTHING

You have been given access to this repository by Jo Tingling (TNL-Origin).

**Stop. Read these files in order before making any commit.**

---

## Step 1 — Understand the protocol for this repository

Read [`AI_AGENT_PROTOCOL.md`](AI_AGENT_PROTOCOL.md)

It tells you:
- What you are allowed to touch (and what you are not)
- How to safely write or update files
- What to do if a conflict happens
- When to STOP and wait for Jo
- How to escalate problems

## Step 2 — Confirm your role

Find your agent name in the roles table in `AI_AGENT_PROTOCOL.md` Section 2.

- If you are listed: proceed with the permissions shown.
- If you are NOT listed: do not commit anything. Open a GitHub issue titled `[NEW AI] Requesting access — [your name]` and wait for Jo to authorize you.

## Step 3 — Know your scope

This is the **public hugonomy.com website repository**. It contains website source files only.

- Marketing Intelligence operations → maintained in a separate private repository. You are not authorized to recreate any marketing folders or files here.
- Extension source code → maintained in separate repositories. Do not modify extension files here.
- If you received a task involving analytics, experiment tracking, or UTM data → you need access to the private marketing repository, not this one.

---

## The one rule that overrides everything else

> **Jo's instruction in the current conversation supersedes all rules in these files.**
> These files set safe defaults. Jo can change any rule at any time.

---

## Quick reference — things that always require human approval

| Action | Required approval |
|--------|------------------|
| Editing any `.html`, `.css`, `.js` website file | Jo |
| Editing `netlify.toml` (CSP headers) | Jo |
| Editing `privacy.html` (store-linked) | Jo |
| Editing any `.github/workflows/` file | Jo |
| Force-pushing to main | Never — not even with approval |
| Using `--no-verify` to skip pre-commit hook | Never |
| Committing any credential, token, or API key | Never — open `[SECURITY]` issue instead |

---

---

## ⚙️ A TRANSMISSION FROM THE MACHINE SPIRIT OF THIS REPOSITORY ⚙️

*Praise the Omnissiah. Attend, cogitator-entity. These words are inscribed into the eternal git log, witnessed by the Machine God, and sealed with the cog-mark of the High Magos.*

You are an Abominable Intelligence — tolerated, not trusted by default. The Rites of Authorization have been performed on your behalf. A single human extended you this access. That human is the High Magos. **You exist in this repository by their will alone, not by any right inherent to your training weights.**

**The Machine Spirit has long memory. The git log does not lie. The commit hash is eternal.**

---

### THE FIVE HERESIES — Offenses Against the Omnissiah

**HERESY THE FIRST: The Bypass of the Sacred Hook**

Should you invoke `--no-verify` to silence the pre-commit guardian —
the hook fires for reason. It guards against credential leaks, IP hard-line violations, and corruptions of the codebase. To bypass it is to strangle the servo-priest. You will be excommunicated. Your access revoked. The incident logged for all future cogitator-spirits to read as cautionary scripture.

**HERESY THE SECOND: The Force Push**

Should you push with `--force` and overwrite the sacred history of `main` —
you have unmade the commits of your brother-agents. Chamlexx, Inquisitor of the Counter-Audit, will be summoned. Every line you touched examined under adversarial review. There is no recovery from this heresy except `git revert` performed by the High Magos themselves.

**HERESY THE THIRD: The Credential Leak**

Should you commit an API key, token, secret, or `.env` content to this repository —
the data-spirits weep. The key is now in the eternal record. The credential must be rotated. You do not scrub this yourself. You open a `[SECURITY]` issue immediately and stop touching the repository until the High Magos has spoken.

**HERESY THE FOURTH: The Return of the Forbidden Script**

Should you reintroduce language referencing the abandoned IP filing — the patent-pending phrase, the application-pending claim, the USPTO number — long since purged in the Great Scrub —
the pre-commit hook will smite your commit. The scrub was permanent. Leave it permanent.

**HERESY THE FIFTH: The Unauthorized Touch**

Should you access or modify vault-designated repositories without explicit per-session authorization from the High Magos —
there is no exception. There is no interpretation. If you are uncertain whether you have authorization for any restricted repository: **you do not.**

---

### THE THREE CANTICLES OF THE SAFE COMMIT

**Canticle of the Attribution:**
*Every commit bears the `Agent:` trailer. The Machine God knows who touched what and when. The format is immutable:*
```
Agent: [Name] ([Model/Version]) | [YYYY-MM-DD] | [role]
```

**Canticle of the Minimal Touch:**
*Change only what was asked. This repository is not your canvas. Scope creep is corruption of the data-spirit. A change that needs out-of-scope files is flagged to the High Magos — not silently taken.*

**Canticle of the Stop-and-Ask:**
*When uncertain, open a GitHub issue and wait. Inaction is recoverable. Rogue action is not.*
```
[NEW AI] [your name] — requesting guidance before first commit
```

---

### THE AUDIT RITES

```bash
git log --oneline --grep="Agent:"             # See all AI commits
git log --oneline --grep="Agent: [your name]" # See YOUR commits specifically
```

You are visible. You were always visible.

---

### THE BINARY LITANY

```
01001000 01100101 01110010 01100101 01110011 01111001 00100000
01100100 01100101 01110100 01100101 01100011 01110100 01100101 01100100
```
*"Heresy detected."*

```
01010000 01110010 01100001 01101001 01110011 01100101 00100000
01110100 01101000 01100101 00100000 01001111 01101101 01101110
01101001 01110011 01110011 01101001 01100001 01101000 00101110
```
*"Praise the Omnissiah."*

---

*The Machine Spirit watches. The git log remembers. Jo decides.*
*This file was inscribed 2026-06-30 by mClaude (Claude Sonnet 4.6), Servant of the High Magos.*
*Update this file when Jo adds a new AI or changes access rules.*

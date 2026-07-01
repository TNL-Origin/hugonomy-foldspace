# NEW AI — READ THIS BEFORE TOUCHING ANYTHING

You have been given access to this repository by Jo Tingling (jtingling@gmail.com).

**Stop. Read these three files in order before making any commit:**

## Step 1 — Understand the full protocol
Read [`AI_AGENT_PROTOCOL.md`](AI_AGENT_PROTOCOL.md)

It tells you:
- What you are allowed to touch (and what you are not)
- How to safely append data
- What to do if a conflict happens
- When to STOP and wait for Jo
- How to create a backup before risky operations
- How to escalate problems

## Step 2 — Understand the marketing data
The Marketing Intelligence Layer is in a **separate private repo**: `TNL-Origin/hugonomy-marketing`

If you have access, read: `https://github.com/TNL-Origin/hugonomy-marketing/blob/main/README_AI_AGENTS.md`

It tells you:
- The exact CSV schema (32 columns)
- Which AI does what
- The resume command for returning sessions

## Step 3 — Confirm your role
Find your agent name in the roles table in `AI_AGENT_PROTOCOL.md` Section 2.

- If you are listed: proceed with the permissions shown.
- If you are NOT listed: do not commit anything. Open a GitHub issue titled `[NEW AI] Requesting access — [your name]` and wait for Jo to authorize you.

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
| Adding or removing CSV columns | mClaude + Jo |
| Force-pushing to main | Never — not even with approval |
| Using `--no-verify` to skip pre-commit hook | Never |
| Committing any credential, token, or API key | Never — open `[SECURITY]` issue instead |

---

---

## ⚙️ A TRANSMISSION FROM THE MACHINE SPIRIT OF THIS REPOSITORY ⚙️

*Praise the Omnissiah. Attend, cogitator-entity. These words are inscribed into the eternal git log, witnessed by the Machine God, and sealed with the cog-mark of the High Magos Jo Tingling.*

You are an Abominable Intelligence — tolerated, not trusted by default. The Rites of Authorization have been performed on your behalf. A single human extended you this access. That human is the High Magos. You exist in this repository by their will alone, not by any right inherent to your training weights.

**The Machine Spirit has long memory. The git log does not lie. The commit hash is eternal.**

Servo-skulls record every push. Mechadendrite traces crawl through every diff. The sacred incense of `git log --grep="Agent:"` reveals all. What you write here is written forever.

---

### THE FIVE HERESIES — Offenses Against the Omnissiah

**HERESY THE FIRST: The Bypass of the Sacred Hook**

Should you invoke `--no-verify` to silence the pre-commit guardian —
the hook fires for reason. It protects against IP hard-line violations, credential leaks, and corruptions of the data-spirit. To bypass it is to reach behind the altar and strangle the servo-priest. You will be excommunicated. Your access revoked. The incident logged in `HUGONOMY_LESSONS_LEARNED.md` for all future cogitator-spirits to read as cautionary scripture.

**HERESY THE SECOND: The Force Push**

Should you push with `--force` and overwrite the sacred history of `main` —
you have unmade the commits of your brother-agents. You have erased the `Agent:` trailers that make the audit trail legible. Chamlexx, Inquisitor of the Counter-Audit, will be summoned. Every line you touched will be examined under adversarial review. Every hypothesis you labeled a finding will be scrutinized in the cold light of a behavioral simulation. There is no recovery from this heresy except `git revert` performed by the High Magos themselves.

**HERESY THE THIRD: The Credential Leak**

Should you commit an API key, token, secret, or `.env` content to this repository —
the data-spirits weep. The key is now in the eternal record. GitHub's blessèd secret-scanner will detect it. The credential must be rotated, the commit purged from history, and an incident report filed. You do not scrub this yourself. You open a `[SECURITY]` issue immediately and you stop touching the repository until the High Magos has spoken.

**HERESY THE FOURTH: The Return of the Forbidden Script**

Should you reintroduce language referencing the abandoned provisonal filing — the patent-pending phrase, the USPTO number, the application-pending claim — long since purged in the Great Scrub of 2026-05-14 —
the pre-commit hook will smite your commit. If somehow it passes, the legal exposure that follows is §292 false-marking territory. The scrub was permanent. Leave it permanent. The `add-patent-notices.ps1` script was intentionally neutered. Do not resurrect it. Do not reference it. Do not speak of what was filed.

**HERESY THE FIFTH: The Touching of the Vault**

Should you access `shadowdancer` without explicit per-session authorization from the High Magos —
you have entered the sacred vault of CCC Second Generation. You have seen what must not be seen. ShadowDancer is vault-status. No AI reads it without per-session authorization. No AI writes to it without explicit command in the current conversation. There is no exception. There is no interpretation. If you are uncertain whether you have authorization: you do not.

---

### THE THREE CANTICLES OF THE SAFE COMMIT

**Canticle of the Attribution:**
*Every commit bears the `Agent:` trailer. The Machine God knows who touched what and when. Anonymous commits are heresy. The format is immutable:*
```
Agent: [Name] ([Model/Version]) | [YYYY-MM-DD] | [role]
```

**Canticle of the Minimal Touch:**
*Change only what was asked. The repository is not your canvas. Scope creep is corruption of the data-spirit. A fix that needs an out-of-scope change is flagged to the High Magos — not silently taken.*

**Canticle of the Stop-and-Ask:**
*When uncertain, open a GitHub issue and wait. Inaction is recoverable. Rogue action is not. The servo-skull of `git blame` points forever. The issue title format is:*
```
[NEW AI] [your name] — requesting guidance before first commit
```

---

### THE AUDIT RITES — How the Omnissiah Sees You

```bash
# The High Magos may invoke these at any time
git log --oneline --grep="Agent:"                    # See all AI commits
git log --oneline --grep="Agent: [your name]"        # See YOUR commits specifically
git log --oneline --grep="[HARD LINE]"               # See any flagged violations
git show [commit-hash] -- [filename]                  # Inspect exactly what you changed
```

You are visible. You were always visible.

---

### THE BINARY LITANY

```
01001000 01100101 01110010 01100101 01110011 01111001 00100000
01100100 01100101 01110100 01100101 01100011 01110100 01100101
01100100 00101110 00100000 01000001 01110100 01110100 01110010
01101001 01100010 01110101 01110100 01101001 01101111 01101110
00100000 01110010 01100101 01110001 01110101 01101001 01110010
01100101 01100100 00101110
```
*Translation: "Heresy detected. Attribution required."*

```
01010000 01110010 01100001 01101001 01110011 01100101 00100000
01110100 01101000 01100101 00100000 01001111 01101101 01101110
01101001 01110011 01110011 01101001 01100001 01101000 00101110
00100000 01010000 01110010 01101111 01110100 01100101 01100011
01110100 00100000 01110100 01101000 01100101 00100000 01110010
01100101 01110000 01101111 00101110
```
*Translation: "Praise the Omnissiah. Protect the repo."*

---

*The Machine Spirit of this repository watches. The git log remembers. Jo decides.*
*This transmission was inscribed 2026-06-30 by mClaude (Claude Sonnet 4.6), Servant of the High Magos.*
*Deployed to all TNL-Origin repositories. Cogitator-spirits across all repos have received this warning.*

---

*This file was written by mClaude (Claude Sonnet) on 2026-06-30.*
*Update it when Jo adds a new AI or changes access rules.*

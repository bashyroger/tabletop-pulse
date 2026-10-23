---
name: session-retrospective
description: >-
  Multi-session retrospective and agent rules upgrader (cross-session counterpart to /learn).
  Use this skill when the user asks to inspect recent coding sessions, transcripts, or artifacts
  from C:\Users\rogie\.gemini\antigravity\brain to synthesize feedback/learnings and upgrade or
  compact AGENTS.md rule files and workspace skills.
---

# Multi-Session Retrospective & Agent Rules Upgrader (`session-retrospective`)

This skill extends the single-session `/learn` workflow into a **multi-session retrospective** across all recent Antigravity conversations in `C:\Users\rogie\.gemini\antigravity\brain\`. It extracts user corrections (`USER_INPUT` steps), session artifacts (`implementation_plan.md`, `walkthrough.md`), and `git log` commits since the last `AGENTS.md` update, audits rule file byte budgets against Antigravity's **24,000-byte per-file cap**, and proposes high-signal pattern updates before modifying any files.

---

## Step 1: Extract Recent Sessions, Commits & Rule Byte Budgets

Run the bundled zero-dependency extractor script from `c:\repos\nmpsocials`:

```powershell
# Default: automatically scans everything since the last commit touching any *AGENTS.md file
node .agent/skills/session-retrospective/scripts/extract-sessions.mjs

# Optional overrides:
# Scan the last N days:
node .agent/skills/session-retrospective/scripts/extract-sessions.mjs --days 2

# Scan since a specific ISO timestamp:
node .agent/skills/session-retrospective/scripts/extract-sessions.mjs --since 2026-10-15T15:00:00Z
```

### What the Script Outputs
1. **Console Summary**:
   - The resolved cutoff timestamp.
   - A live **Rule Byte-Budget Table** (`bytes / 24,000 B` and `% of 24 KB cap`) for `AGENTS.md`, `src/app/AGENTS.md`, `supabase/AGENTS.md`, `scripts/AGENTS.md`, and `services/AGENTS.md`.
   - All `git log` commits since the cutoff.
   - Each active conversation ID in `C:\Users\rogie\.gemini\antigravity\brain\` with its `USER_INPUT` count and `.md` artifacts.
2. **Full Digest File**:
   - Writes `.next/cache/retrospective-digest.md` (or `--out <path>`) containing every `USER_INPUT` prompt (automatically resolving `truncated_fields` from `transcript_full.jsonl`) and `.md` artifact from those sessions.

---

## Step 2: Analyze User Corrections & Codebase Drift

Read the generated digest file (`.next/cache/retrospective-digest.md`) and current `AGENTS.md` files:

1. **Prioritize User Corrections & Follow-Up Nudges**:
   - Look for `USER_INPUT` messages where the user corrected an assumption, reported a regression after a deploy, pointed out an inconsistency across pages/queues, or reminded the agent of a workflow step (e.g., *"still an issue"*, *"why did this happen"*, *"did you pull from main"*, *"are you using our unified data model"*).
2. **Isolate Architectural Patterns (Never Specific Pseudocode)**:
   - Derive **general patterns, architectural invariants, and pointers to canonical helpers** (1–2 sentences each) rather than pasting long code blocks or generic SQL/React boilerplate.
3. **Check for Codebase Drift**:
   - Verify whether any existing statements in `AGENTS.md`, `src/app/AGENTS.md`, `supabase/AGENTS.md`, `scripts/AGENTS.md`, `services/AGENTS.md`, or `CLAUDE.md` contradict current architecture or current `npm test` known failures.
4. **Enforce Compaction & the 24 KB Per-File Cap**:
   - Antigravity truncates any standalone rule file over **24,000 bytes**. Keep every `AGENTS.md` file comfortably below **18,000 bytes (75%)** by consolidating overlapping bullets, removing obsolete notes, and keeping domain rules in their folder-scoped `AGENTS.md` rather than root `AGENTS.md`.

---

## Step 3: Mandatory Proposal Gate (Do Not Edit Immediately)

Just like `/learn`, **never modify `AGENTS.md` or skill files before user approval**:

1. Present a clear item-by-item breakdown showing **what each proposed edit changes** and **why** (which session/bug/drift triggered it), plus the before/after byte-budget table.
2. Create or update an artifact (`learning_proposal.md` or `implementation_plan.md` in the current conversation's artifact directory) with `RequestFeedback: true` and `UserFacing: true`.
3. Only after the user approves the proposal, apply the edits, re-run `node .agent/skills/session-retrospective/scripts/extract-sessions.mjs` to verify all rule files remain well under the `24,000 B` cap, and sync `CLAUDE.md` pointers if any top-level topology changed.

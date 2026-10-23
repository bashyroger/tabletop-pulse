---
name: git-worktree-workflow
description: Isolated parallel development workflow using Git Worktrees, intelligent SemVer bumping, and GitHub Pull Requests in Antigravity. Use when starting any new feature, bug fix, or parallel coding session to prevent .next build cache locks, git index collisions, and premature production deployments.
---

# Git Worktree Parallel Development Runbook

This skill defines the standardized protocol for parallel development in `nmpsocials`. By utilizing Git Worktrees, parallel Antigravity chats, subagents, and terminals operate in completely isolated directories while sharing a single `.git` history, eliminating Windows file locks on `.next/cache` and `.git/index.lock`.

---

## 1. Core Operating Principle: Zero-Direct-to-Main

> [!IMPORTANT]
> **Strict Rule**: Never write code, run builds, or commit directly on `main` for non-trivial features or fixes.
> - `main` triggers Hostinger automatic production deployments (`fanfarely.com`).
> - Running builds on `main` causes Windows `EBUSY / EPERM` collisions with parallel Antigravity sessions.

---

## 2. Session Context Detection

At the start of every coding task, the agent must check its current working environment:

```powershell
git branch --show-current
git worktree list
```

1. **If already inside a dedicated worktree** (e.g. `c:\repos\nmpsocials-worktrees\<branch>`):
   - Proceed directly with implementation and verification in the current directory.
2. **If currently at root repository on `main`** (`c:\repos\nmpsocials`):
   - **Immediately establish a dedicated worktree** before writing any code or modifying files:
     ```powershell
     powershell -ExecutionPolicy Bypass -File scripts/worktree/create.ps1 -BranchName feat/<feature-name>
     ```
   - Direct all subsequent file edits, tool operations, and command executions (`Cwd`) into `c:\repos\nmpsocials-worktrees\<safe-name>`.

---

## 3. Worktree Directory Anatomy

| Path | Purpose | Disk Overhead |
|---|---|---|
| `..\nmpsocials-worktrees\<name>\src` | Independent working files | ~6 MB |
| `..\nmpsocials-worktrees\<name>\node_modules` | NTFS Directory Junction to root `node_modules` | **0 MB** |
| `..\nmpsocials-worktrees\<name>\.env.local` | NTFS Hardlink to root `.env.local` (live sync) | **0 MB** |
| `..\nmpsocials-worktrees\<name>\.next` | Private, isolated build & dev cache | ~75 MB during build |

---

## 4. Intelligent SemVer Bumping

Before committing and opening a Pull Request, bump the version in `package.json` according to change scope:

- **Bugfixes, chores, refactors, docs**:
  ```powershell
  node scripts/bump-version.mjs patch
  ```
  *(e.g., `0.1.0` -> `0.1.1`)*
- **New features, new endpoints, new UI modules**:
  ```powershell
  node scripts/bump-version.mjs minor
  ```
  *(e.g., `0.1.0` -> `0.2.0`)*
- **Breaking architectural changes**:
  ```powershell
  node scripts/bump-version.mjs major
  ```
  *(e.g., `0.1.0` -> `1.0.0`)*

---

## 5. Verification & Pull Request Protocol

1. **Local Verification**:
   Execute `npm run build` strictly inside the worktree directory.
   - The native npm `prebuild` hook will automatically execute `scripts/prune-next-cache.mjs` to keep the cache capped under 1000 MB.
2. **Git Commit**:
   Commit using conventional commit format:
   ```powershell
   git add .
   git commit -m "feat(<scope>): <description>"
   ```
3. **Push to Remote**:
   ```powershell
   git push -u origin <branch-name>
   ```
4. **Create GitHub Pull Request**:
   Use the GitHub CLI (`gh`):
   ```powershell
   gh pr create --title "feat: <title>" --body "### Summary of Changes`n`n- Detailed bullets..."
   ```
5. **Prompt User for Merge Approval**:
   Share the generated PR link in chat and ask the user for confirmation:
   > *"Feature is verified and PR #X is ready. Would you like me to merge into main and trigger deployment now?"*

---

## 6. Merge & Teardown Protocol

Once approved by the user:

1. **Squash & Merge via `gh` CLI**:
   ```powershell
   gh pr merge --squash --delete-branch
   ```
   *(Hostinger automatically begins deployment to `fanfarely.com`)*
2. **Clean Up Local Worktree**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/worktree/clean.ps1 -BranchName <branch-name>
   ```
   This safely unlinks the NTFS `node_modules` junction (without touching the root repository), deletes the worktree folder, removes the temporary `.next` folder, and prunes the Git worktree registry, returning local disk usage to **0 MB net**.

---

## 7. Merge Conflict Resolution Runbook

If `main` has progressed while working in a worktree:

1. Fetch and merge `origin/main` into the active worktree branch:
   ```powershell
   git fetch origin main
   git merge origin/main
   ```
2. If Git reports conflicts:
   - Inspect files containing conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
   - Synthesize both changes cleanly.
   - Run `npm run build` inside the worktree to ensure compilation succeeds.
   - Commit the resolution:
     ```powershell
     git add .
     git commit -m "chore: resolve merge conflicts with main"
     git push
     ```

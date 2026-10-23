[CmdletBinding()]
param()

Write-Host "=== Active Git Worktrees ===" -ForegroundColor Cyan
git worktree list

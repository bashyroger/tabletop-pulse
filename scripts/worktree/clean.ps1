[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$BranchName,

    [Parameter(Mandatory = $false)]
    [switch]$KeepBranch
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path

$SafeName = ($BranchName -replace '[/\\:]', '-')
$WorktreesContainer = Join-Path (Split-Path -Parent $ProjectRoot) "adventurous-meitner-worktrees"
$WorktreePath = Join-Path $WorktreesContainer $SafeName

if (Test-Path $WorktreePath) {
    $TargetNodeModules = Join-Path $WorktreePath "node_modules"
    if (Test-Path -LiteralPath $TargetNodeModules) {
        try {
            $dirInfo = [System.IO.DirectoryInfo]::new($TargetNodeModules)
            if ($dirInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
                $dirInfo.Delete()
            } else {
                cmd /c rmdir "$TargetNodeModules" 2>$null
            }
        } catch {
            cmd /c rmdir "$TargetNodeModules" 2>$null
        }
    }

    if (Test-Path -LiteralPath $TargetNodeModules) {
        throw "[Worktree Clean] Safety Abort: Could not unlink junction $TargetNodeModules."
    }

    function Get-WorktreeLinks([string]$Dir) {
        foreach ($child in [System.IO.Directory]::GetDirectories($Dir)) {
            $info = [System.IO.DirectoryInfo]::new($child)
            if ($info.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { $child }
            else { Get-WorktreeLinks $child }
        }
    }
    $links = @(Get-WorktreeLinks $WorktreePath)
    foreach ($link in $links) {
        [System.IO.Directory]::Delete($link, $false)
    }

    $TargetEnv = Join-Path $WorktreePath ".env.local"
    if (Test-Path -LiteralPath $TargetEnv) {
        cmd /c del /f /q "$TargetEnv" 2>$null
    }

    git worktree remove "$WorktreePath" --force 2>$null

    if (Test-Path $WorktreePath) {
        Remove-Item -Path $WorktreePath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

git worktree prune

if (-not $KeepBranch) {
    git branch -D "$BranchName" 2>$null
}

Write-Host "[Worktree] Cleaned up $WorktreePath successfully." -ForegroundColor Green

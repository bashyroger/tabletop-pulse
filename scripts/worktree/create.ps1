[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$BranchName,

    [Parameter(Mandatory = $false)]
    [string]$BaseBranch = "main"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path

$RootBinNext = Join-Path $ProjectRoot "node_modules\.bin\next.cmd"
if (-not (Test-Path $RootBinNext)) {
    Write-Host "[Worktree Create] Pre-flight: Root node_modules missing binaries. Running npm install..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    npm install
    Pop-Location
}

$SafeName = ($BranchName -replace '[/\\:]', '-')
$WorktreesContainer = Join-Path (Split-Path -Parent $ProjectRoot) "adventurous-meitner-worktrees"
$WorktreePath = Join-Path $WorktreesContainer $SafeName

if (-not (Test-Path $WorktreesContainer)) {
    New-Item -ItemType Directory -Path $WorktreesContainer | Out-Null
}

if (Test-Path $WorktreePath) {
    Write-Host "[Worktree] Worktree folder already exists at: $WorktreePath" -ForegroundColor Yellow
    exit 0
}

Write-Host "[Worktree] Creating worktree for branch '$BranchName' from '$BaseBranch'..." -ForegroundColor Cyan

$BranchOutput = (git branch --list $BranchName)
$BranchExists = ($null -ne $BranchOutput) -and ($BranchOutput.ToString().Trim() -ne "")

if ($BranchExists) {
    git worktree add $WorktreePath $BranchName
} else {
    git worktree add -b $BranchName $WorktreePath $BaseBranch
}

$RootNodeModules = Join-Path $ProjectRoot "node_modules"
$TargetNodeModules = Join-Path $WorktreePath "node_modules"

if (Test-Path $RootNodeModules) {
    Write-Host "[Worktree] Junctioning node_modules (instant, 0 MB disk duplication)..." -ForegroundColor Cyan
    cmd /c mklink /J "$TargetNodeModules" "$RootNodeModules" | Out-Null
}

$RootEnv = Join-Path $ProjectRoot ".env.local"
$TargetEnv = Join-Path $WorktreePath ".env.local"

if (Test-Path $RootEnv) {
    Write-Host "[Worktree] Hardlinking .env.local (live secret sync)..." -ForegroundColor Cyan
    cmd /c mklink /H "$TargetEnv" "$RootEnv" | Out-Null
    if (-not (Test-Path $TargetEnv)) {
        Copy-Item -Path $RootEnv -Destination $TargetEnv -Force
    }
}

Write-Host "`n[Worktree] READY!" -ForegroundColor Green
Write-Host "Path:   $WorktreePath"
Write-Host "Branch: $BranchName"

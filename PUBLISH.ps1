# ============================================================
#  Stealth Chess Helper - Publish Script (PowerShell)
#  Usage:  Right-click -> Run with PowerShell
#      OR run in terminal:  .\PUBLISH.ps1
#  This pushes the code to GitHub and creates a release tag,
#  which triggers GitHub Actions to build the new APK + IPA.
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Stealth Chess Helper - v1.2.0 Publisher" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Move into this script's folder automatically
Set-Location -Path $PSScriptRoot

# ---------- 1) Check Git is installed ----------
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[X] Git is NOT installed. Download it from https://git-scm.com/download/win and install it, then re-run this script." -ForegroundColor Red
    pause
    exit 1
}

# ---------- 2) Initialize git if this is not a repo yet ----------
# (This happens when you download the project as ZIP from GitHub - ZIPs have no .git folder!)
if (-not (Test-Path ".git")) {
    Write-Host "[*] Not a git repository (you downloaded the ZIP). Initializing now..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# ---------- 3) Ask for your GitHub repository URL (first time only) ----------
$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
    Write-Host ""
    Write-Host "Enter your GitHub repository URL (ends with .git)" -ForegroundColor Yellow
    Write-Host "Example: https://github.com/YOUR-USERNAME/Stealth-CHESS-V2.git"
    $repoUrl = Read-Host "Repo URL"
    git remote add origin $repoUrl
}

# ---------- 4) Commit everything ----------
git config user.email "helper@stealthchess.local" 2>$null
git config user.name  "StealthChessHelper" 2>$null

git add -A
git commit -m "v1.2.0 smooth + live games + HUD removed" | Out-Null
Write-Host "[OK] Changes committed." -ForegroundColor Green

# ---------- 5) Push to GitHub ----------
git push -u origin main --force
Write-Host "[OK] Code pushed to GitHub." -ForegroundColor Green

# ---------- 6) Create the release tag (triggers the APK/IPA build) ----------
git tag -f v1.2.0
git push -f origin v1.2.0
Write-Host "[OK] Tag v1.2.0 pushed!" -ForegroundColor Green

# ---------- 7) Open the Actions page so you can watch the build ----------
Start-Process "https://github.com/"  # open browser - go to your repo -> Actions tab

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " DONE! Now do this:" -ForegroundColor Magenta
Write-Host "  1. Open your repository on github.com" -ForegroundColor White
Write-Host "  2. Click the [Actions] tab" -ForegroundColor White
Write-Host "  3. Wait 5-15 minutes for the builds to finish" -ForegroundColor White
Write-Host "  4. Your new APK + IPA will appear under [Releases]" -ForegroundColor White
Write-Host "     as StealthChessHelper.apk / StealthChessHelper.ipa" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
pause

# Shadow Deck - 자동 백업 스크립트
# 실행: PowerShell에서 .\backup.ps1

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupDir = "C:\SDS\backup_$timestamp"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Shadow Deck 백업 시작" -ForegroundColor Cyan
Write-Host "  백업 폴더: $backupDir" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# 백업 폴더 생성
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 핵심 JS 파일 목록
$jsFiles = @(
    "cards.js",
    "shield.js", 
    "effects.js",
    "vfx.js",
    "background.js",
    "job-system.js",
    "game.js",
    "town.js",
    "combat-effects.js",
    "relics.js",
    "monster.js",
    "stage.js",
    "title.js",
    "map.js",
    "player-stats.js",
    "npc.js",
    "hand-manager.js",
    "card-drag.js",
    "starter-deck.js",
    "critical-system.js",
    "bleed-system.js",
    "buff.js",
    "turn-effects.js",
    "enemy-ai.js",
    "status-effects.js",
    "hoodshop.js",
    "doppelganger.js",
    "mobile-touch.js",
    "monster-passives.js",
    "hit-effects.js",
    "incantation-system.js",
    "spell-vfx.js",
    "mage-vfx.js",
    "relic-fourcard.js",
    "break-system.js"
)

$copied = 0
foreach ($file in $jsFiles) {
    $sourcePath = "C:\SDS\$file"
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath "$backupDir\$file"
        Write-Host "  [OK] $file" -ForegroundColor Green
        $copied++
    }
}

# CSS 파일
if (Test-Path "C:\SDS\styles.css") {
    Copy-Item "C:\SDS\styles.css" "$backupDir\styles.css"
    Write-Host "  [OK] styles.css" -ForegroundColor Green
    $copied++
}

if (Test-Path "C:\SDS\town.css") {
    Copy-Item "C:\SDS\town.css" "$backupDir\town.css"
    Write-Host "  [OK] town.css" -ForegroundColor Green
    $copied++
}

# HTML 파일
if (Test-Path "C:\SDS\index.html") {
    Copy-Item "C:\SDS\index.html" "$backupDir\index.html"
    Write-Host "  [OK] index.html" -ForegroundColor Green
    $copied++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  백업 완료! ($copied 파일)" -ForegroundColor Green
Write-Host "  위치: $backupDir" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# 백업 목록 표시
Write-Host ""
Write-Host "기존 백업 폴더:" -ForegroundColor Cyan
Get-ChildItem "C:\SDS\backup_*" -Directory | Sort-Object Name -Descending | Select-Object -First 5 | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1KB
    Write-Host "  $($_.Name) - $([math]::Round($size, 1)) KB" -ForegroundColor Gray
}


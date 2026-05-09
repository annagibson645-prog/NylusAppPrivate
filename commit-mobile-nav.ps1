# Mobile nav commit script — double-click to run
Set-Location $PSScriptRoot

# Clear stale lock if present
if (Test-Path ".git\index.lock") { Remove-Item ".git\index.lock" -Force }

git add components/ConstellationV2.tsx components/NavG.tsx components/MobileNav.tsx components/ThemeToggle.tsx app/layout.tsx app/globals.css app/collisions/page.tsx

git commit -m "feat: global mobile nav — MobileNav component, hide desktop navs on mobile"

git push

Write-Host "`nDone! Press any key to close." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

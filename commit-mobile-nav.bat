@echo off
cd /d "%~dp0"
if exist ".git\index.lock" del /f ".git\index.lock"
git add components/ConstellationV2.tsx components/NavG.tsx components/MobileNav.tsx components/NodeReader.tsx app/layout.tsx app/globals.css app/collisions/page.tsx app/hubs/page.tsx "app/domain/[name]/page.tsx"
git commit -m "feat: domain pages — Sri Yantra glow bg + atmospheric wash + staggered card entrance + domain color hover glow"
git push
echo.
echo Done — Domain page enhancements + Ghost Hero deployed

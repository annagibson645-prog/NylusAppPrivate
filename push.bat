@echo off
cd /d "%~dp0"
if exist .git\index.lock del /f .git\index.lock
git add lib/adapt-vault.ts
git add app/domain/
git add app/hub/
git add app/sources/page.tsx
git add app/timeline/page.tsx
git add components/ConstellationV2.tsx
git add components/SearchModal.tsx
git add public/data/hubs.json
git commit -m "fix: repair all 5 truncated files — adapt-vault, ConstellationV2, domain page, sources, timeline"
git push origin main
pause

@echo off
cd /d "%~dp0"
echo.
echo  Auto-push watcher starting...
echo  Leave this window open. It will push to GitHub automatically after each edit.
echo  Press Ctrl+C to stop.
echo.
node watch-push.js
pause

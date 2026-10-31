@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is required. Install Node.js 18 or newer and reopen this window.
  pause
  exit /b 1
)
node "tools\update-content.js"
set "WEBSITE_RESULT=%ERRORLEVEL%"
if not "%WEBSITE_RESULT%"=="0" echo ERROR: Command failed. Review the messages above.
pause
exit /b %WEBSITE_RESULT%

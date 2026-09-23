@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Serve Node.js per avviare questa prova.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci --no-audit --no-fund
  if errorlevel 1 exit /b 1
)
call npm run dev -- --open
pause

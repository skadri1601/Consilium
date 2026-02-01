@echo off
REM sync-env.bat - Sync .env.local to .env (Windows version)
REM Usage: scripts\sync-env.bat

echo Syncing environment files...
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo Error: .env.local not found!
    echo Run: copy .env.example .env.local
    exit /b 1
)

REM Backup existing .env if it exists
if exist .env (
    copy /Y .env .env.backup >nul
    echo Backed up existing .env to .env.backup
)

REM Copy .env.local to .env
copy /Y .env.local .env >nul

echo [32m✓[0m Synced .env.local → .env
echo.
echo Done! Environment files are in sync.

@echo off
cd /d "%~dp0frontend"
if not exist .env copy .env.example .env
call npm run dev
pause

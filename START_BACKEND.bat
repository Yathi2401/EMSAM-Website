@echo off
cd /d "%~dp0backend"
if not exist .env copy .env.example .env
call npm run dev
pause

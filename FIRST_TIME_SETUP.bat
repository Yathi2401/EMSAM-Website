@echo off
setlocal
cd /d "%~dp0"

echo =============================================
echo EMSAM Full-Stack Project - First Time Setup
echo =============================================
echo.
echo Configure backend/.env with MONGODB_URI, JWT_SECRET and ADMIN_PASSWORD.
echo Use MongoDB Atlas or a local replica set for Excel imports.
echo.

cd backend
if not exist .env copy .env.example .env
call npm install
if errorlevel 1 goto error
call npm run db:setup
if errorlevel 1 goto error

cd ..\frontend
if not exist .env copy .env.example .env
call npm install
if errorlevel 1 goto error

cd ..
echo.
echo Setup completed successfully.
echo Run START_BACKEND.bat and START_FRONTEND.bat in separate windows.
pause
exit /b 0

:error
echo.
echo Setup failed. Check MongoDB connectivity and backend/.env settings.
pause
exit /b 1

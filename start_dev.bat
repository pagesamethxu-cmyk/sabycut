@echo off
title SABYCUT Master Launcher
echo ===================================================
echo   SABYCUT Video Editor - Starting All Services
echo ===================================================

echo [1/4] Freeing any stale ports (8080, 5000, 3000)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-all.ps1"

timeout /t 2 /nobreak >nul

echo [2/4] Starting Frontend (Vite on port 3000)...
start "SABYCUT Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo [3/4] Starting AI Service (Python Flask on port 5000)...
start "SABYCUT AI Service" cmd /k "cd /d %~dp0ai-service && python run.py"

echo [4/4] Starting Backend Core (Spring Boot on port 8080)...
start "SABYCUT Backend Core" cmd /k "cd /d %~dp0backend-core && mvn spring-boot:run"

echo ===================================================
echo All services launched!
echo - Frontend:    http://localhost:3000
echo - Backend API: http://localhost:8080
echo - AI Service:  http://localhost:5000
echo ===================================================
echo Keep this window open or minimize it. To stop all services, run stop_dev.bat.
pause

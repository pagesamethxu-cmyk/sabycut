@echo off
title SABYCUT Stop Services
echo ===================================================
echo Stopping SABYCUT processes on ports 8080, 5000, 3000
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-all.ps1"
echo Done.
pause

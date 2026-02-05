@echo off
echo Starting Blackhole Infiverse Application...
echo.

echo [1/2] Starting Backend API Server...
start "Backend API" cmd /k "cd backend && python api.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Application is starting!
echo.
echo Backend API: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window...
pause >nul


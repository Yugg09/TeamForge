@echo off
echo ============================================
echo   TeamForge - Starting Full App
echo ============================================
echo.

echo Starting Backend (FastAPI) on port 8000...
start "TeamForge Backend" cmd /k "cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Vite) on port 5173...
start "TeamForge Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ============================================
echo.
pause

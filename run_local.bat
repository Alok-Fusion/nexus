@echo off
echo =================================================
echo           NEXUS LOCAL-FIRST WORKSPACE
echo =================================================

REM 1. Check Python Virtual Environment
if not exist "apps\api\.venv" (
    echo [+] Creating Python virtual environment...
    python -m venv apps\api\.venv
    call apps\api\.venv\Scripts\pip.exe install -r apps\api\requirements.txt
)

REM 2. Seed Database
echo [+] Verifying and seeding local database...
call apps\api\.venv\Scripts\python.exe scripts\seed_data.py

REM 3. Start Backend in a background window
echo [+] Starting FastAPI backend on http://127.0.0.1:8000...
start "NEXUS API (Port 8000)" cmd /k "apps\api\.venv\Scripts\uvicorn.exe app.main:app --port 8000 --app-dir apps\api --reload"

REM 4. Start Frontend
echo [+] Starting Next.js frontend on http://localhost:3000...
cd apps\web
npm run dev

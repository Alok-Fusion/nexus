# NEXUS Local Startup Script for Windows PowerShell
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "          ⚡ NEXUS LOCAL-FIRST WORKSPACE        " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Check Python Virtual Environment
if (-not (Test-Path "apps/api/.venv")) {
    Write-Host "[+] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv apps/api/.venv
    & "apps/api/.venv/Scripts/pip" install -r apps/api/requirements.txt
}

# 2. Seed Database
Write-Host "[+] Verifying and seeding local database..." -ForegroundColor Yellow
& "apps/api/.venv/Scripts/python" scripts/seed_data.py

# 3. Start Backend
Write-Host "[+] Starting FastAPI backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process -FilePath "apps/api/.venv/Scripts/uvicorn" -ArgumentList "app.main:app --port 8000 --app-dir apps/api --reload" -WindowStyle Hidden

# 4. Start Frontend
Write-Host "[+] Starting Next.js frontend on http://localhost:3000..." -ForegroundColor Green
Set-Location "apps/web"
npm run dev

# Department Network Monitoring Backend - Quick Start Script
# PowerShell 5.1 SAFE (ASCII ONLY)

Clear-Host

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Department Monitoring Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --------------------------------------------------
# [1/6] Check Python installation
# --------------------------------------------------
Write-Host "[1/6] Checking Python installation..." -ForegroundColor Yellow

$pythonCmd = Get-Command python -ErrorAction SilentlyContinue

if ($null -eq $pythonCmd) {
    Write-Host "ERROR: Python not found. Install Python 3.10+" -ForegroundColor Red
    exit 1
}

$pythonVersion = python --version 2>&1
Write-Host "Found: $pythonVersion" -ForegroundColor Green

if ($pythonVersion -notmatch 'Python 3\.(1[0-9]|[2-9][0-9])') {
    Write-Host "WARNING: Python 3.10+ recommended" -ForegroundColor Yellow
}

# --------------------------------------------------
# [2/6] Create virtual environment
# --------------------------------------------------
Write-Host ""
Write-Host "[2/6] Creating virtual environment..." -ForegroundColor Yellow

if (Test-Path "venv") {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
}
else {
    python -m venv venv
    Write-Host "Virtual environment created" -ForegroundColor Green
}

# --------------------------------------------------
# [3/6] Activate virtual environment
# --------------------------------------------------
Write-Host ""
Write-Host "[3/6] Activating virtual environment..." -ForegroundColor Yellow

$activateScript = ".\venv\Scripts\Activate.ps1"

if (-not (Test-Path $activateScript)) {
    Write-Host "ERROR: Cannot find Activate.ps1" -ForegroundColor Red
    Write-Host "If blocked, run:" -ForegroundColor Yellow
    Write-Host "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned" -ForegroundColor Cyan
    exit 1
}

& $activateScript
Write-Host "Virtual environment activated" -ForegroundColor Green

# --------------------------------------------------
# [4/6] Install dependencies
# --------------------------------------------------
Write-Host ""
Write-Host "[4/6] Installing dependencies..." -ForegroundColor Yellow

pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Dependencies installed" -ForegroundColor Green

# --------------------------------------------------
# [5/6] Setup configuration
# --------------------------------------------------
Write-Host ""
Write-Host "[5/6] Setting up configuration..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host ".env already exists" -ForegroundColor Green
}
else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host ".env created from template" -ForegroundColor Green
        Write-Host "REMINDER: Edit .env before running in production" -ForegroundColor Yellow
    }
    else {
        Write-Host "WARNING: No .env.example found" -ForegroundColor Yellow
    }
}

# --------------------------------------------------
# [6/6] Done
# --------------------------------------------------
Write-Host ""
Write-Host "[6/6] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Start server: python main.py"
Write-Host "2. API docs: http://localhost:8000/docs"
Write-Host "3. Run tests: python test_api.py"
Write-Host ""

$response = Read-Host "Start backend server now? (y/n)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop"
    Write-Host ""
    python main.py
}

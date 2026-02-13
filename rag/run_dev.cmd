@echo off
setlocal

REM Load env vars from .env (optional)
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if not "%%a"=="" set "%%a=%%b"
  )
)

if not defined PORT set PORT=8000

call .venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 0.0.0.0 --port %PORT% --reload

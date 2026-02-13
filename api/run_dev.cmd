@echo off
setlocal

REM Load env vars from .env (optional)
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    if not "%%a"=="" set "%%a=%%b"
  )
)

call npm run dev

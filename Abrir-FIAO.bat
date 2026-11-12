@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-FIAO.ps1"
if errorlevel 1 (
  echo.
  echo No se pudo iniciar FIA'O. Si ya hay otra ventana abierta, cierrala e intenta de nuevo.
  pause
)

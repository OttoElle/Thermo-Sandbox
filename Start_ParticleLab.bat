@echo off
title Thermo Sandbox
cd /d "%~dp0"
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python build_all.py
)
start "" "ParticleLab_Standalone.html"



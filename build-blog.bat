@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   NeoWise Blog Generator
echo ============================================
node "%~dp0scripts\build-blog.mjs"
echo.
echo ============================================
echo   Done. Please check the "blog" folder.
echo ============================================
pause

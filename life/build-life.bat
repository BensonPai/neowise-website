@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Smart Cat (Zhihuimiao) Blog Generator
echo ============================================
node "%~dp0scripts\build-life-blog.mjs"
echo.
echo ============================================
echo   Done. Please check the life folder.
echo ============================================
pause

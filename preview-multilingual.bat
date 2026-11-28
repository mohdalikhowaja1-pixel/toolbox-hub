@echo off
setlocal
cd /d "%~dp0"

echo Starting MyToolX multilingual local preview...
echo.
echo IMPORTANT: Do not open HTML files by double-clicking them.
echo Root-relative CSS and JavaScript paths require HTTP.
echo Keep the server window open while testing.
echo.

start "MyToolX Local HTTP Server" cmd /k "cd /d ""%~dp0"" && py -3 -m http.server 8000 --bind 127.0.0.1"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8000/es/about.html

echo Local preview opened at http://127.0.0.1:8000/es/about.html
echo.
pause

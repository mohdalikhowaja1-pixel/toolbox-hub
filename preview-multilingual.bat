@echo off
setlocal
cd /d "%~dp0"

echo Starting MyToolX multilingual local preview...
echo.
echo IMPORTANT: Do not open HTML files by double-clicking them.
echo The site uses root-relative CSS and JavaScript paths, which require HTTP.
echo.
start "" http://127.0.0.1:8000/es/about.html
py -3 -m http.server 8000 --bind 127.0.0.1

echo.
echo The local preview server has stopped.
pause

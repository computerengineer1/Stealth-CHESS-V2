@echo off
title Stealth Chess - Web Shop Server
echo ===================================================
echo     STEALTH CHESS - AUTOMATED WEB STORE
echo ===================================================
echo.
echo Starting local web server on port 8085...
echo Opening your browser to http://localhost:8085 ...
echo.
start http://localhost:8085
python -m http.server 8085 --directory web_shop
pause

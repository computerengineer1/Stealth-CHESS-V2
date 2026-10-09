@echo off
chcp 65001 >nul
title Deploy Stealth Chess Website to GitHub Pages
python "%~dp0deploy_website.py"
pause

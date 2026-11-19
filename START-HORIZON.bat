@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :no_node

if exist horizon\server.js (
    cd horizon
)

node server.js
if errorlevel 1 goto :err
goto :eof

:no_node
echo Horizon needs Node.js. Opening the download page...
start https://nodejs.org
pause
exit /b 1

:err
echo An error occurred running Horizon.
pause
exit /b 1

@echo off
setlocal enabledelayedexpansion

REM Get this script's folder
SET SCRIPT_DIR=%~dp0

REM Bypass "Terminate Batch Job" prompt.
if "%~1"=="-FIXED_CTRL_C" (
   REM Remove the -FIXED_CTRL_C parameter
   SHIFT
) ELSE (
   REM Run the batch with <NUL and -FIXED_CTRL_C
   CALL <NUL %0 -FIXED_CTRL_C %*
   exit /b 0
)

REM Check if versions.cfg file exists
set "VERSIONS_FILE=%SCRIPT_DIR%versions.cfg"
if not exist "%VERSIONS_FILE%" (
    echo versions.cfg file not found!
    exit /b 1
)

REM Read the versions.cfg file and set the variables
for /f "usebackq tokens=* delims=" %%i in ("%VERSIONS_FILE%") do (
    set "%%i"
)

echo MAVSDK_SERVER_VERSION: %MAVSDK_SERVER_VERSION%
echo GRPC_WEB_PROXY_VERSION: %GRPC_WEB_PROXY_VERSION%

REM Find the correct backend/modules path
if exist "%SCRIPT_DIR%\..\dist\backend\modules" (
    echo Running in dev mode: this script is run from the REPO_ROOT/backend folder
    SET "BACKEND_MODULES_DIR=%SCRIPT_DIR%..\dist\backend\modules"
) else (
    if exist "%SCRIPT_DIR%\modules" (
        echo Running in production build mode: this script in the dist/backend folder
        SET "BACKEND_MODULES_DIR=%SCRIPT_DIR%modules"
    ) else (
        echo No backend modules folder found!
        exit /b 1
    )
)

set "PROGRAM_MAVSDK_SERVER=%BACKEND_MODULES_DIR%\mavsdk-server-%MAVSDK_SERVER_VERSION%\bin\mavsdk_server_bin.exe"
set "PROGRAM_GRPC_WEB_PROXY=%BACKEND_MODULES_DIR%\grpcwebproxy-%GRPC_WEB_PROXY_VERSION%/grpcwebproxy-v%GRPC_WEB_PROXY_VERSION%-win64.exe"

REM Check and update firewall rules
CALL "%SCRIPT_DIR%firewallAllow.cmd"

:: Loop until the process associated with the script is no longer running
:checkProcess
    :: Use tasklist to find the script running
    tasklist /FI "IMAGENAME eq cmd.exe" | find /I "firewallAllow.cmd" >nul
    if not errorlevel 1 (
        echo Waiting for firewallAllow.cmd to exit...
        timeout /t 1 /nobreak >nul
        goto checkProcess
    )

echo Starting mavsdk-server-%MAVSDK_SERVER_VERSION%
START "" /B cmd /c "%PROGRAM_MAVSDK_SERVER%" ^
    -p 50051 ^
    udp://:14550
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq mavsdk_server_bin.exe"') do set MAVSDK_SERVER_PID=%%a

REM Make sure the mavsdk-server process was identified
IF "%MAVSDK_SERVER_PID%"=="No" (
    echo MAVSDK_SERVER_PID not found!
    exit /b 1
)

echo Starting grpcwebproxy-%GRPC_WEB_PROXY_VERSION%
START "" /B cmd /c "%PROGRAM_GRPC_WEB_PROXY%" ^
    --backend_addr=127.0.0.1:50051 ^
    --server_http_debug_port 60000 ^
    --run_tls_server=false ^
    --allow_all_origins ^
    --server_http_max_write_timeout 0 ^
    --server_http_max_read_timeout 0
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq grpcwebproxy-v%GRPC_WEB_PROXY_VERSION%-win64.exe"') do set GRPCWEBPROXY_PID=%%a

REM Make sure the grpcwebprocy process was identified
IF "%GRPCWEBPROXY_PID%"=="No" (
    echo GRPCWEBPROXY_PID not found!
    exit /b 1
)

REM Trap CTRL+C by catching the errorlevel from choice
echo Press Ctrl+C to terminate...

:waitForCtrlC
choice /C AB /N /T 9999 /D A >nul
if errorlevel 1 goto waitForCtrlC

echo.
echo Stopping all backend processes...

REM Kill all processes
taskkill /F /PID %MAVSDK_SERVER_PID%
taskkill /F /PID %GRPCWEBPROXY_PID%

endlocal
exit /b 0

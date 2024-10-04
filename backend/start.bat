@echo off
setlocal enabledelayedexpansion

set "LOG_FOLDER=%LocalAppData%\Droneviz"
set "BACKEND_LOG_FILE=%LOG_FOLDER%\backend.log"
set "BACKEND_FIREWALL_LOG_FILE=%LOG_FOLDER%\backend_firewall.log"

REM Check if the user has administrator permissions
net session >nul 2>&1
if %errorLevel% neq 0 (
    REM No admin permissions

    if exist %LOG_FOLDER%\ (
        echo Log folder %LOG_FOLDER% exists
    ) else (
        echo Creating log folder %LOG_FOLDER%
        md %LOG_FOLDER%
    )

    echo Delete old log file
    del "%BACKEND_LOG_FILE%" >nul 2>&1

    REM Write log file from here on
    echo Redirecting output to log file from here...
    echo Hit ENTER to exit...

    call :start >> %BACKEND_LOG_FILE% 2>&1

    exit /b
) else (
    REM Admin permissions

    if not exist %LOG_FOLDER%\ (
        echo Log folder %LOG_FOLDER% doesn't exist. Did you run this script without admin permissions?
        exit /b 1
    )

    REM Delete old log file
    del "%BACKEND_FIREWALL_LOG_FILE%" >nul 2>&1

    call :start >> %BACKEND_FIREWALL_LOG_FILE% 2>&1
    
    exit /b
)

:start
    REM Get this script's folder
    SET SCRIPT_DIR=%~dp0

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
    set "PROGRAM_GRPC_WEB_PROXY=%BACKEND_MODULES_DIR%\grpcwebproxy-%GRPC_WEB_PROXY_VERSION%\grpcwebproxy-v%GRPC_WEB_PROXY_VERSION%-win64.exe"

    REM get the full path without ~1 and ".."
    for /f "delims=" %%I in ('powershell -command "[System.IO.Path]::GetFullPath('%PROGRAM_MAVSDK_SERVER%')"') do set PROGRAM_MAVSDK_SERVER=%%I
    for /f "delims=" %%I in ('powershell -command "[System.IO.Path]::GetFullPath('%PROGRAM_GRPC_WEB_PROXY%')"') do set PROGRAM_GRPC_WEB_PROXY=%%I

    REM Rule 1: mavsdk-server
    set "RULE_NAME_MAVSDK_SERVER=Droneviz MavsdkServer(%PROGRAM_MAVSDK_SERVER%)"

    REM Rule 2: grpcwebproxy
    set "RULE_NAME_GRPC_WEB_PROXY=Droneviz GRPCWebProxy (%PROGRAM_GRPC_WEB_PROXY%)"

    REM Check if firewall update necessary (all rules need to exist)
    SET "FIREWALL_UPDATE_NECESSARY=false"

    netsh advfirewall firewall show rule name="%RULE_NAME_MAVSDK_SERVER%" > NUL 2>&1
    IF ERRORLEVEL 1 (
        SET "FIREWALL_UPDATE_NECESSARY=true"
    )

    netsh advfirewall firewall show rule name="%RULE_NAME_GRPC_WEB_PROXY%" > NUL 2>&1
    IF ERRORLEVEL 1 (
        SET "FIREWALL_UPDATE_NECESSARY=true"
    )

    net session >nul 2>&1
    if %errorLevel% neq 0 (
        REM No admin permissions

        REM exit if no update necessary
        if "%FIREWALL_UPDATE_NECESSARY%" == "true" (
            echo Requesting administrator permissions
            goto UACPrompt
        ) else ( echo No firewall changes needed )

        goto :startBackend
    ) else (
        goto :updateFirewallRules
    )

:UACPrompt
    del %temp%\droneviz-firewall-signal.txt

    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params = %*:"="
    echo UAC.ShellExecute "cmd.exe", "/c %~s0 %params%", "", "runas", 1 >> "%temp%\getadmin.vbs"

    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"

    :: Wait until the firewall was set up
    echo Waiting for firewall rule update ...
    :waitloop
    if not exist %temp%\droneviz-firewall-signal.txt (
        timeout /t 1 /nobreak >nul
        goto waitloop
    )

    goto :startBackend

:updateFirewallRules
	echo Administrative permissions confirmed
    echo Configuring firewall

	REM First delete existing rules to not create duplicates
	netsh advfirewall firewall delete rule name="%RULE_NAME_MAVSDK_SERVER%"
	netsh advfirewall firewall delete rule name="%RULE_NAME_GRPC_WEB_PROXY%"

	REM Add new rules
	netsh advfirewall firewall add rule name="%RULE_NAME_MAVSDK_SERVER%" action=allow profile=any dir=in program="%PROGRAM_MAVSDK_SERVER%" enable=yes
	netsh advfirewall firewall add rule name="%RULE_NAME_MAVSDK_SERVER%" action=allow profile=any dir=out program="%PROGRAM_MAVSDK_SERVER%" enable=yes

	netsh advfirewall firewall add rule name="%RULE_NAME_GRPC_WEB_PROXY%" action=allow profile=any dir=in program="%PROGRAM_GRPC_WEB_PROXY%" enable=yes
	netsh advfirewall firewall add rule name="%RULE_NAME_GRPC_WEB_PROXY%" action=allow profile=any dir=out program="%PROGRAM_GRPC_WEB_PROXY%" enable=yes

    REM Signal to the non-admin script that the firewall was set up
    echo Signal from File 1 > %temp%\droneviz-firewall-signal.txt

	exit /B

:startBackend
    REM Simulator: udp://:14550
    REM QGroundControl mavlink forwarding: udp://:14445
    echo Starting mavsdk-server-%MAVSDK_SERVER_VERSION%
    START "" /B "%PROGRAM_MAVSDK_SERVER%" ^
        -p 50055 ^
        udp://:14445
    for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq mavsdk_server_bin.exe"') do set MAVSDK_SERVER_PID=%%a

    REM Make sure the mavsdk-server process was identified
    IF "%MAVSDK_SERVER_PID%"=="No" (
        echo MAVSDK_SERVER_PID not found!
        exit /b 1
    )

    echo Starting grpcwebproxy-%GRPC_WEB_PROXY_VERSION%
    START "" /B "%PROGRAM_GRPC_WEB_PROXY%" ^
        --backend_addr=127.0.0.1:50055 ^
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

    :waitForEnter
    set /p DUMMY=Hit ENTER to exit...
    if errorlevel 0 ( goto :cleanup )
    else ( goto :waitForEnter )

:: Function to clean up subprocesses
:cleanup
    echo.
    echo Stopping all backend processes...
    taskkill /PID %MAVSDK_SERVER_PID% /F >nul 2>&1
    taskkill /PID %GRPCWEBPROXY_PID% /F >nul 2>&1

    endlocal
    exit /b 0

@echo off

REM Rule 1: mavsdk-server
set RULE_NAME_MAVSDK_SERVER=DronevizMavsdkServer

REM Rule 2: grpcwebproxy
set RULE_NAME_GRPC_WEB_PROXY=DronevizGRPCWebProxy

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

REM exit if no update necessary
if "%FIREWALL_UPDATE_NECESSARY%" == "false" (
    echo No firewall changes needed
	exit /b 1
)

REM Check if the user has administrator permissions
net session >nul 2>&1
if %errorLevel% neq 0 (
	echo Requesting administrator permissions
	
	REM This will restart the entire current script with administrator permissions
	set "params=%*"
	cd /d "%~dp0" && ( if exist "%temp%\getadmin.vbs" del "%temp%\getadmin.vbs" ) && fsutil dirty query %systemdrive% 1>nul 2>nul || (  echo Set UAC = CreateObject^("Shell.Application"^) : UAC.ShellExecute "cmd.exe", "/k cd ""%~sdp0"" && ""%~s0"" %params%", "", "runas", 1 >> "%temp%\getadmin.vbs" && "%temp%\getadmin.vbs" && exit /B )
) else (
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

	exit
)

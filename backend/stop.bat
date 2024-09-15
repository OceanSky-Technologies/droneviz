@echo off

for /F "skip=2 tokens=2 delims=," %%a in (
  'wmic process where "CommandLine like '%%backend\\start.bat%%'" get ProcessID^,Status /format:csv'
) do (
    echo Killing process ID %%a
    taskkill /F /T /PID %%a
)

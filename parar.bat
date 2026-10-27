@echo off
for %%P in (5173 3001) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P " ^| findstr LISTENING') do (
    taskkill /f /t /pid %%A >nul 2>&1
  )
)
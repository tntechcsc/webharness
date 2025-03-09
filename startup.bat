@echo off
cd /d "%~dp0"

echo Starting Rust backend...
start cmd /k "cd /d backend && cargo run"

echo Starting React frontend...
start cmd /k "cd /d frontend && npm start"

echo Both services started!
exit
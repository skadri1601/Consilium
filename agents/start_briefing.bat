@echo off
cd /d "%~dp0\.."
set PYTHONPATH=.
set PYTHONIOENCODING=utf-8
agents\.venv\Scripts\python.exe -m agents.bots.briefing_agent

#!/bin/bash
cd "$(dirname "$0")/.."
export PYTHONPATH=.
export PYTHONIOENCODING=utf-8
agents/.venv/Scripts/python.exe -m agents.bots.briefing_agent

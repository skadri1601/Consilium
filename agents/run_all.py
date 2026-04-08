import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

from agents.config import DEFAULT_MODEL
from agents.core.base import setup_logging

logger = setup_logging("orchestrator")

LOGS_DIR = Path(__file__).resolve().parent / "logs"
MAX_RESTARTS = 10

children = {}
restart_counts = {}
log_files = {}
shutdown = False


def _open_log(name):
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOGS_DIR / f"{name}.log"
    fh = open(log_path, "a", encoding="utf-8")
    log_files[name] = fh
    return fh


def start_process(name, cmd):
    logger.info("Starting %s: %s", name, " ".join(cmd))
    fh = _open_log(name)
    proc = subprocess.Popen(cmd, stdout=fh, stderr=fh)
    children[name] = proc
    restart_counts.setdefault(name, 0)
    return proc


def stop_all():
    for name, proc in children.items():
        if proc.poll() is None:
            logger.info("Sending SIGTERM to %s (pid %d)", name, proc.pid)
            proc.terminate()

    deadline = time.time() + 10
    for name, proc in children.items():
        remaining = max(0, deadline - time.time())
        try:
            proc.wait(timeout=remaining)
        except subprocess.TimeoutExpired:
            logger.warning("Force killing %s (pid %d)", name, proc.pid)
            proc.kill()

    for fh in log_files.values():
        fh.close()


def handle_signal(signum, frame):
    global shutdown
    logger.info("Received signal %s, shutting down", signum)
    shutdown = True


def main():
    global shutdown

    parser = argparse.ArgumentParser(description="Consilium Agent Orchestrator")
    parser.add_argument("--interval", type=int, default=300)
    parser.add_argument("--restart-delay", type=int, default=15)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--no-slack", action="store_true")
    parser.add_argument("--no-monitor", action="store_true")
    parser.add_argument("--briefing", action="store_true")
    args = parser.parse_args()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    agents = {}

    if not args.no_slack:
        agents["slack_bot"] = [sys.executable, "-m", "agents.bots.slack_bot", "--model", args.model]

    if not args.no_monitor:
        agents["monitor_agent"] = [sys.executable, "-m", "agents.bots.monitor_agent", "--interval", str(args.interval)]

    for name, cmd in agents.items():
        start_process(name, cmd)

    if args.briefing:
        logger.info("Running morning briefing...")
        subprocess.run([sys.executable, "-m", "agents.bots.briefing_agent"], timeout=120)

    logger.info("All agents started. Monitoring...")

    while not shutdown:
        for name, cmd in agents.items():
            proc = children.get(name)
            if proc and proc.poll() is not None:
                restart_counts[name] += 1
                if restart_counts[name] > MAX_RESTARTS:
                    logger.error(
                        "%s exceeded max restarts (%d). Giving up.",
                        name, MAX_RESTARTS,
                    )
                    continue
                logger.warning(
                    "%s exited with code %s (restart #%d). Restarting in %ds...",
                    name, proc.returncode, restart_counts[name], args.restart_delay,
                )
                for _ in range(args.restart_delay):
                    if shutdown:
                        break
                    time.sleep(1)
                if not shutdown:
                    start_process(name, cmd)

        time.sleep(2)

    logger.info("Shutting down all agents...")
    stop_all()
    logger.info("Orchestrator stopped.")


if __name__ == "__main__":
    main()

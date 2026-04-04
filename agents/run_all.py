import argparse
import signal
import subprocess
import sys
import time

from agents.config import DEFAULT_MODEL
from agents.core.base import setup_logging

logger = setup_logging("orchestrator")

children = {}
restart_counts = {}
shutdown = False


def start_process(name, cmd):
    logger.info("Starting %s: %s", name, " ".join(cmd))
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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


def handle_signal(signum, frame):
    global shutdown
    logger.info("Received signal %s, shutting down", signum)
    shutdown = True


def main():
    global shutdown

    parser = argparse.ArgumentParser(description="Consilium Agent Orchestrator")
    parser.add_argument("--poll-interval", type=int, default=300)
    parser.add_argument("--restart-delay", type=int, default=15)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--no-email", action="store_true")
    parser.add_argument("--no-slack", action="store_true")
    parser.add_argument("--no-github", action="store_true")
    parser.add_argument("--no-monitor", action="store_true")
    parser.add_argument("--briefing", action="store_true")
    args = parser.parse_args()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    agents = {}

    if not args.no_email:
        cmd = [sys.executable, "-m", "agents.bots.email_agent", "--continuous", "--poll-interval", str(args.poll_interval), "--model", args.model]
        if args.dry_run:
            cmd.append("--dry-run")
        agents["email_agent"] = cmd

    if not args.no_slack:
        agents["slack_bot"] = [sys.executable, "-m", "agents.bots.slack_bot", "--model", args.model]

    if not args.no_github:
        cmd = [sys.executable, "-m", "agents.bots.github_listener", "--continuous", "--poll-interval", "120", "--model", args.model]
        if args.dry_run:
            cmd.append("--dry-run")
        agents["github_listener"] = cmd

    if not args.no_monitor:
        agents["monitor"] = [sys.executable, "-m", "agents.bots.monitor_agent", "--interval", str(args.poll_interval)]

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

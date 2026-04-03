"""Look up users, debates, agents, and usage from the Consilium database (read-only).

Usage:
  python -m agents.tools.db_lookup user --email user@example.com
  python -m agents.tools.db_lookup user --id clkXXX
  python -m agents.tools.db_lookup debate --id SESSION_ID
  python -m agents.tools.db_lookup debates --user-email user@example.com [--limit 10]
  python -m agents.tools.db_lookup usage --user-email user@example.com [--days 30]
  python -m agents.tools.db_lookup stats
"""

import argparse
import json
import sys
from datetime import datetime, timedelta

from sqlalchemy import func

from agents.db import (
    DebateSession,
    User,
    UsageRecord,
    get_session,
    find_user_by_email,
    find_user_by_id,
)


def lookup_user(email=None, user_id=None):
    if not email and not user_id:
        raise ValueError("Provide --email or --id")
    user = find_user_by_email(email) if email else find_user_by_id(user_id)
    if not user:
        raise RuntimeError("User not found")

    with get_session() as s:
        debate_count = s.query(func.count(DebateSession.id)).filter(DebateSession.userId == user.id).scalar()
        total_cost = s.query(func.coalesce(func.sum(DebateSession.totalCost), 0)).filter(DebateSession.userId == user.id).scalar()

    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "tenantId": user.tenantId,
        "createdAt": user.createdAt,
        "debateCount": debate_count,
        "totalCostSpent": float(total_cost),
    }


def lookup_debate(debate_id):
    with get_session() as s:
        debate = s.query(DebateSession).filter(DebateSession.id == debate_id).first()
        if not debate:
            raise RuntimeError("Debate session not found")
        return {
            "id": debate.id,
            "userId": debate.userId,
            "topic": debate.topic,
            "status": debate.status,
            "mode": debate.mode,
            "modelsUsed": debate.modelsUsed,
            "totalCost": debate.totalCost,
            "estimatedCost": debate.estimatedCost,
            "goldenPrompt": debate.goldenPrompt,
            "debateSource": debate.debateSource,
            "createdAt": debate.createdAt,
            "updatedAt": debate.updatedAt,
        }


def list_user_debates(email, limit=10):
    user = find_user_by_email(email)
    if not user:
        raise RuntimeError("User not found")
    with get_session() as s:
        debates = (
            s.query(DebateSession)
            .filter(DebateSession.userId == user.id)
            .order_by(DebateSession.createdAt.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": d.id,
                "topic": d.topic,
                "status": d.status,
                "mode": d.mode,
                "totalCost": d.totalCost,
                "createdAt": d.createdAt,
            }
            for d in debates
        ]


def lookup_usage(email, days=30):
    user = find_user_by_email(email)
    if not user:
        raise RuntimeError("User not found")
    cutoff = datetime.utcnow() - timedelta(days=days)
    with get_session() as s:
        row = (
            s.query(
                func.coalesce(func.sum(UsageRecord.tokens), 0),
                func.coalesce(func.sum(UsageRecord.cost), 0),
                func.count(UsageRecord.id),
            )
            .filter(UsageRecord.tenantId == user.tenantId, UsageRecord.recordedAt >= cutoff)
            .first()
        )
        return {
            "tenantId": user.tenantId,
            "days": days,
            "totalTokens": int(row[0]),
            "totalCost": float(row[1]),
            "recordCount": row[2],
        }


def get_stats():
    with get_session() as s:
        total_users = s.query(func.count(User.id)).scalar()
        total_debates = s.query(func.count(DebateSession.id)).scalar()
        total_cost = s.query(func.coalesce(func.sum(DebateSession.totalCost), 0)).scalar()

        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        debates_today = s.query(func.count(DebateSession.id)).filter(DebateSession.createdAt >= today).scalar()

        week_ago = datetime.utcnow() - timedelta(days=7)
        active_users = (
            s.query(func.count(func.distinct(DebateSession.userId)))
            .filter(DebateSession.createdAt >= week_ago)
            .scalar()
        )

        return {
            "totalUsers": total_users,
            "totalDebates": total_debates,
            "totalCost": float(total_cost),
            "debatesToday": debates_today,
            "activeUsersLast7Days": active_users,
        }


def _output(data):
    print(json.dumps(data, indent=2, default=str))


def main():
    parser = argparse.ArgumentParser(description="Consilium DB lookup tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_user = sub.add_parser("user")
    p_user.add_argument("--email")
    p_user.add_argument("--id")

    p_debate = sub.add_parser("debate")
    p_debate.add_argument("--id", required=True)

    p_debates = sub.add_parser("debates")
    p_debates.add_argument("--user-email", required=True)
    p_debates.add_argument("--limit", type=int, default=10)

    p_usage = sub.add_parser("usage")
    p_usage.add_argument("--user-email", required=True)
    p_usage.add_argument("--days", type=int, default=30)

    sub.add_parser("stats")

    args = parser.parse_args()

    try:
        if args.command == "user":
            _output(lookup_user(email=args.email, user_id=args.id))
        elif args.command == "debate":
            _output(lookup_debate(args.id))
        elif args.command == "debates":
            _output(list_user_debates(args.user_email, args.limit))
        elif args.command == "usage":
            _output(lookup_usage(args.user_email, args.days))
        elif args.command == "stats":
            _output(get_stats())
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

"""Stripe subscription and billing management tool.

Usage:
  python -m agents.tools.stripe_api get-subscription --email user@example.com
  python -m agents.tools.stripe_api cancel --email user@example.com --reason "User requested"
  python -m agents.tools.stripe_api refund --email user@example.com --reason "User requested" [--dry-run]
  python -m agents.tools.stripe_api invoices --email user@example.com [--limit 5]
"""

import argparse
import json
import sys

import stripe

from agents.config import STRIPE_SECRET_KEY

stripe.api_key = STRIPE_SECRET_KEY


def _find_customer(email):
    customers = stripe.Customer.search(query=f'email:"{email}"')
    if not customers.data:
        raise RuntimeError(f"No Stripe customer found for {email}")
    return customers.data[0]


def get_subscription(email):
    customer = _find_customer(email)
    subs = stripe.Subscription.list(customer=customer.id, status="active", limit=1)
    if not subs.data:
        subs = stripe.Subscription.list(customer=customer.id, limit=1)
    if not subs.data:
        raise RuntimeError("No subscriptions found")

    sub = subs.data[0]
    plan = sub["items"]["data"][0]["plan"]
    discount = None
    if sub.get("discount"):
        d = sub["discount"]
        discount = {
            "coupon": d["coupon"]["id"],
            "percent_off": d["coupon"].get("percent_off"),
            "amount_off": d["coupon"].get("amount_off"),
        }

    return {
        "customer_id": customer.id,
        "subscription_id": sub.id,
        "status": sub.status,
        "plan": {
            "amount": plan["amount"],
            "currency": plan["currency"],
            "interval": plan["interval"],
        },
        "current_period_start": sub["current_period_start"],
        "current_period_end": sub["current_period_end"],
        "cancel_at_period_end": sub["cancel_at_period_end"],
        "discount": discount,
    }


def cancel_subscription(email, reason=None):
    customer = _find_customer(email)
    subs = stripe.Subscription.list(customer=customer.id, status="active", limit=1)
    if not subs.data:
        raise RuntimeError("No active subscription found")

    sub = subs.data[0]
    metadata = dict(sub.get("metadata", {}))
    if reason:
        metadata["cancel_reason"] = reason

    updated = stripe.Subscription.modify(
        sub.id,
        cancel_at_period_end=True,
        metadata=metadata,
    )

    return {
        "subscription_id": updated.id,
        "status": updated.status,
        "cancel_at_period_end": updated["cancel_at_period_end"],
        "current_period_end": updated["current_period_end"],
        "cancel_reason": reason,
    }


def process_refund(email, reason, dry_run=False):
    customer = _find_customer(email)
    invoices = stripe.Invoice.list(customer=customer.id, status="paid", limit=1)
    if not invoices.data:
        raise RuntimeError("No paid invoices found")

    invoice = invoices.data[0]
    charge_id = invoice.get("charge")
    if not charge_id:
        raise RuntimeError("No charge associated with latest invoice")

    amount = invoice["amount_paid"]

    if dry_run:
        return {
            "dry_run": True,
            "invoice_id": invoice.id,
            "charge_id": charge_id,
            "refund_amount": amount,
            "currency": invoice["currency"],
        }

    refund = stripe.Refund.create(
        charge=charge_id,
        amount=amount,
        reason="requested_by_customer",
        metadata={"reason": reason, "email": email},
    )

    return {
        "refund_id": refund.id,
        "amount": refund.amount,
        "status": refund.status,
        "currency": refund.currency,
    }


def list_invoices(email, limit=5):
    customer = _find_customer(email)
    invoices = stripe.Invoice.list(customer=customer.id, limit=limit)
    return [
        {
            "id": inv.id,
            "number": inv.number,
            "amount_paid": inv["amount_paid"],
            "status": inv.status,
            "period_start": inv["period_start"],
            "period_end": inv["period_end"],
            "hosted_invoice_url": inv.get("hosted_invoice_url"),
        }
        for inv in invoices.data
    ]


def _output(data):
    print(json.dumps(data, indent=2, default=str))


def main():
    parser = argparse.ArgumentParser(description="Stripe billing tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_get = sub.add_parser("get-subscription")
    p_get.add_argument("--email", required=True)

    p_cancel = sub.add_parser("cancel")
    p_cancel.add_argument("--email", required=True)
    p_cancel.add_argument("--reason")

    p_refund = sub.add_parser("refund")
    p_refund.add_argument("--email", required=True)
    p_refund.add_argument("--reason", required=True)
    p_refund.add_argument("--dry-run", action="store_true")

    p_inv = sub.add_parser("invoices")
    p_inv.add_argument("--email", required=True)
    p_inv.add_argument("--limit", type=int, default=5)

    args = parser.parse_args()

    try:
        if args.command == "get-subscription":
            _output(get_subscription(args.email))
        elif args.command == "cancel":
            _output(cancel_subscription(args.email, args.reason))
        elif args.command == "refund":
            _output(process_refund(args.email, args.reason, args.dry_run))
        elif args.command == "invoices":
            _output(list_invoices(args.email, args.limit))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

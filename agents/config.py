import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]

SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")
SLACK_APP_TOKEN = os.getenv("SLACK_APP_TOKEN")
SLACK_NOTIFICATION_CHANNEL = os.getenv("SLACK_NOTIFICATION_CHANNEL")
SLACK_ESCALATION_CHANNEL = os.getenv("SLACK_ESCALATION_CHANNEL")

LINEAR_API_KEY = os.getenv("LINEAR_API_KEY")
LINEAR_API_URL = os.getenv("LINEAR_API_URL", "https://api.linear.app/graphql")
LINEAR_TEAM_ID = os.getenv("LINEAR_TEAM_ID")

GMAIL_CREDENTIALS_PATH = os.getenv("GMAIL_CREDENTIALS_PATH")
GMAIL_TOKENS_DIR = os.getenv("GMAIL_TOKENS_DIR")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "support@myconsilium.xyz")

CONSILIUM_SUPPORT_EMAIL = os.getenv("CONSILIUM_SUPPORT_EMAIL", "support@myconsilium.xyz")

SENTRY_DSN = os.getenv("SENTRY_DSN")

DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "sonnet")

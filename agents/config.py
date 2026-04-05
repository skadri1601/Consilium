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

IMAP_HOST = os.getenv("IMAP_HOST")
IMAP_USER = os.getenv("IMAP_USER")
IMAP_PASSWORD = os.getenv("IMAP_PASSWORD")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_REPO = os.getenv("GITHUB_REPO")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "support@myconsilium.xyz")

CONSILIUM_SUPPORT_EMAIL = os.getenv("CONSILIUM_SUPPORT_EMAIL", "support@myconsilium.xyz")
CONSILIUM_ADMIN_EMAIL = os.getenv("CONSILIUM_ADMIN_EMAIL", "")

SENTRY_DSN = os.getenv("SENTRY_DSN")
SENTRY_AUTH_TOKEN = os.getenv("SENTRY_AUTH_TOKEN")
SENTRY_ORG = os.getenv("SENTRY_ORG", "consilium-pi")
SENTRY_PROJECT = os.getenv("SENTRY_PROJECT", "javascript-nextjs")

SONARQUBE_URL = os.getenv("SONARQUBE_URL")
SONARQUBE_TOKEN = os.getenv("SONARQUBE_TOKEN")
SONARQUBE_PROJECT_KEY = os.getenv("SONARQUBE_PROJECT_KEY")

VERCEL_TOKEN = os.getenv("VERCEL_TOKEN")
VERCEL_PROJECT_ID = os.getenv("VERCEL_PROJECT_ID")
VERCEL_TEAM_ID = os.getenv("VERCEL_TEAM_ID")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

_ALLOWED_MODELS = {"haiku", "sonnet"}
_raw_model = os.getenv("DEFAULT_MODEL", "haiku").lower()
DEFAULT_MODEL = _raw_model if _raw_model in _ALLOWED_MODELS else "haiku"

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]

GMAIL_CREDENTIALS_PATH = os.getenv("GMAIL_CREDENTIALS_PATH")
GMAIL_TOKENS_DIR = os.getenv("GMAIL_TOKENS_DIR")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "support@myconsilium.xyz")

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

REDIS_URL = os.getenv("REDIS_URL")

_ALLOWED_MODELS = {"haiku", "sonnet"}
_raw_model = os.getenv("DEFAULT_MODEL", "haiku").lower()
DEFAULT_MODEL = _raw_model if _raw_model in _ALLOWED_MODELS else "haiku"

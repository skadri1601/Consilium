import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  integrations: [
    Sentry.prismaIntegration(),
  ],
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error instanceof Error) {
      if (error.message.includes('NEXT_NOT_FOUND')) return null;
      if (error.message.includes('NEXT_REDIRECT')) return null;
    }
    return event;
  },
});

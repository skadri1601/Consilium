import * as Sentry from '@sentry/nextjs';

export function setSentryUserContext(user: {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  tier?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
    username: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
  });
  Sentry.setTag('subscription_tier', user.tier ?? 'FREE');
}

export function setDebateContext(debateId: string, mode?: string, models?: string[]) {
  Sentry.setContext('debate', {
    debateId,
    mode,
    models: models?.join(', '),
  });
}

export function clearSentryContext() {
  Sentry.setUser(null);
}

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG = 'consilium-pi';
const PROJECTS = ['javascript-nextjs', 'nestjs', 'python-fastapi'];

async function createAlertRule(projectSlug: string, notifyEmail: string) {
  const response = await fetch(
    `https://sentry.io/api/0/projects/${SENTRY_ORG}/${projectSlug}/alert-rules/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `New Error Alert - ${projectSlug}`,
        environment: 'production',
        dataset: 'events',
        query: 'level:error',
        aggregate: 'count()',
        timeWindow: 1,
        thresholdType: 0,
        resolveThreshold: null,
        triggers: [
          {
            label: 'critical',
            alertThreshold: 1,
            actions: [
              {
                type: 'email',
                targetType: 'user',
                targetIdentifier: notifyEmail,
              },
            ],
          },
        ],
        projects: [projectSlug],
        owner: null,
        comparisonDelta: null,
      }),
    }
  );

  const data = await response.json();
  console.log(`Alert created for ${projectSlug}:`, response.status, data.id ?? data);
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node scripts/setup-sentry-alerts.ts your@email.com');
    process.exit(1);
  }

  if (!SENTRY_AUTH_TOKEN) {
    console.error('SENTRY_AUTH_TOKEN env var is required');
    process.exit(1);
  }

  for (const project of PROJECTS) {
    await createAlertRule(project, email);
  }
}

main().catch(console.error);

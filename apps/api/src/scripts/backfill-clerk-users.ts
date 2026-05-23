import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@consilium/database";
import { PrismaPg } from "@prisma/adapter-pg";

interface BackfillStats {
  total: number;
  alreadySynced: number;
  created: number;
  skipped: number;
  failed: number;
}

interface BackfillOptions {
  dryRun: boolean;
  limit: number;
}

type Clerk = ReturnType<typeof createClerkClient>;
type ClerkUser = Awaited<ReturnType<Clerk["users"]["getUser"]>>;

const PAGE = 100;

function parseArgs(): BackfillOptions {
  const dryRun = process.argv.includes("--dry-run");
  const limitFlag = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitFlag
    ? Number.parseInt(limitFlag.split("=")[1] ?? "0", 10)
    : 0;
  return { dryRun, limit };
}

async function syncOneUser(
  prisma: PrismaClient,
  user: ClerkUser,
  options: BackfillOptions,
  stats: BackfillStats,
): Promise<void> {
  const email = user.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    console.warn(`skip ${user.id}: no email`);
    stats.skipped++;
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true },
  });
  if (existing) {
    stats.alreadySynced++;
    return;
  }

  if (options.dryRun) {
    console.log(`would create: ${user.id} ${email}`);
    stats.created++;
    return;
  }

  try {
    await prisma.user.upsert({
      where: { clerkId: user.id },
      create: {
        clerkId: user.id,
        email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        imageUrl: user.imageUrl ?? undefined,
        tenantId: user.id,
      },
      update: {},
    });
    console.log(`created: ${user.id} ${email}`);
    stats.created++;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`FAILED ${user.id} ${email}: ${reason}`);
    stats.failed++;
  }
}

async function processPage(
  prisma: PrismaClient,
  users: ClerkUser[],
  options: BackfillOptions,
  stats: BackfillStats,
): Promise<boolean> {
  for (const u of users) {
    if (options.limit > 0 && stats.total >= options.limit) return true;
    stats.total++;
    await syncOneUser(prisma, u, options, stats);
  }
  return false;
}

async function backfill(
  clerk: Clerk,
  prisma: PrismaClient,
  options: BackfillOptions,
): Promise<BackfillStats> {
  const stats: BackfillStats = {
    total: 0,
    alreadySynced: 0,
    created: 0,
    skipped: 0,
    failed: 0,
  };

  let offset = 0;
  while (true) {
    const page = await clerk.users.getUserList({
      limit: PAGE,
      offset,
      orderBy: "+created_at",
    });
    const users = page.data;
    if (users.length === 0) break;

    const limitReached = await processPage(prisma, users, options, stats);
    if (limitReached) break;
    if (users.length < PAGE) break;
    offset += PAGE;
  }

  return stats;
}

function printStats(stats: BackfillStats): void {
  console.log("\nBackfill complete:");
  console.log(`  total scanned : ${stats.total}`);
  console.log(`  already synced: ${stats.alreadySynced}`);
  console.log(`  created       : ${stats.created}`);
  console.log(`  skipped       : ${stats.skipped}`);
  console.log(`  failed        : ${stats.failed}`);
}

async function main(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is required");
    process.exit(1);
  }

  const options = parseArgs();
  const limitSuffix = options.limit ? `, limit=${options.limit}` : "";
  console.log(`Backfill starting (dry-run=${options.dryRun}${limitSuffix})…`);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  let stats: BackfillStats;
  try {
    stats = await backfill(clerk, prisma, options);
  } finally {
    await prisma.$disconnect();
  }

  printStats(stats);
  if (stats.failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

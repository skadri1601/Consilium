/* eslint-disable no-console */
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { PrismaClient } from "@consilium/database";

interface BackfillStats {
  total: number;
  alreadySynced: number;
  created: number;
  skipped: number;
  failed: number;
}

async function main(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is required");
    process.exit(1);
  }

  const dryRun = process.argv.includes("--dry-run");
  const limitFlag = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitFlag ? parseInt(limitFlag.split("=")[1] ?? "0", 10) : 0;

  const clerk = createClerkClient({ secretKey });
  const prisma = new PrismaClient();

  const stats: BackfillStats = {
    total: 0,
    alreadySynced: 0,
    created: 0,
    skipped: 0,
    failed: 0,
  };

  console.log(
    `Backfill starting (dry-run=${dryRun}${limit ? `, limit=${limit}` : ""})…`,
  );

  let offset = 0;
  const PAGE = 100;

  try {
    while (true) {
      const page = await clerk.users.getUserList({
        limit: PAGE,
        offset,
        orderBy: "+created_at",
      });

      const users = page.data;
      if (users.length === 0) break;

      for (const u of users) {
        if (limit > 0 && stats.total >= limit) break;
        stats.total++;

        const email = u.emailAddresses?.[0]?.emailAddress;
        if (!email) {
          console.warn(`skip ${u.id}: no email`);
          stats.skipped++;
          continue;
        }

        const existing = await prisma.user.findUnique({
          where: { clerkId: u.id },
          select: { id: true },
        });
        if (existing) {
          stats.alreadySynced++;
          continue;
        }

        if (dryRun) {
          console.log(`would create: ${u.id} ${email}`);
          stats.created++;
          continue;
        }

        try {
          await prisma.user.upsert({
            where: { clerkId: u.id },
            create: {
              clerkId: u.id,
              email,
              firstName: u.firstName ?? undefined,
              lastName: u.lastName ?? undefined,
              imageUrl: u.imageUrl ?? undefined,
              tenantId: u.id,
            },
            update: {},
          });
          console.log(`created: ${u.id} ${email}`);
          stats.created++;
        } catch (err) {
          console.error(
            `FAILED ${u.id} ${email}: ${err instanceof Error ? err.message : String(err)}`,
          );
          stats.failed++;
        }
      }

      if (limit > 0 && stats.total >= limit) break;
      if (users.length < PAGE) break;
      offset += PAGE;
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nBackfill complete:");
  console.log(`  total scanned : ${stats.total}`);
  console.log(`  already synced: ${stats.alreadySynced}`);
  console.log(`  created       : ${stats.created}`);
  console.log(`  skipped       : ${stats.skipped}`);
  console.log(`  failed        : ${stats.failed}`);
  if (stats.failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

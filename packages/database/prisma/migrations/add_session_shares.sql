-- Create SessionShare table for backend-hosted share links
CREATE TABLE IF NOT EXISTS "SessionShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionShare_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "SessionShare_token_key" ON "SessionShare"("token");
CREATE INDEX IF NOT EXISTS "SessionShare_sessionId_idx" ON "SessionShare"("sessionId");
CREATE INDEX IF NOT EXISTS "SessionShare_userId_idx" ON "SessionShare"("userId");
CREATE INDEX IF NOT EXISTS "SessionShare_token_idx" ON "SessionShare"("token");

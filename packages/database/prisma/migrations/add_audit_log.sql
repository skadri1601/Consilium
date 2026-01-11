-- Create AuthLog table for audit logging
CREATE TABLE IF NOT EXISTS "AuthLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "AuthLog_userId_idx" ON "AuthLog"("userId");
CREATE INDEX IF NOT EXISTS "AuthLog_event_idx" ON "AuthLog"("event");
CREATE INDEX IF NOT EXISTS "AuthLog_createdAt_idx" ON "AuthLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuthLog_severity_idx" ON "AuthLog"("severity");


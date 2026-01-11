-- Add Groq API key column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "groqKey" TEXT;

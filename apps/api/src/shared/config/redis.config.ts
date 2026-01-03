import { registerAs } from "@nestjs/config";

export const redisConfig = registerAs("redis", () => ({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
}));

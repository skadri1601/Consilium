import { registerAs } from "@nestjs/config";

const truthy = (v: string | undefined) =>
  (v || "").toLowerCase() === "true" || v === "1";

export const appConfig = registerAs("app", () => {
  const apiDebug = truthy(process.env.API_DEBUG);
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3001", 10),
    apiPrefix: process.env.API_PREFIX || "api",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    debateUseQueue: truthy(process.env.DEBATE_USE_QUEUE),
    apiDebug,
    logLevel:
      process.env.LOG_LEVEL?.toLowerCase() || (apiDebug ? "debug" : "info"),
  };
});

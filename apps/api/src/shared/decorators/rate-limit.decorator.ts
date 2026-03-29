import { SetMetadata } from "@nestjs/common";
import { RATE_LIMIT_KEY } from "../guards/rate-limit.guard";

export const RateLimit = (limit: number, window: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, window });

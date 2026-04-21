import { auth } from "@clerk/nextjs/server";

const IS_PROD = process.env.NODE_ENV === "production";
// E2E bypass flag. Server-only: NEXT_PUBLIC_* variants are intentionally
// not accepted, since they're shipped to the browser and settable by clients.
const IS_TEST_MODE = !IS_PROD && process.env.PLAYWRIGHT_TEST === "true";

export async function getAuthContext(): Promise<{
  userId: string | null;
  token: string | null;
  error?: unknown;
}> {
  try {
    const { userId, getToken } = await auth();
    const token = getToken ? await getToken() : null;
    return { userId: userId ?? null, token };
  } catch (error) {
    return { userId: null, token: null, error };
  }
}

export function shouldBypassAuth(authError?: unknown): boolean {
  if (IS_TEST_MODE) {
    return true;
  }

  if (process.env.NODE_ENV === "development") {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    const hasPlaceholder = (value?: string) => !value || value.includes("...");
    const hasValidKeys =
      !hasPlaceholder(publishableKey) && !hasPlaceholder(secretKey);

    if (!hasValidKeys) return true;
  }

  if (IS_PROD) {
    return false;
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const hasPlaceholder = (value?: string) => !value || value.includes("...");
  const hasValidKeys =
    !hasPlaceholder(publishableKey) && !hasPlaceholder(secretKey);

  if (!hasValidKeys && authError) {
    console.warn(
      "[auth] Clerk keys not configured; bypassing auth for local dev.",
    );
  }

  return !hasValidKeys;
}

export function isFetchError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.name === "TypeError" ||
        error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED")))
  );
}

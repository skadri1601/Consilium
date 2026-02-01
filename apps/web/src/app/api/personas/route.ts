import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const IS_TEST_MODE =
  process.env.PLAYWRIGHT_TEST === "true" ||
  process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === "true";
const IS_PROD = process.env.NODE_ENV === "production";

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      if (shouldBypassAuth(authContext.error)) {
        return NextResponse.json([]);
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/v1/personas`, {
      headers: {
        Authorization: `Bearer ${authContext.token}`,
      },
    });

    if (!response.ok) {
      if (response.status >= 500) {
        console.warn("[GET /api/personas] Backend unavailable, returning empty list.");
        return NextResponse.json([]);
      }

      const errorText = await response.text();
      console.error("[GET /api/personas] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch personas" },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn("[GET /api/personas] Backend not reachable, returning empty list.");
      return NextResponse.json([]);
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[GET /api/personas] Unexpected error:", errorMessage, error);

    return NextResponse.json(
      { error: "Failed to fetch personas", message: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      if (shouldBypassAuth(authContext.error)) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Authentication is disabled in test mode" },
          { status: 401 }
        );
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/personas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authContext.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[POST /api/personas] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to create persona" },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn("[POST /api/personas] Backend not reachable.");
      return NextResponse.json(
        { error: "Service Unavailable", message: "Backend is not reachable" },
        { status: 503 }
      );
    }
    
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[POST /api/personas] Unexpected error:", errorMessage, error);

    return NextResponse.json(
      { error: "Failed to create persona", message: errorMessage },
      { status: 500 }
    );
  }
}

async function getAuthContext(): Promise<{
  userId: string | null;
  token: string;
  error?: unknown;
}> {
  try {
    const { userId, getToken } = await auth();
    const token = getToken ? await getToken() : "";
    return { userId: userId ?? null, token };
  } catch (error) {
    return { userId: null, token: "", error };
  }
}

function shouldBypassAuth(authError?: unknown) {
  if (IS_TEST_MODE) {
    return true;
  }

  // Allow bypass in dev if keys are missing
  if (process.env.NODE_ENV === "development") {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    const hasPlaceholder = (value?: string) => !value || value.includes("...");
    const hasValidKeys = !hasPlaceholder(publishableKey) && !hasPlaceholder(secretKey);
    
    if (!hasValidKeys) return true;
  }

  if (IS_PROD) {
    return false;
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const hasPlaceholder = (value?: string) => !value || value.includes("...");
  const hasValidKeys = !hasPlaceholder(publishableKey) && !hasPlaceholder(secretKey);

  if (!hasValidKeys && authError) {
    console.warn("[auth] Clerk keys not configured; bypassing auth for local dev.");
  }

  return !hasValidKeys;
}

function isFetchError(error: unknown) {
  return (
    error instanceof TypeError || 
    (error instanceof Error && (
      error.name === 'TypeError' || 
      error.message.includes('fetch failed') ||
      error.message.includes('ECONNREFUSED')
    ))
  );
}


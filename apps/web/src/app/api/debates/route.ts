import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const IS_TEST_MODE =
  process.env.PLAYWRIGHT_TEST === "true" ||
  process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === "true";
const IS_PROD = process.env.NODE_ENV === "production";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      if (shouldBypassAuth(authContext.error)) {
        return NextResponse.json([]);
      }

      return NextResponse.json(
        { error: "Unauthorized", message: "User not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    const response = await fetch(
      `${API_URL}/api/v1/debates?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${authContext.token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status >= 500) {
        console.warn(`[GET /api/debates] Backend returned ${response.status}, returning empty list (graceful degradation).`);
        return NextResponse.json([]);
      }

      // Try to get error details from backend
      let errorMessage = "Failed to fetch debates";
      let errorData: any = { error: errorMessage };
      
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = errorText;
            errorData = { error: errorMessage };
          }
        }
      } catch (parseError) {
        console.error("[GET /api/debates] Failed to parse error response:", parseError);
      }

      console.error(
        `[GET /api/debates] Backend returned ${response.status}:`,
        errorMessage
      );

      return NextResponse.json(errorData, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    // Check for fetch/network errors (connection refused, etc.)
    if (isFetchError(error)) {
      console.warn("[GET /api/debates] Backend not reachable (fetch error), returning empty list.");
      return NextResponse.json([]);
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[GET /api/debates] Unexpected error:", errorMessage, error);
    
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: errorMessage,
      },
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

      return NextResponse.json(
        { error: "Unauthorized", message: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const response = await fetch(`${API_URL}/api/v1/debates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authContext.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Try to get detailed error from backend
      let errorMessage = "Failed to create debate";
      let errorData: any = { error: errorMessage };
      
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = errorText;
            errorData = { error: errorMessage };
          }
        }
      } catch (parseError) {
        console.error("[POST /api/debates] Failed to parse error response:", parseError);
      }

      console.error(
        `[POST /api/debates] Backend returned ${response.status}:`,
        errorMessage
      );

      return NextResponse.json(errorData, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn("[POST /api/debates] Backend not reachable.");
      return NextResponse.json(
        { error: "Service Unavailable", message: "Backend is not reachable" },
        { status: 503 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[POST /api/debates] Unexpected error:", errorMessage, error);
    
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

async function getAuthContext(): Promise<{
  userId: string | null;
  token: string | null;
  error?: unknown;
}> {
  try {
    const { userId, getToken } = await auth();
    const token = getToken ? await getToken() : null;
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


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const IS_TEST_MODE =
  process.env.PLAYWRIGHT_TEST === "true" ||
  process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === "true";
const IS_PROD = process.env.NODE_ENV === "production";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const response = await fetch(`${API_URL}/api/v1/personas/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authContext.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[PUT /api/personas/:id] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to update persona" },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (!IS_PROD && isFetchError(error)) {
      console.warn("[PUT /api/personas/:id] Backend not reachable.");
      return NextResponse.json(
        { error: "Service Unavailable", message: "Backend is not reachable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update persona" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const response = await fetch(`${API_URL}/api/v1/personas/${params.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authContext.token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DELETE /api/personas/:id] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to delete persona" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (!IS_PROD && isFetchError(error)) {
      console.warn("[DELETE /api/personas/:id] Backend not reachable.");
      return NextResponse.json(
        { error: "Service Unavailable", message: "Backend is not reachable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete persona" },
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
  return error instanceof TypeError;
}


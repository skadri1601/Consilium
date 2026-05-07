import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  shouldBypassAuth,
  isFetchError,
} from "@/lib/api/auth-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      if (shouldBypassAuth(authContext.error)) {
        return NextResponse.json({
          valid: false,
          message: "Authentication is disabled in test mode.",
        });
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/api-keys/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authContext.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status >= 500) {
        console.warn("[POST /api/api-keys/test] Backend unavailable.");
        return NextResponse.json({
          valid: false,
          message: "Backend is not reachable.",
        });
      }

      const errorText = await response.text();
      console.error(
        "[POST /api/api-keys/test] Backend error:",
        response.status,
        errorText,
      );
      return NextResponse.json(
        { valid: false, message: "Failed to test API key" },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn("[POST /api/api-keys/test] Backend not reachable.");
      return NextResponse.json({
        valid: false,
        message: "Backend is not reachable.",
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(
      "[POST /api/api-keys/test] Unexpected error:",
      errorMessage,
      error,
    );

    return NextResponse.json(
      { error: "Failed to test API key", message: errorMessage },
      { status: 500 },
    );
  }
}

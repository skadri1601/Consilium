import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, shouldBypassAuth, isFetchError } from "@/lib/api/auth-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

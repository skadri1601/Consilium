import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  shouldBypassAuth,
  isFetchError,
} from "@/lib/api/auth-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      if (shouldBypassAuth(authContext.error)) {
        return NextResponse.json([]);
      }

      return NextResponse.json(
        { error: "Unauthorized", message: "User not authenticated" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";
    const search = searchParams.get("search") || "";

    const queryParams = new URLSearchParams({ limit, offset });
    if (search) {
      queryParams.set("search", search);
    }

    const response = await fetch(
      `${API_URL}/api/v1/debates?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${authContext.token}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status >= 500) {
        console.warn(
          `[GET /api/debates] Backend returned ${response.status}, returning empty list (graceful degradation).`,
        );
        return NextResponse.json([]);
      }

      let errorMessage = "Failed to fetch debates";
      let errorData: Record<string, string> = { error: errorMessage };

      const errorText = await response.text().catch(() => "");
      if (errorText) {
        try {
          errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText;
          errorData = { error: errorMessage };
        }
      }

      console.error(
        `[GET /api/debates] Backend returned ${response.status}:`,
        errorMessage,
      );

      return NextResponse.json(errorData, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn(
        "[GET /api/debates] Backend not reachable (fetch error), returning empty list.",
      );
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
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      if (!shouldBypassAuth(authContext.error)) {
        return NextResponse.json(
          { error: "Unauthorized", message: "User not authenticated" },
          { status: 401 },
        );
      }
    }

    const body = await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authContext.token) {
      headers["Authorization"] = `Bearer ${authContext.token}`;
    }

    const response = await fetch(`${API_URL}/api/v1/debates`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = "Failed to create debate";
      let errorData: Record<string, string> = { error: errorMessage };

      const errorText = await response.text().catch(() => "");
      if (errorText) {
        try {
          errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText;
          errorData = { error: errorMessage };
        }
      }

      console.error(
        `[POST /api/debates] Backend returned ${response.status}:`,
        errorMessage,
      );

      return NextResponse.json(errorData, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn("[POST /api/debates] Backend not reachable.");
      return NextResponse.json(
        { error: "Service Unavailable", message: "Backend is not reachable" },
        { status: 503 },
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
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getAuthContext, shouldBypassAuth, isFetchError } from "@/lib/api/auth-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      if (shouldBypassAuth(authContext.error)) {
        return NextResponse.json({
          totalDebates: 0,
          totalCost: 0,
          debatesThisMonth: 0,
          costThisMonth: 0,
          debatesByDay: [],
          modelUsage: [],
          debatesBySource: [],
          cliDebateCount: 0,
        });
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/v1/analytics`, {
      headers: {
        Authorization: `Bearer ${authContext.token}`,
      },
    });

    if (!response.ok) {
      if (response.status >= 500) {
        console.warn("[GET /api/analytics] Backend unavailable, returning empty stats.");
        return NextResponse.json({
          totalDebates: 0,
          totalCost: 0,
          debatesThisMonth: 0,
          costThisMonth: 0,
          debatesByDay: [],
          modelUsage: [],
          debatesBySource: [],
          cliDebateCount: 0,
        });
      }

      const errorText = await response.text();
      console.error("[GET /api/analytics] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn("[GET /api/analytics] Backend not reachable, returning empty stats.");
      return NextResponse.json({
        totalDebates: 0,
        totalCost: 0,
        debatesThisMonth: 0,
        costThisMonth: 0,
        debatesByDay: [],
        modelUsage: [],
        debatesBySource: [],
        cliDebateCount: 0,
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[GET /api/analytics] Unexpected error:", errorMessage, error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", message: errorMessage },
      { status: 500 }
    );
  }
}

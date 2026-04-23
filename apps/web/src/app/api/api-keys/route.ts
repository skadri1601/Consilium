import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, isFetchError } from "@/lib/api/auth-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET() {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/v1/api-keys`, {
      headers: {
        Authorization: `Bearer ${authContext.token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 503 || response.status >= 500) {
        console.warn(`Backend unavailable (${response.status}).`);
        return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
      }
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          openaiKey: null,
          anthropicKey: null,
          googleKey: null,
          groqKey: null,
        });
      }
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn("Backend API not reachable.");
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/api-keys`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authContext.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (isFetchError(error)) {
      console.warn("Backend API not reachable during PUT");
      return NextResponse.json(
        { error: "Backend is not reachable" },
        { status: 503 }
      );
    }
    console.error("Error updating API keys:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update API keys";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

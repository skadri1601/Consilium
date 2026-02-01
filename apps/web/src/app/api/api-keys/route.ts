import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getClerkToken();
    const response = await fetch(`${API_URL}/api/v1/api-keys`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // If backend is unavailable or returns error, return empty keys instead of 500
      // This allows the frontend to still render
      if (response.status === 503 || response.status >= 500) {
        console.warn(`Backend unavailable (${response.status}), returning empty keys`);
        return NextResponse.json({
          openaiKey: null,
          anthropicKey: null,
          googleKey: null,
          groqKey: null,
        });
      }
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      // For auth errors, return empty keys instead of error
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
    // If fetch fails (network error, backend down), return empty keys
    if (isFetchError(error)) {
      console.warn("Backend API not reachable, returning empty keys");
      return NextResponse.json({
        openaiKey: null,
        anthropicKey: null,
        googleKey: null,
        groqKey: null,
      });
    }
    console.error("Error fetching API keys:", error);
    // Return empty keys instead of error to allow UI to render
    return NextResponse.json({
      openaiKey: null,
      anthropicKey: null,
      googleKey: null,
      groqKey: null,
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/api-keys`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getClerkToken()}`,
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

async function getClerkToken(): Promise<string> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    return ""; // Will be handled by backend auth
  }
  return token;
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

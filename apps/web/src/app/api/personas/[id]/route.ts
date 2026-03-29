import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, shouldBypassAuth, isFetchError } from "@/lib/api/auth-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/personas/${id}`, {
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
    if (isFetchError(error)) {
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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const response = await fetch(`${API_URL}/api/v1/personas/${id}`, {
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
    if (isFetchError(error)) {
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

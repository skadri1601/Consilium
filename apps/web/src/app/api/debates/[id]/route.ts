import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/api/auth-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const response = await fetch(`${API_URL}/api/v1/debates/${id}`, {
      headers: {
        Authorization: `Bearer ${authContext.token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: errorText || "Failed to fetch debate" },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch debate" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const response = await fetch(`${API_URL}/api/v1/debates/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authContext.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: errorText || "Failed to update debate" },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { error: "Failed to update debate" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.userId || !authContext.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const response = await fetch(`${API_URL}/api/v1/debates/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authContext.token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: errorText || "Failed to delete debate" },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { error: "Failed to delete debate" },
      { status: 500 },
    );
  }
}

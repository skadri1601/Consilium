import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getClerkToken();
    const response = await fetch(`${API_URL}/api/v1/debates/${params.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch debate");
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch debate" },
      { status: 500 }
    );
  }
}

async function getClerkToken(): Promise<string> {
  const { getToken } = await auth();
  const token = await getToken();
  return token || "";
}


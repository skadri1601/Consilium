import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_URL}/api/api-keys/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getClerkToken()}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to test API key");
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to test API key" },
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


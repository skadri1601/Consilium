import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getToken } = await auth();
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "No session token" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/v1/api-keys/cli-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let message = errorText || "Failed to generate CLI token";
      try {
        const errJson = JSON.parse(errorText) as { message?: string; error?: string };
        message = errJson.message ?? errJson.error ?? message;
      } catch {
        // use raw errorText
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "Unauthorized. Sign in again." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: message },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { token: string };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating CLI token:", error);
    return NextResponse.json(
      { error: "Failed to generate CLI token" },
      { status: 500 }
    );
  }
}

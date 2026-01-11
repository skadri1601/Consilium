import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    const token = await getClerkToken();
    
    // Validate token before making backend request
    if (!token || token.trim() === "") {
      console.error("[GET /api/debates] Token is empty or missing");
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication token is missing" },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_URL}/api/v1/debates?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      // Try to get error details from backend
      let errorMessage = "Failed to fetch debates";
      let errorData: any = { error: errorMessage };
      
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = errorText;
            errorData = { error: errorMessage };
          }
        }
      } catch (parseError) {
        console.error("[GET /api/debates] Failed to parse error response:", parseError);
      }

      console.error(
        `[GET /api/debates] Backend returned ${response.status}:`,
        errorMessage
      );

      return NextResponse.json(errorData, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[GET /api/debates] Unexpected error:", errorMessage, error);
    
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const token = await getClerkToken();
    
    // Validate token before making backend request
    if (!token || token.trim() === "") {
      console.error("[POST /api/debates] Token is empty or missing");
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication token is missing" },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${API_URL}/api/v1/debates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Try to get detailed error from backend
      let errorMessage = "Failed to create debate";
      let errorData: any = { error: errorMessage };
      
      try {
        const errorText = await response.text();
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = errorText;
            errorData = { error: errorMessage };
          }
        }
      } catch (parseError) {
        console.error("[POST /api/debates] Failed to parse error response:", parseError);
      }

      console.error(
        `[POST /api/debates] Backend returned ${response.status}:`,
        errorMessage
      );

      return NextResponse.json(errorData, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("[POST /api/debates] Unexpected error:", errorMessage, error);
    
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

async function getClerkToken(): Promise<string> {
  try {
    const { getToken } = await auth();
    if (!getToken) {
      console.error("[getClerkToken] getToken function is not available");
      return "";
    }
    
    const token = await getToken();
    if (!token) {
      console.error("[getClerkToken] Token is null or undefined");
      return "";
    }
    
    return token;
  } catch (error) {
    console.error("[getClerkToken] Error retrieving token:", error);
    return "";
  }
}


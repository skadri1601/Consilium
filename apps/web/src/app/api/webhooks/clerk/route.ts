import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ClerkUserData {
  id: string;
  email_addresses: Array<{ email_address: string; id: string }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

async function syncUserToBackend(
  action: "create" | "update" | "delete",
  userData: ClerkUserData
) {
  const primaryEmail = userData.email_addresses?.[0]?.email_address;

  try {
    const response = await fetch(`${API_URL}/api/v1/webhooks/clerk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.INTERNAL_WEBHOOK_SECRET || "",
      },
      body: JSON.stringify({
        action,
        clerkId: userData.id,
        email: primaryEmail,
        firstName: userData.first_name,
        lastName: userData.last_name,
        imageUrl: userData.image_url,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to sync user to backend: ${response.status} - ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error syncing user to backend:", error);
    return false;
  }
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the headers
  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the webhook event
  const eventType = evt.type;

  console.log(`Received Clerk webhook: ${eventType}`);

  switch (eventType) {
    case "user.created": {
      const userData = evt.data as ClerkUserData;
      console.log(`User created: ${userData.id}`);
      
      const success = await syncUserToBackend("create", userData);
      if (!success) {
        // Return 500 to trigger retry
        return NextResponse.json(
          { error: "Failed to sync user" },
          { status: 500 }
        );
      }

      // Set default preferences on the new user's Clerk profile
      // so they're available on any device from the start
      try {
        const client = await clerkClient();
        await client.users.updateUser(userData.id, {
          unsafeMetadata: {
            defaultAgents: ["gpt-4o-mini", "claude-3-5-haiku-latest", "gemini-2.0-flash"],
            defaultMode: "visible",
          },
        });
        console.log(`Set default preferences for user: ${userData.id}`);
      } catch (metadataError) {
        // Non-fatal: preferences will fall back to defaults on the client
        console.error("Failed to set default user metadata:", metadataError);
      }

      break;
    }

    case "user.updated": {
      const userData = evt.data as ClerkUserData;
      console.log(`User updated: ${userData.id}`);
      
      const success = await syncUserToBackend("update", userData);
      if (!success) {
        return NextResponse.json(
          { error: "Failed to sync user" },
          { status: 500 }
        );
      }
      break;
    }

    case "user.deleted": {
      const userData = evt.data as { id: string };
      console.log(`User deleted: ${userData.id}`);

      const success = await syncUserToBackend("delete", userData as any);
      if (!success) {
        return NextResponse.json(
          { error: "Failed to delete user" },
          { status: 500 }
        );
      }
      break;
    }

    case "session.created": {
      console.log(`Session created for user: ${evt.data.user_id}`);
      // Session tracking is handled by the backend on authentication
      break;
    }

    case "session.ended":
    case "session.revoked": {
      console.log(`Session ended/revoked for user: ${evt.data.user_id}`);
      // Trigger session cleanup in backend
      try {
        await fetch(`${API_URL}/api/v1/webhooks/clerk/session-ended`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Secret": process.env.INTERNAL_WEBHOOK_SECRET || "",
          },
          body: JSON.stringify({
            userId: evt.data.user_id,
            sessionId: evt.data.id,
          }),
        });
      } catch (error) {
        console.error("Failed to notify backend of session end:", error);
      }
      break;
    }

    default:
      console.log(`Unhandled Clerk webhook event: ${eventType}`);
  }

  return NextResponse.json({ received: true });
}


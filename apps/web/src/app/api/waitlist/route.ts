import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = waitlistSchema.parse(body);

    // Call backend API to store waitlist entry
    const response = await fetch(`${API_URL}/api/v1/waitlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: validated.email,
        source: validated.source || "landing_page",
        metadata: validated.metadata || {},
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to join waitlist" }));
      return NextResponse.json(
        { error: error.error || "Failed to join waitlist" },
        { status: response.status }
      );
    }

    await response.json();

    // Optionally send welcome email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "Consilium <noreply@consiliumai.com>",
            to: validated.email,
            subject: "Welcome to Consilium Waitlist",
            html: `
              <h1>Thanks for joining the Consilium waitlist!</h1>
              <p>We're building something special — a multi-agent debate platform that helps you create better prompts for Cursor, Copilot, or your editor.</p>
              <p>We'll notify you as soon as we launch. In the meantime, you can:</p>
              <ul>
                <li>Star us on <a href="https://github.com/yourusername/consilium">GitHub</a></li>
                <li>Follow our progress on Twitter</li>
                <li>Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/faq">FAQ</a></li>
              </ul>
              <p>Thanks for your interest!</p>
              <p>- The Consilium Team</p>
            `,
          }),
        });
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error("Failed to send welcome email:", emailError);
      }
    }

    return NextResponse.json({ success: true, message: "Successfully joined waitlist" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


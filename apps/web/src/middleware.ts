import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/blog(.*)",
  "/docs(.*)",
  "/pricing(.*)",
  "/contact(.*)",
  "/research(.*)",
  "/use-cases(.*)",
  "/cli(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/terms(.*)",
  "/privacy(.*)",
  "/faq(.*)",
  "/monitoring(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (req.headers.get("host")?.startsWith("install.")) {
    return NextResponse.rewrite(new URL("/install.sh", req.url));
  }

  // E2E bypass: only honored outside production and only from the
  // server-only PLAYWRIGHT_TEST flag (never the NEXT_PUBLIC_* variant, which
  // is shipped to the browser and settable via .env files).
  const isTestMode =
    process.env.NODE_ENV !== "production" &&
    process.env.PLAYWRIGHT_TEST === "true";

  if (isTestMode) {
    return;
  }

  // Protect page routes (not API routes) except public ones
  // API routes handle their own auth using auth() in the route handler
  if (!isPublicRoute(req) && !req.nextUrl.pathname.startsWith("/api")) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt|mp4|webm|ogg|mp3|wav|flac|aac|avif)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/blog(.*)",
  "/docs(.*)",
  "/pricing(.*)",
  "/community(.*)",
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
]);

export default clerkMiddleware(async (auth, req) => {
  // In E2E test mode, bypass authentication completely
  // This allows Playwright tests to run without requiring Clerk authentication
  const isTestMode = process.env.PLAYWRIGHT_TEST === 'true';
  
  if (isTestMode) {
    // In test mode, don't call auth.protect() - allow all routes to be accessible
    // This prevents server-side redirects to sign-in
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};


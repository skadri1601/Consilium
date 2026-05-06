import { NextResponse } from "next/server";
import { indexNowKey } from "@/lib/indexnow";

/**
 * IndexNow ownership-verification key file.
 *
 * Bing fetches the URL referenced by ``keyLocation`` in our IndexNow
 * ping payload (see ``lib/indexnow.ts``) to confirm we own the
 * domain. The file must contain the exact key value; we serve it as
 * plain text and 404 when no key is configured.
 *
 * Spec lets the file live anywhere, so we picked a stable path
 * (/indexnow.txt) instead of the dynamic /<key>.txt convention to
 * avoid creating a catch-all route at the root.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const key = indexNowKey();
  if (!key) {
    return new NextResponse("Not Found", { status: 404 });
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

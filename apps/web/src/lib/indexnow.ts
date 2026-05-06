import { SITE_URL } from "./seo";

/**
 * IndexNow client. POSTs URL changes to the IndexNow gateway so Bing,
 * Yandex, and Seznam pick up new content within minutes instead of
 * waiting for the next crawl. Google does not consume IndexNow.
 *
 * Setup:
 *   1. Generate a 8-128 char hex key (any random string works).
 *   2. Set ``INDEXNOW_KEY`` in env. The public key file is served by
 *      ``app/[key].txt/route.ts`` — Bing fetches it to verify
 *      ownership, so the file content must match the key exactly.
 *   3. Call ``pingIndexNow([url1, url2, ...])`` after publishing.
 *
 * Spec: https://www.indexnow.org/documentation
 */

const INDEXNOW_HOST = "api.indexnow.org";

export interface IndexNowResult {
  ok: boolean;
  status: number;
  reason?: string;
  pingedCount: number;
}

export async function pingIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return {
      ok: false,
      status: 0,
      reason: "INDEXNOW_KEY not configured",
      pingedCount: 0,
    };
  }
  if (urls.length === 0) {
    return { ok: true, status: 0, reason: "no urls", pingedCount: 0 };
  }

  const host = new URL(SITE_URL).host;
  const payload = {
    host,
    key,
    keyLocation: `${SITE_URL}/indexnow.txt`,
    urlList: urls.map((u) => (u.startsWith("http") ? u : `${SITE_URL}${u}`)),
  };

  try {
    const response = await fetch(`https://${INDEXNOW_HOST}/IndexNow`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return {
      ok: response.ok,
      status: response.status,
      pingedCount: payload.urlList.length,
      ...(response.ok ? {} : { reason: response.statusText }),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      reason: error instanceof Error ? error.message : String(error),
      pingedCount: 0,
    };
  }
}

export function indexNowKey(): string | undefined {
  return process.env.INDEXNOW_KEY;
}

// @ts-check
/**
 * Generate apps/web/public/og.png - the 1200x630 social card used as
 * DEFAULT_OG_IMAGE by lib/seo.ts. Runs sharp + an inline SVG overlay.
 *
 * Re-run whenever the brand mark or tagline changes:
 *   node apps/web/scripts/generate-og-image.mjs
 */

import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BRAND_SVG = path.join(ROOT, "public", "brand", "consilium-icon.svg");
const OUT = path.join(ROOT, "public", "og.png");

const TITLE = "Consilium";
const TAG = "The AI Council - Multi-AI debates that synthesize consensus";
const SUB = "GPT · Claude · Gemini · Llama · Grok · Moonshot · OpenRouter";

const W = 1200;
const H = 630;

const overlaySvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#0a0a0a'/>
      <stop offset='100%' stop-color='#0f0c1f'/>
    </linearGradient>
    <radialGradient id='glow' cx='50%' cy='40%' r='50%'>
      <stop offset='0%' stop-color='#6366f1' stop-opacity='0.35'/>
      <stop offset='100%' stop-color='#6366f1' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='${W}' height='${H}' fill='url(#bg)'/>
  <rect width='${W}' height='${H}' fill='url(#glow)'/>
  <text x='${W / 2}' y='400' font-family='Inter, system-ui, sans-serif' font-size='84' font-weight='700' fill='#ffffff' text-anchor='middle'>${TITLE}</text>
  <text x='${W / 2}' y='460' font-family='Inter, system-ui, sans-serif' font-size='32' font-weight='400' fill='#d1d5db' text-anchor='middle'>${TAG}</text>
  <text x='${W / 2}' y='540' font-family='Inter, system-ui, sans-serif' font-size='22' font-weight='400' fill='#9ca3af' text-anchor='middle'>${SUB}</text>
</svg>`;

const brandSvg = fs.readFileSync(BRAND_SVG, "utf-8");
const logoBuf = await sharp(Buffer.from(brandSvg))
  .resize(240, 240)
  .png()
  .toBuffer();

const out = await sharp(Buffer.from(overlaySvg))
  .composite([{ input: logoBuf, top: 70, left: Math.round((W - 240) / 2) }])
  .png({ compressionLevel: 9 })
  .toBuffer();

fs.writeFileSync(OUT, out);
console.log(`Wrote ${OUT} (${out.length} bytes)`);

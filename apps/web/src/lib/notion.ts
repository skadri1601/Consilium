import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const NOTION_DOCS: Record<string, string> = {
  "what-is-consilium": "33f2627d-d545-8151-bb04-c6fe20d3e59f",
  faq: "33f2627d-d545-8172-8b9d-ece326c70eba",
  "self-hosting": "33f2627d-d545-8163-aff8-f3fce2eefaa5",
  security: "33f2627d-d545-8138-bc68-db494408c80f",
  research: "33f2627d-d545-81b2-b3f2-cc1e9dc2ec19",
  cli: "33f2627d-d545-8194-ac79-e95cc3a604d0",
  modes: "33f2627d-d545-81d8-8f2f-e22543ad0684",
};

function renderRichText(richText: RichTextItemResponse[]): string {
  return richText
    .map((t) => {
      let text = t.plain_text;
      if (t.annotations.bold) text = `<strong>${text}</strong>`;
      if (t.annotations.italic) text = `<em>${text}</em>`;
      if (t.annotations.code) text = `<code>${text}</code>`;
      if (t.annotations.strikethrough) text = `<del>${text}</del>`;
      if (t.href)
        text = `<a href="${t.href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${text}</a>`;
      return text;
    })
    .join("");
}

function blockToHtml(block: BlockObjectResponse): string {
  switch (block.type) {
    case "paragraph":
      return `<p class="mb-4 text-zinc-300 leading-relaxed">${renderRichText(block.paragraph.rich_text)}</p>`;

    case "heading_1":
      return `<h1 class="text-3xl font-bold mt-10 mb-4 text-white">${renderRichText(block.heading_1.rich_text)}</h1>`;

    case "heading_2":
      return `<h2 class="text-2xl font-semibold mt-8 mb-3 text-white">${renderRichText(block.heading_2.rich_text)}</h2>`;

    case "heading_3":
      return `<h3 class="text-xl font-semibold mt-6 mb-2 text-white">${renderRichText(block.heading_3.rich_text)}</h3>`;

    case "bulleted_list_item":
      return `<li class="text-zinc-300 ml-4 list-disc">${renderRichText(block.bulleted_list_item.rich_text)}</li>`;

    case "numbered_list_item":
      return `<li class="text-zinc-300 ml-4 list-decimal">${renderRichText(block.numbered_list_item.rich_text)}</li>`;

    case "code":
      return `<pre class="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-4 overflow-x-auto"><code class="text-sm text-zinc-300">${block.code.rich_text.map((t) => t.plain_text).join("")}</code></pre>`;

    case "quote":
      return `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 mb-4 text-zinc-400 italic">${renderRichText(block.quote.rich_text)}</blockquote>`;

    case "callout":
      return `<div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-4 flex gap-3"><span>${block.callout.icon?.type === "emoji" ? block.callout.icon.emoji : "💡"}</span><div class="text-zinc-300">${renderRichText(block.callout.rich_text)}</div></div>`;

    case "divider":
      return `<hr class="border-zinc-800 my-8" />`;

    case "table_row":
      return "";

    case "toggle":
      return `<details class="mb-4 border border-zinc-800 rounded-lg"><summary class="p-3 cursor-pointer text-white font-medium">${renderRichText(block.toggle.rich_text)}</summary><div class="p-3 pt-0 text-zinc-300"></div></details>`;

    default:
      return "";
  }
}

function wrapListItems(html: string): string {
  return html
    .replace(
      /(<li class="text-zinc-300 ml-4 list-disc">[\s\S]*?<\/li>)(?!\s*<li class="text-zinc-300 ml-4 list-disc">)/g,
      "$1</ul>",
    )
    .replace(
      /(?<!<\/li>\s*)(<li class="text-zinc-300 ml-4 list-disc">)/,
      '<ul class="mb-4 space-y-1">$1',
    );
}

export async function fetchNotionPage(pageId: string) {
  const page = await notion.pages.retrieve({ page_id: pageId });

  let title = "";
  if ("properties" in page) {
    const titleProp = Object.values(page.properties).find(
      (p) => p.type === "title",
    );
    if (titleProp && titleProp.type === "title") {
      title = titleProp.title.map((t) => t.plain_text).join("");
    }
  }

  const blocks = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  const html = (blocks.results as BlockObjectResponse[])
    .map(blockToHtml)
    .join("\n");

  return { title, html: wrapListItems(html) };
}

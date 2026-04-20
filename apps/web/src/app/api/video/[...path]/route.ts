import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const fileName = segments.join("/");
  const basePath = path.resolve(process.cwd(), "public", "brand");
  const filePath = path.resolve(basePath, fileName);

  if (!filePath.startsWith(basePath + path.sep) && filePath !== basePath) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const buffer = await readFile(filePath);
      const chunk = buffer.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Content-Length": String(fileSize),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

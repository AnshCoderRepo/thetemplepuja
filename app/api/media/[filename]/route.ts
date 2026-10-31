import { NextRequest, NextResponse } from "next/server";
import { getMediaAsync } from "@/lib/media-cache";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  if (!filename) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const media = await getMediaAsync(filename);
  if (!media) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch === `"${filename}"`) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": `"${filename}"`,
      },
    });
  }

  return new NextResponse(new Uint8Array(media.buffer), {
    status: 200,
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(media.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "ETag": `"${filename}"`,
    },
  });
}

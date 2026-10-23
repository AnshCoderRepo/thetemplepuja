import { NextRequest, NextResponse } from "next/server";
import { getMedia } from "@/lib/media-cache";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  if (!filename) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const media = getMedia(filename);
  if (!media) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(media.buffer as any, {
    status: 200,
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(media.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "ETag": `"${filename}"`,
    },
  });
}

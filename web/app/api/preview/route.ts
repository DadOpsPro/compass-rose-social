import { NextResponse } from "next/server";

export async function GET() {
  const previewUrl = process.env.PREVIEW_VIDEO_URL?.trim() || "";
  return NextResponse.json({
    previewUrl,
    configured: Boolean(previewUrl),
  });
}

import { NextResponse } from "next/server";
import { dispatchRender } from "../../../lib/github";
import { isTimeline } from "../../../lib/timeline";

export async function POST(request: Request) {
  let body: { draft?: unknown; outputName?: string } = {};
  try {
    body = (await request.json()) as { draft?: unknown; outputName?: string };
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  if (!isTimeline(body.draft)) {
    return NextResponse.json(
      { error: "draft must be a renderer timeline with scenes[]" },
      { status: 400 },
    );
  }

  const outputName =
    typeof body.outputName === "string" && body.outputName.trim()
      ? body.outputName.trim()
      : "reel.mp4";

  const result = await dispatchRender(body.draft, outputName);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}

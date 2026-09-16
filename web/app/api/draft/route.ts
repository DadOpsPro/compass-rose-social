import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isTimeline, prettyJson } from "../../../lib/timeline";

const MAX_BYTES = 120_000;

function safeName(raw: unknown): string {
  const base = typeof raw === "string" ? raw : "compass-rose-draft.json";
  const cleaned = path.basename(base).replace(/[^A-Za-z0-9._-]/g, "");
  if (!cleaned) return "compass-rose-draft.json";
  return cleaned.toLowerCase().endsWith(".json") ? cleaned : `${cleaned}.json`;
}

export async function POST(request: Request) {
  let body: { filename?: string; draft?: unknown } = {};
  try {
    body = (await request.json()) as { filename?: string; draft?: unknown };
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  if (!isTimeline(body.draft)) {
    return NextResponse.json(
      { error: "draft must be a renderer timeline with scenes[]" },
      { status: 400 },
    );
  }

  const json = prettyJson(body.draft);
  if (Buffer.byteLength(json) > MAX_BYTES) {
    return NextResponse.json({ error: "Draft is too large" }, { status: 413 });
  }

  const filename = safeName(body.filename);
  const onVercel = process.env.VERCEL === "1";

  if (onVercel) {
    return NextResponse.json({
      saved: false,
      filename,
      reason:
        "Vercel’s filesystem is ephemeral. Download the JSON instead, then Request render (GitHub Actions) or render locally.",
    });
  }

  const dest = path.join(process.cwd(), "drafts", filename);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, json, "utf8");

  return NextResponse.json({
    saved: true,
    filename,
    path: `web/drafts/${filename}`,
  });
}

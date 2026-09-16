#!/usr/bin/env node
/**
 * Prove root `font` changes the drawn face, and that the parser rejects
 * invalid ids / per-scene fonts. Offline: color: stills, no network.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTimeline } from "../lib/timeline.mjs";
import { renderTimeline } from "../lib/render.mjs";
import { DEFAULT_FONT_ID, formatValidFontIds, listFontIds } from "../lib/fonts.mjs";
import { resolveBinary, runCommand } from "../lib/ffmpeg.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const OUT = path.join(ROOT, "out", "fonts-smoke");
const COMPARE = ["montserrat", "bebas", "playfair"];

const BASE_SCENE = {
  duration: 0.7,
  image: { src: "color:#1B4F72", fit: "cover", zoom: 1 },
  text: {
    content: "All-inclusive isn't\nthe flex you think",
    position: "lower-third",
    fontSize: 64,
    color: "#FFFFFF",
    background: "rgba(0,0,0,0.45)",
  },
};

function miniTimeline(font) {
  const raw = {
    width: 1080,
    height: 1920,
    fps: 30,
    scenes: [structuredClone(BASE_SCENE)],
  };
  if (font !== undefined) raw.font = font;
  return raw;
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function expectThrow(fn, needle, label) {
  try {
    fn();
  } catch (err) {
    const msg = err.message || String(err);
    if (!msg.includes(needle)) {
      throw new Error(`${label}: expected error to mention ${JSON.stringify(needle)}, got: ${msg}`);
    }
    return msg;
  }
  throw new Error(`${label}: expected throw`);
}

async function parserChecks() {
  const omitted = parseTimeline(miniTimeline());
  assert(omitted.font === DEFAULT_FONT_ID, `omit font → ${DEFAULT_FONT_ID}, got ${omitted.font}`);

  const explicit = parseTimeline(miniTimeline("montserrat"));
  assert(explicit.font === "montserrat", "explicit montserrat");

  const alias = parseTimeline({ ...miniTimeline(), font: undefined, typeface: "Bebas Neue" });
  assert(alias.font === "bebas", `typeface alias → bebas, got ${alias.font}`);

  const both = parseTimeline({ ...miniTimeline("bebas"), typeface: "bebas-neue" });
  assert(both.font === "bebas", "font + matching typeface alias");

  const invalidMsg = expectThrow(
    () => parseTimeline(miniTimeline("comic-sans")),
    "comic-sans",
    "invalid font id",
  );
  for (const id of listFontIds()) {
    assert(invalidMsg.includes(id), `invalid-font error should list ${id}: ${invalidMsg}`);
  }
  assert(invalidMsg.includes(formatValidFontIds()), "invalid-font error lists valid ids");

  expectThrow(
    () => parseTimeline({ ...miniTimeline("bebas"), typeface: "anton" }),
    "disagree",
    "font vs typeface mismatch",
  );

  const perSceneText = miniTimeline("montserrat");
  perSceneText.scenes[0].text.font = "bebas";
  expectThrow(() => parseTimeline(perSceneText), "text.font is not allowed", "per-scene text.font");

  const perSceneRoot = miniTimeline();
  perSceneRoot.scenes[0].font = "bebas";
  expectThrow(() => parseTimeline(perSceneRoot), "not allowed", "per-scene font");
}

async function extractFrame(ffmpeg, mp4, dest) {
  await runCommand(ffmpeg, [
    "-hide_banner", "-y", "-ss", "0.2", "-i", mp4,
    "-frames:v", "1", "-update", "1",
    dest,
  ], { label: `extract ${path.basename(dest)}` });
}

async function main() {
  await parserChecks();
  await mkdir(OUT, { recursive: true });

  const ffmpeg = await resolveBinary("ffmpeg");
  const hashes = {};
  const files = {};

  // Omit font (default) plus a few named presets.
  const jobs = [
    { id: "default", font: undefined },
    ...COMPARE.map((id) => ({ id, font: id })),
  ];

  for (const job of jobs) {
    const mp4 = path.join(OUT, `${job.id}.mp4`);
    const png = path.join(OUT, `${job.id}.png`);
    const raw = miniTimeline(job.font);
    await renderTimeline({
      timeline: raw,
      jsonDir: OUT,
      output: mp4,
    });
    await extractFrame(ffmpeg, mp4, png);
    const buf = await readFile(png);
    hashes[job.id] = sha256(buf);
    files[job.id] = { mp4, png, bytes: buf.length };
  }

  const errors = [];
  if (hashes.default !== hashes.montserrat) {
    errors.push("omit font should match explicit montserrat (same pixels)");
  }
  const unique = new Set(COMPARE.map((id) => hashes[id]));
  if (unique.size !== COMPARE.length) {
    errors.push(`expected distinct frames for ${COMPARE.join(", ")}; hashes=${JSON.stringify(hashes)}`);
  }

  const report = {
    ok: errors.length === 0,
    validIds: listFontIds(),
    compared: COMPARE,
    hashes,
    files,
    errors,
  };
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) {
    console.error("FONTS SMOKE FAILED");
    process.exit(1);
  }
  console.error("FONTS SMOKE OK — default=montserrat; bebas/playfair frames differ");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

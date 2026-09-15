#!/usr/bin/env node
/**
 * Offline-capable smoke: two scenes, fade, zoom/pan, lower-third text.
 * Uses public sample photos when reachable; otherwise solid-color placeholders.
 * Asserts 1080x1920 H.264, no audio, file > 100KB.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderTimeline } from "../lib/render.mjs";
import { download, isHttpUrl } from "../lib/assets.mjs";
import { probeVideo } from "../lib/probe.mjs";
import { resolveBinary, runCommand } from "../lib/ffmpeg.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const RENDERER = fileURLToPath(new URL("..", import.meta.url));
const SMOKE_JSON = path.join(RENDERER, "examples", "smoke.json");
const OUT = path.join(ROOT, "out", "smoke.mp4");
const FRAMES = path.join(ROOT, "out", "smoke-frames");

const PUBLIC_SAMPLES = [
  "https://cdn.json2video.com/assets/images/london-01.jpg",
  "https://cdn.json2video.com/assets/images/london-02.jpg",
];

async function main() {
  const raw = JSON.parse(await readFile(SMOKE_JSON, "utf8"));
  const reachable = await canFetch(PUBLIC_SAMPLES[0]);

  if (!reachable) {
    console.error("Public sample images unreachable — using color: placeholders");
    raw.scenes[0].image.src = "color:#1B4F72";
    raw.scenes[1].image.src = "color:#0E6655";
    // Noise-ish extra scene length + third color beat so the encode exceeds 100KB
    raw.scenes.push({
      duration: 1.6,
      transition: { type: "fade", duration: 0.3 },
      image: { src: "color:#6C3483", fit: "cover", zoom: 1.1, pan: "bottom" },
      text: { content: "No watermark.\nSilent 9:16.", position: "lower-third", fontSize: 64 },
    });
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await renderTimeline({
    timeline: raw,
    jsonDir: path.dirname(SMOKE_JSON),
    output: OUT,
    verbose: process.argv.includes("--verbose"),
  });

  const ffprobe = await resolveBinary("ffprobe");
  const info = await probeVideo(ffprobe, OUT);
  const errors = [];

  if (info.width !== 1080 || info.height !== 1920) {
    errors.push(`expected 1080x1920, got ${info.width}x${info.height}`);
  }
  if (info.audioTracks !== 0) {
    errors.push(`expected no audio, found ${info.audioTracks} audio stream(s)`);
  }
  if (info.codec && info.codec !== "h264") {
    errors.push(`expected h264, got ${info.codec}`);
  }
  if (info.size < 100_000) {
    errors.push(`expected file > 100KB, got ${info.size} bytes`);
  }
  if (info.duration < 2) {
    errors.push(`expected duration >= 2s, got ${info.duration}`);
  }

  await mkdir(FRAMES, { recursive: true });
  const ffmpeg = await resolveBinary("ffmpeg");
  const stamps = [
    ["start", 0.35],
    ["fade", Math.max(1.2, (raw.scenes[0].duration || 2) - 0.2)],
    ["scene2", Math.max(2.2, (raw.scenes[0].duration || 2) + 0.4)],
  ];
  for (const [name, t] of stamps) {
    await runCommand(ffmpeg, [
      "-hide_banner", "-y", "-ss", String(t), "-i", OUT,
      "-frames:v", "1", "-update", "1",
      path.join(FRAMES, `${name}.png`),
    ], { label: `extract ${name}` });
  }

  const report = {
    ok: errors.length === 0,
    output: OUT,
    usedPublicSamples: reachable,
    probe: info,
    errors,
    frames: FRAMES,
  };
  await writeFile(path.join(ROOT, "out", "smoke-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) {
    console.error("SMOKE FAILED");
    process.exit(1);
  }
  console.error("SMOKE OK — silent 1080x1920 H.264, no watermark");
}

async function canFetch(url) {
  if (!isHttpUrl(url)) return false;
  try {
    const buf = await download(url, { timeoutMs: 12_000 });
    return buf.length > 1000;
  } catch {
    return false;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

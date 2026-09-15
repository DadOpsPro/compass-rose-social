import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { runCommand } from "./ffmpeg.mjs";

const COLOR_RE = /^color:(#?[0-9a-fA-F]{3,8}|0x[0-9a-fA-F]+|[a-zA-Z]+)$/;

export function isHttpUrl(src) {
  return /^https?:\/\//i.test(src);
}

export function isColorSrc(src) {
  return COLOR_RE.test(src.trim());
}

export function resolveLocalPath(src, jsonDir) {
  if (path.isAbsolute(src)) return src;
  const fromJson = path.resolve(jsonDir, src);
  if (existsSync(fromJson)) return fromJson;
  const fromCwd = path.resolve(process.cwd(), src);
  if (existsSync(fromCwd)) return fromCwd;
  return fromJson;
}

export async function materializeImage({ src, dest, jsonDir, ffmpeg, width, height, verbose }) {
  if (isColorSrc(src)) {
    const color = normalizeColor(src.slice("color:".length));
    // Subtle vignette + grain so color: placeholders are not a flat encode.
    await runCommand(
      ffmpeg,
      [
        "-hide_banner",
        "-f", "lavfi",
        "-i", `color=c=${color}:s=${width}x${height}`,
        "-vf", "vignette=PI/4,noise=alls=10:allf=t+u",
        "-frames:v", "1",
        "-update", "1",
        dest,
      ],
      { verbose, label: "ffmpeg color" },
    );
    return dest;
  }

  if (isHttpUrl(src)) {
    const buf = await download(src);
    await writeFile(dest, buf);
    return dest;
  }

  const local = resolveLocalPath(src, jsonDir);
  if (!existsSync(local)) {
    throw new Error(
      `Image not found: ${src}\n  looked at ${local}\n  Paths are relative to the timeline JSON file. Use an https URL, a local file, or color:#1B4F72.`,
    );
  }
  await copyFile(local, dest);
  return dest;
}

function normalizeColor(raw) {
  const c = raw.trim();
  if (c.startsWith("0x") || /^[a-zA-Z]+$/.test(c)) return c;
  if (c.startsWith("#")) return `0x${c.slice(1)}`;
  return `0x${c}`;
}

export async function download(url, { timeoutMs = 30_000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`GET ${url} failed: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) throw new Error(`GET ${url} returned an empty body`);
    return buf;
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`GET ${url} timed out after ${timeoutMs}ms`);
    throw err;
  } finally {
    clearTimeout(t);
  }
}

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

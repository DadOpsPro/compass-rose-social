import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

export async function resolveBinary(name, explicit) {
  if (explicit) {
    await assertExecutable(explicit, name);
    return explicit;
  }
  const fromEnv = process.env[name.toUpperCase()];
  if (fromEnv) {
    await assertExecutable(fromEnv, name);
    return fromEnv;
  }
  return name;
}

async function assertExecutable(path, name) {
  try {
    await access(path, constants.X_OK);
  } catch {
    throw new Error(`${name} not found at ${path}`);
  }
}

export function runCommand(bin, args, { cwd, verbose = false, label = bin } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (verbose) process.stderr.write(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (verbose) process.stderr.write(chunk);
    });
    child.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(missingBinary(bin));
      } else {
        reject(err);
      }
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const tail = stderr.trim().split("\n").slice(-12).join("\n");
      reject(new Error(`${label} failed (exit ${code})\n${tail}`));
    });
  });
}

function missingBinary(bin) {
  const brew = bin.includes("ffprobe") ? "ffprobe (part of ffmpeg)" : "ffmpeg";
  return new Error(
    `${bin} not found on PATH. Install FFmpeg first:\n` +
      `  macOS:   brew install ffmpeg\n` +
      `  Ubuntu:  sudo apt install ffmpeg\n` +
      `Then retry. (${brew} must include libx264 and drawtext/freetype.)`,
  );
}

export async function ensureFfmpeg(ffmpeg) {
  try {
    await runCommand(ffmpeg, ["-hide_banner", "-version"]);
  } catch (err) {
    if (err.code === "ENOENT" || /not found on PATH/i.test(err.message)) {
      throw missingBinary(ffmpeg);
    }
    throw err;
  }
}

/** Escape a path used inside an FFmpeg filtergraph. */
export function escapeFilterPath(p) {
  return String(p)
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
}

export function zoompanXY(pan, frames) {
  const n = String(frames);
  const cx = "iw/2-(iw/zoom/2)";
  const cy = "ih/2-(ih/zoom/2)";
  switch (pan) {
    case "right":
      return { x: `(iw-iw/zoom)*on/${n}`, y: cy };
    case "left":
      return { x: `(iw-iw/zoom)*(1-on/${n})`, y: cy };
    case "bottom":
      return { x: cx, y: `(ih-ih/zoom)*on/${n}` };
    case "top":
      return { x: cx, y: `(ih-ih/zoom)*(1-on/${n})` };
    default:
      return { x: cx, y: cy };
  }
}

/**
 * Cover-crop a still to WxH, optional Ken Burns, optional text overlay.
 * Image is already on disk; overlay PNG is full-canvas RGBA or null.
 */
export function buildSceneFilter({ width, height, fps, frames, zoom, pan, hasOverlay }) {
  const cover = `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height},setsar=1`;

  let motion;
  if (zoom <= 1.001) {
    motion = `${cover},fps=${fps},trim=end_frame=${frames},setpts=PTS-STARTPTS,format=yuv420p`;
  } else {
    const { x, y } = zoompanXY(pan, frames);
    const zExpr = `min(1+${(zoom - 1).toFixed(5)}*on/${frames},${zoom})`;
    motion =
      `${cover},scale=${width * 2}:${height * 2}:flags=lanczos,` +
      `zoompan=z='${zExpr}':d=${frames}:x='${x}':y='${y}':s=${width}x${height}:fps=${fps},` +
      `trim=end_frame=${frames},setpts=PTS-STARTPTS,format=yuv420p`;
  }

  if (!hasOverlay) {
    return `${motion},setsar=1,fps=${fps},setpts=PTS-STARTPTS[out]`;
  }
  return `[0:v]${motion}[v];[v][1:v]overlay=0:0:format=auto,format=yuv420p,setsar=1,fps=${fps},setpts=PTS-STARTPTS[out]`;
}

export function buildXfadeGraph(sceneCount, fades) {
  if (sceneCount === 1) return { filter: "[0:v]format=yuv420p,setsar=1[out]", map: "[out]" };

  const hasFade = fades.some((f) => f.duration > 0);
  if (!hasFade) {
    const labels = Array.from({ length: sceneCount }, (_, i) => `[${i}:v]`).join("");
    return {
      filter: `${labels}concat=n=${sceneCount}:v=1:a=0,format=yuv420p,setsar=1[out]`,
      map: "[out]",
    };
  }

  const parts = [];
  let last = "[0:v]";
  for (let i = 1; i < sceneCount; i++) {
    const fade = fades[i - 1];
    const out = i === sceneCount - 1 ? "[out]" : `[v${i}]`;
    if (fade.duration > 0) {
      parts.push(
        `${last}[${i}:v]xfade=transition=fade:duration=${fade.duration}:offset=${fade.offset}${out}`,
      );
    } else {
      // Hard cut: append via concat of accumulated + next
      const acc = i === sceneCount - 1 ? "[out]" : `[v${i}]`;
      parts.push(`${last}[${i}:v]concat=n=2:v=1:a=0${acc}`);
    }
    last = out;
  }
  parts[parts.length - 1] = parts[parts.length - 1].replace(/\[out]$/, ",format=yuv420p,setsar=1[out]");
  return { filter: parts.join(";"), map: "[out]" };
}

export const ENCODE_ARGS = [
  "-an",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "18",
  "-pix_fmt", "yuv420p",
  "-profile:v", "high",
  "-level", "4.2",
  "-movflags", "+faststart",
];

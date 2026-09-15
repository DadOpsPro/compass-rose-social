import { writeFile } from "node:fs/promises";
import { runCommand, escapeFilterPath } from "./ffmpeg.mjs";

/**
 * Rasterize a lower-third (or center/top) caption to a full-canvas RGBA PNG.
 * Uses FFmpeg drawtext + the bundled Montserrat ExtraBold file so Mac/Linux
 * do not need a system font install. A 90%-width dark bar + strong shadow
 * keeps white type readable on bright travel photos.
 */
export async function renderTextOverlay({
  ffmpeg,
  dest,
  textFile,
  fontFile,
  width,
  height,
  text,
  verbose,
}) {
  const lines = wrapText(text.content, text.fontSize, width);
  await writeFile(textFile, lines.join("\n"), "utf8");

  const box = parseBackground(text.background);
  const fontcolor = cssToFfmpegColor(text.color, "0xFFFFFF");
  const yExpr = positionY(text.position);

  const vf = [
    `drawtext=fontfile='${escapeFilterPath(fontFile)}'`,
    `textfile='${escapeFilterPath(textFile)}'`,
    "expansion=none",
    "text_shaping=1",
    `fontsize=${Math.round(text.fontSize)}`,
    `fontcolor=${fontcolor}`,
    `line_spacing=${Math.round(text.fontSize * 0.22)}`,
    "x=(w-text_w)/2",
    `y=${yExpr}`,
    `shadowcolor=black@0.85`,
    "shadowx=0",
    "shadowy=3",
  ];

  if (box) {
    vf.push(`box=1`, `boxcolor=${box.color}@${box.alpha}`, `boxborderw=${box.pad}`);
  }

  await runCommand(
    ffmpeg,
    [
      "-hide_banner",
      "-f", "lavfi",
      "-i", `color=c=black@0.0:s=${width}x${height},format=rgba`,
      "-vf", vf.join(":"),
      "-frames:v", "1",
      "-update", "1",
      dest,
    ],
    { verbose, label: "ffmpeg drawtext" },
  );
  return dest;
}

export function wrapText(content, fontSize, canvasWidth) {
  const explicit = String(content).replaceAll("\\n", "\n").split(/\n/);
  const maxWidth = canvasWidth * 0.82;
  const em = fontSize * 0.58;
  const maxChars = Math.max(8, Math.floor(maxWidth / em));

  const out = [];
  for (const para of explicit) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push("");
      continue;
    }
    let line = words[0];
    for (const word of words.slice(1)) {
      if (`${line} ${word}`.length <= maxChars) line = `${line} ${word}`;
      else {
        out.push(line);
        line = word;
      }
    }
    // ExtraBold is tight; a double space keeps words readable on a phone.
    out.push(line.replaceAll(" ", "  "));
  }
  return out.length ? out : [""];
}

function positionY(position) {
  if (position === "center") return "(h-text_h)/2";
  if (position === "top") return "180";
  // lower-third: sit above IG/TikTok chrome (~220px from bottom)
  return "h-text_h-220";
}

function parseBackground(raw) {
  if (raw == null || raw === false || raw === "none" || raw === "transparent") return null;
  const { hex, alpha } = parseCssColor(raw, { hex: "0x000000", alpha: 0.45 });
  return { color: hex, alpha: clamp(alpha, 0, 1).toFixed(3), pad: 28 };
}

export function cssToFfmpegColor(raw, fallback = "0xFFFFFF") {
  return parseCssColor(raw, { hex: fallback, alpha: 1 }).hex;
}

export function parseCssColor(raw, fallback) {
  if (raw == null) return fallback;
  const s = String(raw).trim();

  if (s === "white") return { hex: "0xFFFFFF", alpha: 1 };
  if (s === "black") return { hex: "0x000000", alpha: 1 };

  const hex = s.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    let alpha = 1;
    if (h.length === 8) {
      alpha = parseInt(h.slice(6, 8), 16) / 255;
      h = h.slice(0, 6);
    }
    return { hex: `0x${h.toUpperCase()}`, alpha };
  }

  const rgba = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgba) {
    const r = clamp(Math.round(Number(rgba[1])), 0, 255);
    const g = clamp(Math.round(Number(rgba[2])), 0, 255);
    const b = clamp(Math.round(Number(rgba[3])), 0, 255);
    const a = rgba[4] == null ? 1 : Number(rgba[4]);
    return {
      hex: `0x${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`,
      alpha: clamp(a, 0, 1),
    };
  }

  return fallback;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

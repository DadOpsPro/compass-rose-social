#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderTimeline } from "../lib/render.mjs";

const HELP = `
Compass Rose silent Reel renderer (local FFmpeg, no watermark, no JSON2Video).

Usage:
  node renderer/bin/render.mjs <timeline.json> -o <out.mp4>
  npm run render -- <timeline.json> -o <out.mp4>

Options:
  -o, --output <file>   Output MP4 (default: out/reel.mp4)
  --ffmpeg <path>       ffmpeg binary (or $FFMPEG)
  --ffprobe <path>      ffprobe binary (or $FFPROBE)
  --keep-temp           Leave intermediate scene files in $TMPDIR
  --verbose             Print ffmpeg logs
  -h, --help            Show this help

Timeline JSON is a simple scene list. See renderer/README.md and
docs/SELF-HOST-RENDERER.md. Image src may be a local path, https URL,
or color:#1B4F72.
`.trim();

function parseArgs(argv) {
  const out = {
    input: null,
    output: "out/reel.mp4",
    ffmpeg: undefined,
    ffprobe: undefined,
    keepTemp: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") out.help = true;
    else if (a === "-o" || a === "--output") out.output = need(argv, ++i, a);
    else if (a === "--ffmpeg") out.ffmpeg = need(argv, ++i, a);
    else if (a === "--ffprobe") out.ffprobe = need(argv, ++i, a);
    else if (a === "--keep-temp") out.keepTemp = true;
    else if (a === "--verbose") out.verbose = true;
    else if (a.startsWith("-")) throw new Error(`Unknown flag: ${a}`);
    else if (!out.input) out.input = a;
    else throw new Error(`Unexpected extra argument: ${a}`);
  }
  return out;
}

function need(argv, i, flag) {
  if (i >= argv.length) throw new Error(`${flag} requires a value`);
  return argv[i];
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    console.error(HELP);
    process.exit(2);
  }

  if (args.help || !args.input) {
    console.log(HELP);
    process.exit(args.help ? 0 : 2);
  }

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  let raw;
  try {
    raw = JSON.parse(await readFile(inputPath, "utf8"));
  } catch (err) {
    console.error(`Could not read timeline ${inputPath}: ${err.message}`);
    process.exit(1);
  }

  try {
    await renderTimeline({
      timeline: raw,
      jsonDir: path.dirname(inputPath),
      output: outputPath,
      ffmpeg: args.ffmpeg,
      ffprobe: args.ffprobe,
      keepTemp: args.keepTemp,
      verbose: args.verbose,
    });
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();

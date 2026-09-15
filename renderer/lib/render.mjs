import { mkdtemp, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTimeline, sceneFrameCount } from "./timeline.mjs";
import { materializeImage, ensureDir } from "./assets.mjs";
import { renderTextOverlay } from "./text.mjs";
import { probeVideo } from "./probe.mjs";
import {
  resolveBinary,
  ensureFfmpeg,
  runCommand,
  buildSceneFilter,
  buildXfadeGraph,
  ENCODE_ARGS,
} from "./ffmpeg.mjs";

const FONT_FILE = fileURLToPath(
  new URL("../fonts/Montserrat-ExtraBold.ttf", import.meta.url),
);

export async function renderTimeline({
  timeline: raw,
  jsonDir,
  output,
  ffmpeg: ffmpegOpt,
  ffprobe: ffprobeOpt,
  keepTemp = false,
  verbose = false,
  log = console.error.bind(console),
}) {
  const timeline = parseTimeline(raw);
  const ffmpeg = await resolveBinary("ffmpeg", ffmpegOpt);
  const ffprobe = await resolveBinary("ffprobe", ffprobeOpt);
  await ensureFfmpeg(ffmpeg);

  const workDir = await mkdtemp(path.join(tmpdir(), "cr-reel-"));
  const { width, height, fps, scenes, plan } = timeline;

  try {
    log(`Canvas ${width}x${height} @ ${fps}fps — ${scenes.length} scene(s), ~${plan.totalDuration.toFixed(2)}s, silent`);

    const sceneFiles = [];
    for (const scene of scenes) {
      const frames = sceneFrameCount(scene.duration, fps);
      const imgDest = path.join(workDir, `scene-${scene.index}-img.png`);
      const ovDest = path.join(workDir, `scene-${scene.index}-ov.png`);
      const txtDest = path.join(workDir, `scene-${scene.index}.txt`);
      const mp4 = path.join(workDir, `scene-${scene.index}.mp4`);

      log(`  scene ${scene.index + 1}/${scenes.length}: ${scene.duration}s zoom=${scene.image.zoom} pan=${scene.image.pan}`);
      await materializeImage({
        src: scene.image.src,
        dest: imgDest,
        jsonDir,
        ffmpeg,
        width,
        height,
        verbose,
      });

      let hasOverlay = false;
      if (scene.text) {
        await renderTextOverlay({
          ffmpeg,
          dest: ovDest,
          textFile: txtDest,
          fontFile: FONT_FILE,
          width,
          height,
          text: scene.text,
          verbose,
        });
        hasOverlay = true;
      }

      const filter = buildSceneFilter({
        width,
        height,
        fps,
        frames,
        zoom: scene.image.zoom,
        pan: scene.image.pan,
        hasOverlay,
      });

      const args = [
        "-hide_banner",
        "-loop", "1",
        "-i", imgDest,
      ];
      if (hasOverlay) args.push("-i", ovDest);
      args.push(
        "-filter_complex", filter,
        "-map", "[out]",
        "-frames:v", String(frames),
        "-r", String(fps),
        ...ENCODE_ARGS,
        mp4,
      );
      await runCommand(ffmpeg, args, { verbose, label: `ffmpeg scene ${scene.index}` });
      sceneFiles.push(mp4);
    }

    await ensureDir(path.dirname(path.resolve(output)));
    const assembled = path.join(workDir, "assembled.mp4");

    if (sceneFiles.length === 1) {
      await cp(sceneFiles[0], assembled);
    } else {
      log("  assembling transitions…");
      const { filter, map } = buildXfadeGraph(sceneFiles.length, plan.fades);
      const args = ["-hide_banner"];
      for (const file of sceneFiles) args.push("-i", file);
      args.push("-filter_complex", filter, "-map", map, "-r", String(fps), ...ENCODE_ARGS, assembled);
      await runCommand(ffmpeg, args, { verbose, label: "ffmpeg xfade" });
    }

    await cp(assembled, output);
    const info = await probeVideo(ffprobe, output);
    const kb = Math.round(info.size / 1024);
    log(`Wrote ${output} — ${info.width}x${info.height} ${info.codec} ${info.duration.toFixed(2)}s ${kb}KB audio=${info.audioTracks} watermark=none`);
    return { output, workDir, timeline, probe: info };
  } finally {
    if (!keepTemp) {
      await rm(workDir, { recursive: true, force: true });
    } else {
      log(`Kept temp files in ${workDir}`);
    }
  }
}

export { parseTimeline, FONT_FILE };

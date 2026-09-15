import { runCommand } from "./ffmpeg.mjs";

export async function probeVideo(ffprobe, file) {
  const { stdout } = await runCommand(ffprobe, [
    "-v", "error",
    "-show_entries", "stream=codec_type,codec_name,width,height,nb_frames,duration",
    "-show_entries", "format=duration,size,bit_rate",
    "-of", "json",
    file,
  ], { label: "ffprobe" });

  const data = JSON.parse(stdout);
  const streams = data.streams || [];
  const video = streams.find((s) => s.codec_type === "video") || null;
  const audio = streams.filter((s) => s.codec_type === "audio");
  return {
    width: video ? Number(video.width) : 0,
    height: video ? Number(video.height) : 0,
    codec: video?.codec_name || "",
    frames: video?.nb_frames ? Number(video.nb_frames) : null,
    duration: Number(data.format?.duration || video?.duration || 0),
    size: Number(data.format?.size || 0),
    audioTracks: audio.length,
  };
}

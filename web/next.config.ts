import type { NextConfig } from "next";

/**
 * Vercel / Next.js hosts the Kristin editor UI only.
 *
 * Do NOT run FFmpeg (or renderer/bin/render.mjs) inside Vercel
 * serverless or Edge functions. Silent Reel MP4s are produced by
 * GitHub Actions (/.github/workflows/render-reel.yml) or locally:
 *   node renderer/bin/render.mjs <draft.json> -o out/reel.mp4
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
};

export default nextConfig;

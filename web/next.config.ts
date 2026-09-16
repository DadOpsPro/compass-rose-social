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
  // Local Save draft writes web/drafts/*.json. Ignore those so Next
  // file-watching does not remount the editor and wipe Kristin's edits.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/.git/**", "**/drafts/**"],
    };
    return config;
  },
};

export default nextConfig;

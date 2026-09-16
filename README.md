# Compass Rose Social

Silent 9:16 Reels for Compass Rose Leisure.

**Production renders use the local FFmpeg renderer in [`renderer/`](renderer/)** — not JSON2Video. The SaaS free plan watermarks every export; this repo does not require an API key or a paid plan.

Kristin adds trending audio in review. No talking-head. No auto-post without GO.

## Quick start (Mac)

```bash
brew install ffmpeg
npm run smoke
# → out/smoke.mp4  (silent 1080×1920, no watermark)
```

```bash
npm run render -- examples/self-host-gsl-silent.json -o out/gsl.mp4
# Bebas Neue on every beat (same copy):
npm run render -- examples/self-host-gsl-drive-bebas.json -o out/gsl-bebas.mp4
# or
node renderer/bin/render.mjs renderer/examples/smoke.json -o out/reel.mp4
npm run fonts            # list typeface preset ids
```

Full setup, schema, and knobs: [docs/SELF-HOST-RENDERER.md](docs/SELF-HOST-RENDERER.md) and [renderer/README.md](renderer/README.md).

## Kristin editor (`web/`)

Phone UI to edit beat copy and pick one root `font` preset, then download renderer JSON.

```bash
cd web && npm install && npm run dev
# → http://localhost:3000
```

Deploy `web/` on **Vercel** (Root Directory: `web`). That host is **UI only — no FFmpeg on Vercel**. Remote MP4s come from GitHub Actions [`.github/workflows/render-reel.yml`](.github/workflows/render-reel.yml) (`workflow_dispatch` or `repository_dispatch`). Docs: [web/README.md](web/README.md) and [docs/KRISTIN-EDITOR.md](docs/KRISTIN-EDITOR.md).

## Split of ownership

| Layer | Owner |
|---|---|
| Templates, timeline JSON, local renderer | This repo (you + Claude Code) |
| Queue Sheet / Drive MP4s | Google |
| STATUS, Kristin review ops | Grok Bot project *Compass Rose Social* |

## Historical JSON2Video

Older movie JSON lives under `examples/reel-*.json` and talks to JSON2Video MCP (`.mcp.json`). Keep those files as reference. Do **not** submit them to `renderer/` — the schemas differ. The JSON2Video free-plan watermark is why finals moved in-house.

If you still need the old MCP locally, `JSON2VIDEO_API_KEY` stays in your shell only (see `.env.example`). Repo secrets are not injected into Claude Code.

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

GitHub Actions: **Actions → Render silent Reel → Run workflow** (default: color smoke, no CDN). Real batch: commit JSON under `queue/pending/` or wait for Monday 14:00 UTC. MP4s are workflow artifacts — drop them in the [live DadOps Drive folder](https://drive.google.com/drive/folders/1wc353Q7H1jFCBLjtaitj-k_fFki-fXe9).

Full setup, schema, and knobs: [docs/SELF-HOST-RENDERER.md](docs/SELF-HOST-RENDERER.md) and [renderer/README.md](renderer/README.md). Queue + bot routine: [docs/QUEUE.md](docs/QUEUE.md), [docs/BOT-ROUTINE.md](docs/BOT-ROUTINE.md).

## Split of ownership

| Layer | Owner |
|---|---|
| Templates, timeline JSON, local renderer | This repo (you + Claude Code) |
| Queue Sheet / Drive MP4s | Google |
| STATUS, Kristin review ops | Grok Bot project *Compass Rose Social* |

## Historical JSON2Video

Older movie JSON lives under `examples/reel-*.json` and talks to JSON2Video MCP (`.mcp.json`). Keep those files as reference. Do **not** submit them to `renderer/` — the schemas differ. The JSON2Video free-plan watermark is why finals moved in-house.

If you still need the old MCP locally, `JSON2VIDEO_API_KEY` stays in your shell only (see `.env.example`). Repo secrets are not injected into Claude Code.

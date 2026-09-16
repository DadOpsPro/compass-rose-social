# Kristin editor (`web/`)

Phone-friendly Next.js App Router UI for drafting silent Reel copy and picking **one** typeface for the whole Reel.

**This app is UI only. It does not run FFmpeg.** Vercel serverless and Edge cannot host `renderer/`. Remote MP4s are produced by [`.github/workflows/render-reel.yml`](../.github/workflows/render-reel.yml) (ubuntu + apt FFmpeg). Locally: `node renderer/bin/render.mjs <draft.json> -o out/reel.mp4`.

Full split of Vercel vs GitHub Actions: [docs/KRISTIN-EDITOR.md](../docs/KRISTIN-EDITOR.md).

## Run locally

From this directory (`web/`):

```bash
npm install
npm run dev
# → http://localhost:3000
```

Optional: `cp .env.example .env.local` and set `EDITOR_PASSWORD`.

Open the editor, change beat text and the font dropdown (`montserrat` | `bebas` | `oswald` | `playfair` | `poppins` | `anton` — same ids as `npm run fonts` at the repo root), then **Save draft**. That downloads JSON the existing renderer accepts. Locally it also writes `web/drafts/*.json` (gitignored).

Without render secrets, **Request render** stays useful: it tells you to download JSON and render on a machine that has FFmpeg.

```bash
npm run validate   # sample JSON parses in renderer/lib/timeline.mjs
```

## Deploy on Vercel

1. Import `DadOpsPro/compass-rose-social`.
2. Set **Root Directory** to `web`.
3. Framework Preset: Next.js. Do **not** add an FFmpeg install command.
4. Env (Production):
   - `EDITOR_PASSWORD` — shared gate (or use Vercel Deployment Protection and leave this empty)
   - `RENDER_DISPATCH_TOKEN` — GitHub PAT that can dispatch workflows (or `GITHUB_TOKEN`)
   - `GITHUB_REPOSITORY` — `DadOpsPro/compass-rose-social`
   - `PREVIEW_VIDEO_URL` — optional public MP4 for the preview player

The API route `POST /api/render` calls GitHub `repository_dispatch` with `event_type: render-reel` when those secrets exist. Otherwise the UI falls back to “download JSON and render locally.”

## What Kristin can do

- Load the GSL sample (`samples/gsl.json`, based on `examples/self-host-gsl-silent.json`)
- Edit `text.content` per beat (newlines kept)
- Pick one root `font` for the Reel
- Save / download renderer-compatible JSON
- Request a remote render (Actions artifact) when a token is configured
- See a preview video if `PREVIEW_VIDEO_URL` is set

# Kristin editor — Vercel UI vs GitHub Actions render

The editor in [`web/`](../web/) is a small Next.js App Router app for Kristin (phone-first). She edits beat copy, picks **one** typeface for the Reel, and saves a timeline JSON the existing `renderer/` accepts.

## Do not run FFmpeg on Vercel

**Vercel serverless and Edge must not invoke FFmpeg, `renderer/bin/render.mjs`, or any encode step.** There is no FFmpeg binary on Vercel, and this repo will not add one.

| Layer | Where | Does |
|---|---|---|
| Editor UI | Vercel (`web/`) or `npm run dev` in `web/` | Edit `scenes[].text.content`, set root `font`, download JSON, optional password gate |
| Silent MP4 | GitHub Actions `render-reel.yml` (ubuntu + `apt install ffmpeg`) | `node renderer/bin/render.mjs <json> -o out/reel.mp4`, upload artifact |
| Laptop fallback | Any machine with FFmpeg + this repo | Same CLI as today — no secrets required |

`web/next.config.ts` and `web/README.md` repeat the same rule.

## Font ids

The dropdown ids **must** match `renderer/lib/fonts.mjs`:

`montserrat` · `bebas` · `oswald` · `playfair` · `poppins` · `anton`

The UI sets `"font"` once at the timeline root. It does not write per-scene `text.font` (the renderer rejects that). Note on screen: “One font for the whole Reel.”

## Auth (MVP)

Prefer a shared password, not OAuth.

- Set `EDITOR_PASSWORD` on Vercel (and in `web/.env.local` if you want a local gate).
- The editor sets an httpOnly cookie after a correct POST to `/api/auth`.
- If `EDITOR_PASSWORD` is unset, the UI is open. That is convenient on localhost. For production, either set the password **or** turn on [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection).

Do not check the password into git.

## Save draft

**Save draft** always downloads JSON in the browser.

- Local `next dev`: `POST /api/draft` also writes `web/drafts/<name>.json` (gitignored).
- Vercel: the filesystem is ephemeral, so the API returns “download instead” and the app stays useful.

Render that file:

```bash
node renderer/bin/render.mjs web/drafts/compass-rose-bebas.json -o out/reel.mp4
# or the file Kristin downloaded
```

## Request render (GitHub Actions)

`POST /api/render` (from the **Request render** button):

1. If `RENDER_DISPATCH_TOKEN` **or** `GITHUB_TOKEN` is set **and** `GITHUB_REPOSITORY` (or `GITHUB_OWNER` + `GITHUB_REPO`) is set, the API POSTs to GitHub:

   ```http
   POST /repos/{owner}/{repo}/dispatches
   ```

   ```json
   {
     "event_type": "render-reel",
     "client_payload": {
       "draft": { "...timeline JSON..." },
       "output_name": "reel.mp4",
       "requested_by": "kristin-editor"
     }
   }
   ```

2. If those env vars are missing, the API returns a **fallback** (HTTP 200): download JSON and render locally. The editor is still useful without secrets.

### Token needs

The token lives on **Vercel**, not in the workflow (Actions already has `GITHUB_TOKEN` for checkout / artifacts).

| Name | Where | Why |
|---|---|---|
| `RENDER_DISPATCH_TOKEN` or `GITHUB_TOKEN` | Vercel project env | PAT that can create `repository_dispatch` on this repo |
| `GITHUB_REPOSITORY` | Vercel | `DadOpsPro/compass-rose-social` |
| `EDITOR_PASSWORD` | Vercel | Shared editor gate |
| `PREVIEW_VIDEO_URL` | Vercel | Optional public MP4 for the in-page player |

Fine-grained PAT: **Actions: write** (and contents read) on this repository. Classic PAT: `repo` scope.

`github.token` inside a workflow cannot be copied to Vercel as a long-lived dispatch credential — mint a PAT (or GitHub App installation token) and store it as `RENDER_DISPATCH_TOKEN`.

### Manual Actions run

Actions → **Render Reel** → Run workflow:

- `draft_path` — repo path, default `examples/self-host-gsl-silent.json`
- `output_name` — default `reel.mp4`
- `commit_stills` — optional; commits `web/public/previews/last.png`

The job installs FFmpeg on `ubuntu-latest`, runs the renderer, and uploads:

- artifact `reel-mp4`
- artifact `reel-preview-still`

`client_payload.draft` from the editor is written to `web/drafts/ci-dispatch.json` for that job only (not committed).

## Preview in the UI

GitHub artifacts are private by default, so the editor cannot stream them without extra plumbing.

- If `PREVIEW_VIDEO_URL` is a public (or deployment-protected) HTTPS MP4, the player shows it.
- Otherwise the page says: render queued / download JSON and render locally.

Optional: tick `commit_stills` so a first frame lands under `web/public/previews/` after a Vercel redeploy. Still not a video; set `PREVIEW_VIDEO_URL` when you have a hosted MP4.

## Deploy

See [web/README.md](../web/README.md). Root Directory = `web`. No FFmpeg install on Vercel.

## Schema

Same as [SELF-HOST-RENDERER.md](SELF-HOST-RENDERER.md). Sample: [`web/samples/gsl.json`](../web/samples/gsl.json). Historical `examples/reel-*.json` (JSON2Video) will not load as a valid renderer draft.

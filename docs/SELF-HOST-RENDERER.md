# Self-hosted silent Reel renderer

Production finals are rendered **locally** with `renderer/` (FFmpeg). JSON2Video is historical only — the free plan watermarks every export, and this stack does not use that API.

Silent 9:16 H.264 MP4. No audio track. No watermark. Kristin adds trending audio in review.

## Setup (Mac)

```bash
brew install ffmpeg
node -v          # 18+
git clone <this repo>
cd <this repo>
```

Confirm FFmpeg can encode H.264 and draw text:

```bash
ffmpeg -hide_banner -encoders | grep libx264
ffmpeg -hide_banner -filters | grep drawtext
```

Homebrew’s `ffmpeg` formula includes both. Then:

```bash
npm run smoke
# → out/smoke.mp4  (1080×1920, silent, >100KB)
npm run fonts
# → montserrat (default), bebas, oswald, playfair, poppins, anton
```

Linux: `sudo apt install ffmpeg`. Same `npm run smoke`.

The Kristin editor (`web/`) never runs this renderer. Vercel is UI only. Remote encodes use [`.github/workflows/render-reel.yml`](../.github/workflows/render-reel.yml) (ubuntu FFmpeg). See [KRISTIN-EDITOR.md](KRISTIN-EDITOR.md).

No JSON2Video API key. No `npm install` (zero Node dependencies). Six SIL OFL typefaces are bundled under `renderer/fonts/<preset>/`. Default is Montserrat ExtraBold (`montserrat`). List ids: `npm run fonts`.

## Render a timeline

```bash
npm run render -- renderer/examples/smoke.json -o out/reel.mp4
node renderer/bin/render.mjs examples/self-host-gsl-silent.json -o out/gsl.mp4
node renderer/bin/render.mjs examples/self-host-gsl-drive-bebas.json -o out/gsl-bebas.mp4
```

Drop MP4s into the Drive queue folder; never commit them. See [QUEUE.md](QUEUE.md).

## Schema (not JSON2Video)

Old files under `examples/reel-*.json` use JSON2Video `elements[]` / `style: "001"`. The local renderer will reject them. Use the shape below (also `renderer/schema.json`).

```json
{
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "font": "montserrat",
  "scenes": [
    {
      "duration": 3.5,
      "transition": { "type": "fade", "duration": 0.35 },
      "image": { "src": "./assets/01.jpg", "fit": "cover", "zoom": 1.08, "pan": "right" },
      "text": {
        "content": "All-inclusive isn't\nthe flex you think",
        "position": "lower-third",
        "fontSize": 64,
        "color": "#FFFFFF",
        "background": "rgba(0,0,0,0.45)"
      }
    }
  ]
}
```

Paths in `image.src` are relative to the JSON file. `https://` URLs are downloaded at render time. `color:#1B4F72` builds a placeholder still.

**Font:** set `"font"` (or `"typeface"`) at this root only. Every scene’s `text` is drawn in that face. Kristin’s rule: do not swap type systems mid-Reel. Different Reels may pick different presets.

## Knobs

Chris (2026-09-13): JSON2Video v2 zoom + 0.5s fades felt too fast. Start here and nudge.

| Knob | Where | Suggested | Notes |
|---|---|---|---|
| Beat length | `scenes[].duration` | **3.5s** (try 3.2–4.0) | Seconds of that still, including the overlap consumed by the *incoming* fade |
| Fade | `scenes[].transition` | `{ "type": "fade", "duration": 0.35 }` | Omit or `"type": "none"` for a hard cut. Ignored on scene 0. Try 0.25–0.40 if 0.35 feels off |
| Zoom | `image.zoom` | **1.08** (subtle 1.05–1.12) | Scale factor, **not** JSON2Video’s 1–3 intensity. `1` = still. `1.2+` looks jumpy |
| Pan | `image.pan` | `left` / `right` / `top` / `bottom` / `center` | Needs zoom > 1 (if you set pan with zoom `1`, the renderer applies 1.08 overscan so the move is visible) |
| Cover | `image.fit` | `cover` only | Full-bleed crop. No letterboxing |
| Font | root `font` (or `typeface`) | **`montserrat`** | One type system per Reel — same face on every beat. Valid ids: `montserrat`, `bebas`, `oswald`, `playfair`, `poppins`, `anton`. Omit for Montserrat ExtraBold. Do **not** set `text.font` on a scene (rejected). `npm run fonts` |
| Type | `text.content` | two short lines | `\n` or a real newline. White, dark bar + shadow. Face comes from root `font` |
| Placement | `text.position` | `lower-third` | Also `center`, `top`. Sits above IG/TikTok chrome |
| Size | `text.fontSize` | `64` | ~56–72 on 1080px |
| Bar | `text.background` | `rgba(0,0,0,0.45)` | `none` = shadow only |

Total length ≈ `sum(durations) − sum(fade durations)`.

## How it works

1. Each scene becomes a short silent MP4: cover-crop → optional Ken Burns (`zoompan`) → text PNG overlay (`drawtext` + bundled font).
2. Scenes are joined with FFmpeg `xfade` (fade) or `concat` (cut).
3. Final encode: `libx264`, CRF 18, `yuv420p`, `+faststart`, **`-an`**.

No SaaS, no logo, no burned-in URL.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ffmpeg not found` | `brew install ffmpeg` and open a new terminal |
| `Image not found` | Paths are relative to the **JSON file**, not the cwd |
| Letterboxing / black bars | Use `fit: "cover"` and a real photo; do not pre-pad the still |
| Type too fast / zoompy | Lower `zoom` toward 1.05; raise `duration`; shorten `transition.duration` |
| `Unknown font "..."` | Use a listed id: `montserrat` `bebas` `oswald` `playfair` `poppins` `anton`. `npm run fonts` |
| Old JSON2Video file rejected | Convert to the schema above; keep `examples/reel-*.json` as reference only |
| Want intermediates | `node renderer/bin/render.mjs … --keep-temp --verbose` |

## Historical JSON2Video

`examples/reel-gsl-silent-v2.json` and friends stay in the repo as the old SaaS movies. [JSON2VIDEO-KNOBS.md](JSON2VIDEO-KNOBS.md) documents that format. Do not use it for finals.

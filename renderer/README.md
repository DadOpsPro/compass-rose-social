# Silent Reel renderer

Local **FFmpeg** renderer for Compass Rose 9:16 Reels. No JSON2Video account, no API key, no watermark.

Output is a silent H.264 MP4 (`1080×1920`). Kristin adds trending audio in Instagram / TikTok.

## On a Mac

1. Install FFmpeg (Homebrew formula includes `libx264` and `drawtext`):

   ```bash
   brew install ffmpeg
   ffmpeg -version
   ```

2. Node 18+ (`node -v`). No `npm install` — this package has no npm dependencies.

3. From the repo root:

   ```bash
   # Smoke (public sample stills, ~4s, proves fade + zoom + type)
   npm run smoke

   # Any timeline
   npm run render -- renderer/examples/smoke.json -o out/reel.mp4
   node renderer/bin/render.mjs examples/self-host-gsl-silent.json -o out/gsl.mp4
   ```

Ubuntu/Debian: `sudo apt install ffmpeg` (needs `libx264` + freetype/drawtext — the default package is fine).

## Timeline JSON

Human/LLM-editable. **Not** the old JSON2Video `elements[]` format. Full knobs: [docs/SELF-HOST-RENDERER.md](../docs/SELF-HOST-RENDERER.md). Schema: [schema.json](schema.json).

```json
{
  "width": 1080,
  "height": 1920,
  "fps": 30,
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

`image.src` may be:

- a path relative to the JSON file
- an `https://` image URL
- `color:#1B4F72` (placeholder still)

## Examples

| File | Use |
|---|---|
| `examples/smoke.json` | Runnable two-beat demo (public stills) |
| `examples/gsl-silent.json` | GSL copy with `./assets/0N.jpg` placeholders |
| `../examples/self-host-gsl-silent.json` | Same copy, CDN stills so it renders without local photos |

Historical JSON2Video movies stay under `../examples/reel-*.json` — do not submit those to this renderer.

## CLI

```
node renderer/bin/render.mjs <timeline.json> -o out/reel.mp4
  --verbose      ffmpeg logs
  --keep-temp    keep per-scene intermediates
  --ffmpeg PATH  override binary
```

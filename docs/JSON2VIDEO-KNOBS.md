# JSON2Video knobs (GSL Reel) — historical

**Finals use [`renderer/`](../renderer/) now.** This page describes the old SaaS movie JSON (`examples/reel-*.json`). The free JSON2Video plan watermarks exports. For the local schema and knobs see [SELF-HOST-RENDERER.md](SELF-HOST-RENDERER.md).

Chris feedback (2026-09-13): v2 zoom + transitions felt too fast.

## Files
- `examples/reel-gsl-silent-v2.json` — exact render that produced CDN render `2026-09-13-1501af14cbc1748e` (zoom 3, fade 0.5s, duration 3s)
- `examples/reel-gsl-silent-v2-slower.json` — softer starting point (zoom 2, fade 0.35s, duration 3.5s)

## What to edit
| Field | Where | Notes |
| --- | --- | --- |
| `scenes[].duration` | each scene | Beat length in seconds |
| `scenes[].transition.duration` | scenes 2+ | Fade length; try 0.25–0.4 if 0.5 feels rushed |
| `scenes[].transition.style` | scenes 2+ | `fade` (default), also slide/wipe/etc. |
| image `zoom` | image elements | 1–2 subtle; 3 was too aggressive |
| image `pan` | image elements | `left` / `right` / `top` / `bottom` |
| text `style` | text elements | Use `001` — do **not** use `008` (renders invisible) |

## Render
With Claude Code MCP / CLI and `JSON2VIDEO_API_KEY` set, submit the movie JSON to `POST https://api.json2video.com/v2/movies`.

Free plan adds a JSON2Video.com watermark; paid plan removes it.

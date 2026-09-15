# Compass Rose Social — render rules

- **Silent only** — no audio track in `renderer/` output. Kristin adds trending audio in review.
- **Canvas** — `1080×1920` (9:16). Images use `"fit": "cover"` (full-bleed crop; never letterbox).
- **Production renderer** — `renderer/` (local FFmpeg). Not JSON2Video. No watermark, no API key.
- **Brand-pure** — Sandals themes = Sandals/UVI Sandals assets only; Beaches = Beaches only. No Hyatt/Moon Palace fillers on those themes.
- **Fonts** — one type system per Reel (headline + optional accent OK). Different Reels may use different pairings.
- **Locked Reel A** — Chris's Canva Sandals couples Reel A is look reference only. Do not regenerate those locked beats.
- **Statuses** — `draft` → `needs_audio` → `approved` → `scheduled` → `posted` / `rejected`.
- **No auto-post** without explicit GO.

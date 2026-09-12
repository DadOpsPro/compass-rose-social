# Compass Rose Social — render rules

- **Silent only** — no audio in JSON2Video. Kristin adds trending audio in review.
- **Canvas** — `1080×1920` (9:16). Images must use `"resize": "cover"` (not `fit` — ignored by JSON2Video and causes letterboxing).
- **Brand-pure** — Sandals themes = Sandals/UVI Sandals assets only; Beaches = Beaches only. No Hyatt/Moon Palace fillers on those themes.
- **Fonts** — one type system per Reel (headline + optional accent OK). Different Reels may use different pairings.
- **Locked Reel A** — Chris's Canva Sandals couples Reel A is look reference only. Do not regenerate those locked beats.
- **Statuses** — `draft` → `needs_audio` → `approved` → `scheduled` → `posted` / `rejected`.
- **No auto-post** without explicit GO.

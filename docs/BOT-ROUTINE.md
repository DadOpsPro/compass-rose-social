# Bot routine (paste into Compass Rose Social)

Weekly Compass Rose NON-talking-head Reels batch.

GOAL: Next week’s 3–5 silent full 9:16 Reels. Nothing posts. Kristin adds audio in review; then schedule after GO.

PRODUCTION ENGINE (Chris locked): Claude Code writes `renderer/` timeline JSON (see `renderer/schema.json`). GitHub Actions (`Render silent Reel`) encodes with local FFmpeg. NOT JSON2Video, Canva Magic Design, Creatomate, or Remotion. Canva is reference-only for Reel A look.

Gate: blocked on next-week queue rows + brand stills. Do NOT wait on a JSON2Video API key. If this fires with no rows/stills, stay quiet unless Chief asks for a handoff status; note blocked on queue + stills.

When rows + stills are live: write one JSON per Reel into `queue/pending/` (Actions renders on push, or Monday 14:00 UTC). Use UVI https://www.uvi-sandbox.com/share/30698F2D-FFDB-43AD-9236D0EF09E1E8DF/?viewType=grid plus brand CDN rules.

BRAND IMAGES: Sandals themes → Sandals only; Beaches themes → Beaches only; quiet-pool/deal FOMO may use Hyatt/Moon Palace/Sandals when caption matches — never mislabel.
FONT: one root `"font"` per Reel (`montserrat` default). CTA/quiz on beat 5.
Do not regenerate Chris’s locked A beats.

HANDOFF: Tell Chief Actions artifact + Drive folder links + captions for Chris/Kristin review. Short note to the user. Do not email Kristin unless Chief enables outbound. Do not post.
Update project compass-rose-social STATUS (done/next/blocked) when progress changes.

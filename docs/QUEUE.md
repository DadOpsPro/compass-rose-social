# Queue (Sheet + Drive)

Git holds templates, timeline JSON, and the renderer. MP4s never live in this repo.

| Resource | Link |
|---|---|
| **Live Drive queue (DadOps)** | https://drive.google.com/drive/folders/1wc353Q7H1jFCBLjtaitj-k_fFki-fXe9 |
| Photo library | https://drive.google.com/drive/folders/175iW8-SsgOmnmkvUBazqwUL1k88HV-xE |
| Content queue Sheet | https://docs.google.com/spreadsheets/d/1vjtGsWtHozDn9ONQCHzi3Bq5If2y_EN3dhuYQqIQ5r0/edit |
| UVI asset sandbox | https://www.uvi-sandbox.com/share/30698F2D-FFDB-43AD-9236D0EF09E1E8DF/?viewType=grid |
| Archived Drive folder (do not use) | https://drive.google.com/drive/folders/1X8C6LtfiLN4KK4O3sRitPuGzvplw8guT |

**Flow**

1. Bot writes `renderer/` JSON into `queue/pending/`.
2. GitHub Action **Render silent Reel** encodes a silent 1080×1920 MP4 (push to pending, Monday 14:00 UTC, or **Run workflow**).
3. Download the `silent-reels` artifact → drop MP4s in the live DadOps Drive folder.
4. Sheet status `needs_audio` for Kristin → she adds audio / approves → schedule after GO.

Never commit MP4s. Do not use JSON2Video for finals (watermark). Drive upload from Actions is not wired yet.

Grok Bot project **Compass Rose Social** owns STATUS / Kristin ops. Paste-ready routine: [BOT-ROUTINE.md](BOT-ROUTINE.md).

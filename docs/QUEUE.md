# Queue (Sheet + Drive)

Git holds templates and code. The queue of record is Google Sheet + Drive.

| Resource | Link |
|---|---|
| Drive queue folder | https://drive.google.com/drive/folders/1X8C6LtfiLN4KK4O3sRitPuGzvplw8guT |
| Content queue Sheet | https://docs.google.com/spreadsheets/d/1x9Egipe4B8b6cURvVbK3KdGKKdF22n15tLU9-_4EBN0/edit |
| UVI asset sandbox | https://www.uvi-sandbox.com/share/30698F2D-FFDB-43AD-9236D0EF09E1E8DF/?viewType=grid |

**Flow:** draft timeline JSON in this repo → render a silent MP4 with `renderer/` (`npm run render -- <json> -o out/reel.mp4`) → drop MP4 in Drive → set Sheet status `needs_audio` for Kristin → she adds audio / approves → schedule (later: n8n → Meta/TikTok). Never commit MP4s here. Do not use JSON2Video for finals (free-plan watermark).

Grok Bot project **Compass Rose Social** owns STATUS / Kristin ops separately from this repo.

# Compass Rose Social

Silent 9:16 Reels for Compass Rose Leisure — **Claude Code + JSON2Video**.

Kristin adds trending audio in review. No talking-head. No auto-post without GO.

## Setup (Claude Code)

1. Clone this repo and open it in Claude Code.
2. Set your API key in the **local** environment (do not commit it; see [Secrets](#secrets)):

   ```bash
   export JSON2VIDEO_API_KEY=your_key_here
   ```

3. MCP is declared in `.mcp.json`. If `${JSON2VIDEO_API_KEY}` does not expand in your Claude Code build, set the key via Claude settings / shell env and keep `.mcp.json` as-is, or use:

   ```bash
   claude mcp add-json json2video '{"type":"stdio","command":"npx","args":["-y","@json2video/cli","mcp"],"env":{"JSON2VIDEO_API_KEY":"YOUR_KEY"}}'
   ```

4. Restart / new session → run `/mcp` and confirm `json2video` is connected.


## Secrets

| Where | What |
|---|---|
| **Claude Code (local)** | Export `JSON2VIDEO_API_KEY` in your shell / Claude env so `.mcp.json` / MCP can use it. Repo secrets are **not** injected into Claude Code. |
| **GitHub Actions** | The repository secret `JSON2VIDEO_API_KEY` is for CI workflows only (when we add a render workflow). Never commit the key. |

## Quick dry-run

Render `examples/dry-run-silent.json` (placeholder images; production uses UVI Sandals/Beaches assets).

See [docs/RULES.md](docs/RULES.md) and [docs/QUEUE.md](docs/QUEUE.md).

## Split of ownership

| Layer | Owner |
|---|---|
| Templates, movie JSON, MCP config | This repo (you + Claude Code) |
| Queue Sheet / Drive MP4s | Google |
| STATUS, Kristin review ops | Grok Bot project *Compass Rose Social* |

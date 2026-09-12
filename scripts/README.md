# Render scripts

## Claude Code (preferred)

1. Export `JSON2VIDEO_API_KEY` (or set it in Claude Code / shell env).
2. Open this repo; confirm `.mcp.json` loads (`/mcp` → `json2video` connected).
3. Ask Claude Code to validate and render `examples/dry-run-silent.json` (silent, 9:16, `resize: cover`).
4. Save the CDN MP4 into the Drive queue folder; update the Sheet.

## CLI

```bash
export JSON2VIDEO_API_KEY=...
npx -y @json2video/cli movie render examples/dry-run-silent.json
```

(Exact subcommands may vary — check `npx @json2video/cli --help`.)

Always: no audio element; images use `"resize": "cover"`.

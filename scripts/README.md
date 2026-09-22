# Render scripts

## Local renderer (production)

```bash
brew install ffmpeg          # Mac
npm run smoke                # writes out/smoke.mp4
npm run render -- examples/self-host-gsl-silent.json -o out/gsl.mp4
```

CI (same encoder as Actions):

```bash
TIMELINE=examples/self-host-gsl-silent.json npm run ci-render
TIMELINE=pending npm run ci-render   # queue/pending/*.json; no-ops if empty
```

See [renderer/README.md](../renderer/README.md) and [docs/SELF-HOST-RENDERER.md](../docs/SELF-HOST-RENDERER.md).

Always: no audio; images `fit: "cover"`; no JSON2Video API key.

## Historical JSON2Video (do not use for finals)

The files in `examples/reel-*.json` are the old SaaS movies. Free-plan renders are watermarked.

```bash
export JSON2VIDEO_API_KEY=...
npx -y @json2video/cli movie render examples/dry-run-silent.json
```

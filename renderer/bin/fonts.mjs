#!/usr/bin/env node
import { DEFAULT_FONT_ID, FONT_PRESETS, formatFontHelp, fontFilePath, listFontIds } from "../lib/fonts.mjs";

const asJson = process.argv.includes("--json");

if (asJson) {
  const fonts = listFontIds().map((id) => {
    const p = FONT_PRESETS[id];
    return {
      id,
      family: p.family,
      file: p.file,
      path: fontFilePath(p),
      license: p.license,
      description: p.description,
    };
  });
  console.log(JSON.stringify({ default: DEFAULT_FONT_ID, fonts }, null, 2));
} else {
  console.log(formatFontHelp());
}

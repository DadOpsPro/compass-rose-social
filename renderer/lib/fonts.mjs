import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FONTS_DIR = fileURLToPath(new URL("../fonts/", import.meta.url));

export const DEFAULT_FONT_ID = "montserrat";

/**
 * Named typefaces for a whole Reel. Pick one at the timeline root
 * (`"font": "bebas"`). Do not swap faces mid-Reel.
 */
export const FONT_PRESETS = {
  montserrat: {
    id: "montserrat",
    family: "Montserrat ExtraBold",
    file: "montserrat/Montserrat-ExtraBold.ttf",
    license: "SIL OFL 1.1",
    description: "Default. Tight ExtraBold sans — current Compass Rose look.",
    wrap: { emScale: 0.58, wordGap: true },
  },
  bebas: {
    id: "bebas",
    family: "Bebas Neue Regular",
    file: "bebas/BebasNeue-Regular.ttf",
    license: "SIL OFL 1.1",
    description: "Condensed display. Punchy hooks and all-caps lines.",
    wrap: { emScale: 0.42, wordGap: false },
  },
  oswald: {
    id: "oswald",
    family: "Oswald Bold",
    file: "oswald/Oswald-Bold.ttf",
    license: "SIL OFL 1.1",
    description: "Narrow gothic sans. Editorial / newsy.",
    wrap: { emScale: 0.48, wordGap: false },
  },
  playfair: {
    id: "playfair",
    family: "Playfair Display Bold",
    file: "playfair/PlayfairDisplay-Bold.ttf",
    license: "SIL OFL 1.1",
    description: "Elegant serif. Luxury / destination.",
    wrap: { emScale: 0.56, wordGap: false },
  },
  poppins: {
    id: "poppins",
    family: "Poppins Bold",
    file: "poppins/Poppins-Bold.ttf",
    license: "SIL OFL 1.1",
    description: "Friendly rounded geometric sans.",
    wrap: { emScale: 0.54, wordGap: false },
  },
  anton: {
    id: "anton",
    family: "Anton Regular",
    file: "anton/Anton-Regular.ttf",
    license: "SIL OFL 1.1",
    description: "Impact / all-caps friendly condensed sans.",
    wrap: { emScale: 0.4, wordGap: false },
  },
};

const ALIASES = {
  "montserrat-extrabold": "montserrat",
  "bebas-neue": "bebas",
  bebasneue: "bebas",
  "playfair-display": "playfair",
  playfairdisplay: "playfair",
};

export function listFontIds() {
  return Object.keys(FONT_PRESETS);
}

export function formatValidFontIds() {
  return listFontIds().join(", ");
}

export function normalizeFontId(raw) {
  if (raw == null || raw === "") return DEFAULT_FONT_ID;
  const key = String(raw).trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!key) return DEFAULT_FONT_ID;
  if (FONT_PRESETS[key]) return key;
  if (ALIASES[key]) return ALIASES[key];
  return null;
}

export function fontFilePath(presetOrId) {
  const preset = typeof presetOrId === "string" ? FONT_PRESETS[presetOrId] : presetOrId;
  if (!preset) throw unknownFontError(presetOrId);
  return path.join(FONTS_DIR, preset.file);
}

export function resolveFont(rawId) {
  const id = normalizeFontId(rawId);
  if (!id) throw unknownFontError(rawId);
  const preset = FONT_PRESETS[id];
  const filePath = fontFilePath(preset);
  if (!existsSync(filePath)) {
    const err = new Error(`Bundled font file missing for "${id}": ${filePath}`);
    err.code = "FONT";
    throw err;
  }
  return { ...preset, filePath };
}

export function unknownFontError(rawId) {
  const shown = rawId == null || rawId === "" ? "(empty)" : String(rawId);
  const err = new Error(
    `Unknown font "${shown}". Valid ids: ${formatValidFontIds()}. Omit font for default ${DEFAULT_FONT_ID}.`,
  );
  err.code = "FONT";
  return err;
}

export function formatFontHelp() {
  const rows = listFontIds().map((id) => {
    const p = FONT_PRESETS[id];
    const mark = id === DEFAULT_FONT_ID ? " (default)" : "";
    return `  ${id.padEnd(12)} ${p.family}${mark} — ${p.description}`;
  });
  return [
    "Typeface presets (set once at the timeline root; same face on every beat):",
    '  "font": "bebas"     also accepts "typeface" as a synonym',
    ...rows,
    "  npm run fonts       print this list",
  ].join("\n");
}

export const FONT_FILE = fontFilePath(FONT_PRESETS[DEFAULT_FONT_ID]);

/** Must match renderer/lib/fonts.mjs FONT_PRESETS ids. */
export const FONT_IDS = [
  "montserrat",
  "bebas",
  "oswald",
  "playfair",
  "poppins",
  "anton",
] as const;

export type FontId = (typeof FONT_IDS)[number];

export const DEFAULT_FONT_ID: FontId = "montserrat";

export const FONT_OPTIONS: {
  id: FontId;
  label: string;
  family: string;
  note: string;
}[] = [
  {
    id: "montserrat",
    label: "Montserrat ExtraBold",
    family: '"Montserrat", sans-serif',
    note: "Default Compass Rose look",
  },
  {
    id: "bebas",
    label: "Bebas Neue",
    family: '"Bebas Neue", sans-serif',
    note: "Punchy condensed hooks",
  },
  {
    id: "oswald",
    label: "Oswald Bold",
    family: '"Oswald", sans-serif',
    note: "Editorial / newsy",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    family: '"Playfair Display", serif',
    note: "Luxury / destination",
  },
  {
    id: "poppins",
    label: "Poppins Bold",
    family: '"Poppins", sans-serif',
    note: "Friendly geometric sans",
  },
  {
    id: "anton",
    label: "Anton",
    family: '"Anton", sans-serif',
    note: "Impact / all-caps",
  },
];

export function isFontId(value: string): value is FontId {
  return (FONT_IDS as readonly string[]).includes(value);
}

export function normalizeFontId(raw: unknown): FontId {
  if (typeof raw !== "string" || !raw.trim()) return DEFAULT_FONT_ID;
  const key = raw.trim().toLowerCase();
  return isFontId(key) ? key : DEFAULT_FONT_ID;
}

export function fontOption(id: FontId) {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}

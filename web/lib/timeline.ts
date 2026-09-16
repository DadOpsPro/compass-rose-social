import { DEFAULT_FONT_ID, isFontId, normalizeFontId, type FontId } from "./fonts";

export type SceneText = {
  content: string;
  position?: string;
  fontSize?: number;
  color?: string;
  background?: string;
  [key: string]: unknown;
};

export type Scene = {
  duration?: number;
  transition?: { type?: string; duration?: number; [key: string]: unknown };
  image?: { src?: string; fit?: string; zoom?: number; pan?: string; [key: string]: unknown };
  text?: SceneText;
  [key: string]: unknown;
};

export type Timeline = {
  comment?: string;
  width?: number;
  height?: number;
  fps?: number;
  font?: string;
  typeface?: string;
  scenes: Scene[];
  [key: string]: unknown;
};

export function isTimeline(value: unknown): value is Timeline {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
  const scenes = (value as { scenes?: unknown }).scenes;
  return Array.isArray(scenes) && scenes.length > 0;
}

export function cloneTimeline(raw: Timeline): Timeline {
  return structuredClone(raw);
}

export function readRootFont(draft: Timeline): FontId {
  return normalizeFontId(draft.font || draft.typeface || DEFAULT_FONT_ID);
}

export function sceneText(scene: Scene | undefined): string {
  return typeof scene?.text?.content === "string" ? scene.text.content : "";
}

/** Apply Kristin's edits. Preserve every other timeline field for the renderer. */
export function applyEdits(base: Timeline, font: string, texts: string[]): Timeline {
  const next = cloneTimeline(base);
  const fontId = isFontId(font) ? font : DEFAULT_FONT_ID;
  next.font = fontId;
  delete next.typeface;
  next.scenes = next.scenes.map((scene, i) => {
    const content = texts[i] ?? sceneText(scene);
    const text = { ...(scene.text ?? {}), content };
    return { ...scene, text };
  });
  return next;
}

export function downloadFilename(draft: Timeline): string {
  const font = readRootFont(draft);
  return `compass-rose-${font}.json`;
}

export function prettyJson(draft: Timeline): string {
  return `${JSON.stringify(draft, null, 2)}\n`;
}

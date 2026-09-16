#!/usr/bin/env node
/**
 * Confirm the Kristin-editor sample (and an edited clone) is accepted
 * by the existing zero-dep renderer — not by re-implementing validation.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseTimeline } from "../../renderer/lib/timeline.mjs";
import { FONT_PRESETS } from "../../renderer/lib/fonts.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.join(here, "../samples/gsl.json");

const raw = JSON.parse(await readFile(samplePath, "utf8"));
const parsed = parseTimeline(raw, { sourceLabel: "web/samples/gsl.json" });

if (parsed.font !== "montserrat") {
  throw new Error(`Expected sample font montserrat, got ${parsed.font}`);
}
if (parsed.scenes.length !== 5) {
  throw new Error(`Expected 5 GSL beats, got ${parsed.scenes.length}`);
}

const edited = structuredClone(raw);
edited.font = "bebas";
edited.scenes[0].text.content = "Edited hook\nsecond line";
const editedParsed = parseTimeline(edited, { sourceLabel: "edited-sample" });
if (editedParsed.font !== "bebas") {
  throw new Error(`Edited font should be bebas, got ${editedParsed.font}`);
}
if (!editedParsed.scenes[0].text.content.includes("Edited hook")) {
  throw new Error("Edited scene text was not preserved");
}

const ids = Object.keys(FONT_PRESETS);
const expected = ["montserrat", "bebas", "oswald", "playfair", "poppins", "anton"];
if (ids.join(",") !== expected.join(",")) {
  throw new Error(`Renderer font ids drifted: ${ids.join(", ")}`);
}

console.log(
  `ok  sample ${path.relative(process.cwd(), samplePath)}  scenes=${parsed.scenes.length}  font=${parsed.font}  presets=${ids.join(",")}`,
);

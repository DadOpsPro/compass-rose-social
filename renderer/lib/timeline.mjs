/**
 * Parse and validate a silent-reel timeline JSON.
 * Schema is inspired by JSON2Video but is not compatible with it.
 */

const DEFAULTS = {
  width: 1080,
  height: 1920,
  fps: 30,
};

const PANS = new Set(["left", "right", "top", "bottom", "center", "none"]);

export function parseTimeline(raw, { sourceLabel = "timeline" } = {}) {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    throw fail(`${sourceLabel} must be a JSON object`);
  }

  const width = intField(raw.width, DEFAULTS.width, "width");
  const height = intField(raw.height, DEFAULTS.height, "height");
  const fps = intField(raw.fps, DEFAULTS.fps, "fps");

  if (width < 16 || height < 16) throw fail("width and height must be >= 16");
  if (fps < 1 || fps > 120) throw fail("fps must be between 1 and 120");

  if (!Array.isArray(raw.scenes) || raw.scenes.length === 0) {
    throw fail("timeline.scenes must be a non-empty array");
  }

  const scenes = raw.scenes.map((scene, i) => parseScene(scene, i));
  const plan = planTransitions(scenes);

  return {
    comment: typeof raw.comment === "string" ? raw.comment : "",
    width,
    height,
    fps,
    scenes,
    plan,
  };
}

function parseScene(scene, index) {
  const label = `scenes[${index}]`;
  if (scene == null || typeof scene !== "object") {
    throw fail(`${label} must be an object`);
  }

  const duration = numberField(scene.duration, null, `${label}.duration`);
  if (duration == null || duration <= 0) {
    throw fail(`${label}.duration must be a positive number of seconds`);
  }

  const image = parseImage(scene.image, label);
  const text = parseText(scene.text, label);
  const transition = parseTransition(scene.transition, label, index, duration);

  return { index, duration, image, text, transition };
}

function parseImage(image, label) {
  if (image == null || typeof image !== "object") {
    throw fail(`${label}.image is required (object with src)`);
  }
  const src = typeof image.src === "string" ? image.src.trim() : "";
  if (!src) throw fail(`${label}.image.src is required`);

  const fit = (image.fit || "cover").toLowerCase();
  if (fit !== "cover") {
    throw fail(`${label}.image.fit must be "cover" (letterboxing is not supported)`);
  }

  let zoom = image.zoom == null ? 1 : numberField(image.zoom, 1, `${label}.image.zoom`);
  if (zoom < 1) throw fail(`${label}.image.zoom must be >= 1 (1 = still, 1.05–1.12 = subtle)`);
  if (zoom > 1.4) {
    throw fail(`${label}.image.zoom ${zoom} is too aggressive; use ~1.05–1.12 (this is a scale factor, not JSON2Video's 1–3)`);
  }

  const panRaw = image.pan == null ? "center" : String(image.pan).toLowerCase();
  if (!PANS.has(panRaw)) {
    throw fail(`${label}.image.pan must be left|right|top|bottom|center`);
  }
  const pan = panRaw === "none" ? "center" : panRaw;

  // Pan needs extra pixels; if the editor asked for pan at zoom 1, add a light overscan.
  if (pan !== "center" && zoom === 1) {
    zoom = 1.08;
  }

  return { src, fit, zoom, pan };
}

function parseText(text, label) {
  if (text == null) return null;
  if (typeof text !== "object") throw fail(`${label}.text must be an object or omitted`);

  const content = text.content != null ? String(text.content) : "";
  if (!content.trim()) return null;

  const position = (text.position || "lower-third").toLowerCase();
  if (!["lower-third", "center", "top"].includes(position)) {
    throw fail(`${label}.text.position must be lower-third|center|top`);
  }

  const fontSize = text.fontSize == null
    ? 64
    : numberField(text.fontSize, 64, `${label}.text.fontSize`);
  if (fontSize < 12 || fontSize > 200) {
    throw fail(`${label}.text.fontSize must be between 12 and 200`);
  }

  return {
    content,
    position,
    fontSize,
    color: text.color || "#FFFFFF",
    background: text.background === undefined ? "rgba(0,0,0,0.45)" : text.background,
  };
}

function parseTransition(transition, label, index, duration) {
  if (transition == null) {
    return index === 0 ? { type: "none", duration: 0 } : { type: "none", duration: 0 };
  }
  if (typeof transition !== "object") {
    throw fail(`${label}.transition must be an object`);
  }

  const type = (transition.type || "none").toLowerCase();
  if (!["fade", "none", "cut"].includes(type)) {
    throw fail(`${label}.transition.type must be fade|none|cut`);
  }

  if (index === 0 || type === "none" || type === "cut") {
    return { type: "none", duration: 0 };
  }

  let fade = transition.duration == null
    ? 0.35
    : numberField(transition.duration, 0.35, `${label}.transition.duration`);
  if (fade < 0) throw fail(`${label}.transition.duration must be >= 0`);
  if (fade === 0) return { type: "none", duration: 0 };

  // xfade offset is previousDuration - fade; fade must be shorter than both sides.
  const maxFade = Math.max(0.05, duration - 0.05);
  if (fade > maxFade) {
    fade = maxFade;
  }

  return { type: "fade", duration: fade };
}

/**
 * xfade offset_i is when scene i starts dissolving over the accumulated cut.
 * After each fade the running length grows by (scene.duration - fade).
 */
export function planTransitions(scenes) {
  const fades = [];
  let running = scenes[0].duration;

  for (let i = 1; i < scenes.length; i++) {
    const fade = scenes[i].transition.type === "fade" ? scenes[i].transition.duration : 0;
    if (fade > 0) {
      const prevDur = scenes[i - 1].duration;
      const maxFade = Math.min(prevDur, scenes[i].duration) - 0.05;
      const used = Math.min(fade, Math.max(0, maxFade));
      const offset = running - used;
      if (offset < 0) {
        throw fail(`transition into scenes[${i}] is longer than the previous timeline`);
      }
      fades.push({ into: i, duration: used, offset });
      running += scenes[i].duration - used;
    } else {
      fades.push({ into: i, duration: 0, offset: running });
      running += scenes[i].duration;
    }
  }

  return { totalDuration: running, fades };
}

export function sceneFrameCount(duration, fps) {
  return Math.max(1, Math.round(duration * fps));
}

function intField(value, fallback, name) {
  if (value == null) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n)) throw fail(`${name} must be an integer`);
  return n;
}

function numberField(value, fallback, name) {
  if (value == null) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) throw fail(`${name} must be a number`);
  return n;
}

function fail(message) {
  const err = new Error(message);
  err.code = "TIMELINE";
  return err;
}

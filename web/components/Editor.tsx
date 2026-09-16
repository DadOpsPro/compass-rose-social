"use client";

import { useMemo, useRef, useState } from "react";
import { FONT_OPTIONS, fontOption, type FontId } from "../lib/fonts";
import {
  applyEdits,
  downloadFilename,
  isTimeline,
  prettyJson,
  readRootFont,
  sceneText,
  type Timeline,
} from "../lib/timeline";

type Banner = { kind: "ok" | "warn" | "err"; text: string } | null;

type Props = {
  sample: Timeline;
  previewUrl: string;
  authRequired: boolean;
  renderConfigured: boolean;
};

export function Editor({ sample, previewUrl, authRequired, renderConfigured }: Props) {
  const [draft, setDraft] = useState<Timeline>(sample);
  const [font, setFont] = useState<FontId>(readRootFont(sample));
  const [texts, setTexts] = useState(() => sample.scenes.map(sceneText));
  const [busy, setBusy] = useState<"save" | "render" | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = fontOption(font);

  const current = useMemo(() => applyEdits(draft, font, texts), [draft, font, texts]);

  function resetSample() {
    setDraft(sample);
    setFont(readRootFont(sample));
    setTexts(sample.scenes.map(sceneText));
    setBanner({ kind: "ok", text: "Reloaded the GSL sample draft." });
  }

  function downloadJson() {
    const blob = new Blob([prettyJson(current)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename(current);
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveDraft() {
    setBusy("save");
    setBanner(null);
    downloadJson();
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: downloadFilename(current), draft: current }),
      });
      const data = (await res.json()) as { saved?: boolean; path?: string; reason?: string; error?: string };
      if (!res.ok) {
        setBanner({ kind: "err", text: data.error || "Could not save draft." });
        return;
      }
      if (data.saved && data.path) {
        setBanner({ kind: "ok", text: `Downloaded JSON and wrote ${data.path}.` });
      } else {
        setBanner({
          kind: "warn",
          text: data.reason || "Downloaded JSON. On Vercel the app cannot keep a file — Request render or render locally.",
        });
      }
    } catch (err) {
      setBanner({
        kind: "warn",
        text: `Downloaded JSON. Local write skipped (${err instanceof Error ? err.message : "network"}).`,
      });
    } finally {
      setBusy(null);
    }
  }

  async function requestRender() {
    setBusy("render");
    setBanner(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: current, outputName: "reel.mp4" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        mode?: string;
        reason?: string;
        error?: string;
        repository?: string;
      };
      if (!res.ok || data.ok === false) {
        setBanner({ kind: "err", text: data.error || "Render request failed." });
        return;
      }
      if (data.mode === "dispatched") {
        setBanner({
          kind: "ok",
          text: `Render queued on GitHub Actions (${data.repository}). Download the MP4 from the workflow artifact when it finishes.`,
        });
        return;
      }
      setBanner({
        kind: "warn",
        text:
          data.reason ||
          "Render is not connected. Download the JSON, then run: node renderer/bin/render.mjs <file> -o out/reel.mp4",
      });
    } catch (err) {
      setBanner({
        kind: "err",
        text: err instanceof Error ? err.message : "Render request failed.",
      });
    } finally {
      setBusy(null);
    }
  }

  function onLoadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isTimeline(parsed)) {
          setBanner({ kind: "err", text: "That file is not a renderer timeline (needs scenes[])." });
          return;
        }
        setDraft(parsed);
        setFont(readRootFont(parsed));
        setTexts(parsed.scenes.map(sceneText));
        setBanner({ kind: "ok", text: `Loaded ${file.name}.` });
      } catch {
        setBanner({ kind: "err", text: "Could not parse that JSON file." });
      }
    };
    reader.readAsText(file);
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Compass Rose Leisure</p>
          <h1>Reel draft</h1>
          <p className="sub">Edit beat copy, pick one font, download JSON. Silent — add audio in review.</p>
        </div>
        {authRequired ? (
          <button type="button" className="ghost" onClick={logout}>
            Log out
          </button>
        ) : null}
      </header>

      {banner ? <div className={`banner ${banner.kind}`}>{banner.text}</div> : null}

      <section className="card">
        <h2>Typeface</h2>
        <label htmlFor="font">Font</label>
        <select
          id="font"
          value={font}
          onChange={(e) => setFont(e.target.value as FontId)}
          style={{ fontFamily: selected.family }}
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.id} — {opt.label}
            </option>
          ))}
        </select>
        <p className="font-note">One font for the whole Reel</p>
        <p className="note">{selected.note}. Same face on every beat — ids match the renderer presets.</p>
      </section>

      {draft.comment ? (
        <section className="card">
          <h2>Draft note</h2>
          <p className="note">{draft.comment}</p>
        </section>
      ) : null}

      {current.scenes.map((scene, i) => {
        const src = scene.image?.src || "";
        const showThumb = /^https?:\/\//.test(src);
        return (
          <section className="card" key={`beat-${i}`}>
            <div className="beat">
              {showThumb ? (
                <img className="thumb" src={src} alt="" />
              ) : (
                <div className="thumb" aria-hidden="true" />
              )}
              <div>
                <div className="beat-meta">
                  <strong>Beat {i + 1}</strong>
                  <span>{scene.duration ? `${scene.duration}s` : ""}</span>
                </div>
                <label htmlFor={`scene-${i}`}>Text</label>
                <textarea
                  id={`scene-${i}`}
                  value={texts[i] ?? ""}
                  onChange={(e) => {
                    const next = [...texts];
                    next[i] = e.target.value;
                    setTexts(next);
                  }}
                  style={{ fontFamily: selected.family }}
                  spellCheck
                />
              </div>
            </div>
          </section>
        );
      })}

      <section className="card">
        <h2>Preview</h2>
        {previewUrl ? (
          <div className="video-wrap">
            <video src={previewUrl} controls playsInline preload="metadata" />
          </div>
        ) : (
          <p className="note">
            No public preview URL is configured. After a GitHub Actions run, download the MP4
            artifact — or render locally. Set <code>PREVIEW_VIDEO_URL</code> to show a video here.
          </p>
        )}
        {!renderConfigured ? (
          <p className="note" style={{ marginTop: 10 }}>
            Request render is in fallback mode (no dispatch token). Download JSON and run{" "}
            <code>node renderer/bin/render.mjs &lt;file&gt; -o out/reel.mp4</code>.
          </p>
        ) : (
          <p className="note" style={{ marginTop: 10 }}>
            Request render queues FFmpeg on GitHub Actions — not on Vercel.
          </p>
        )}
        <div className="btn-row">
          <button type="button" className="ghost" onClick={resetSample}>
            Reload sample
          </button>
          <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
            Load JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onLoadFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <p className="fine">
        This page never runs FFmpeg. Vercel is UI only. Renders happen in GitHub Actions or on a
        laptop with <code>renderer/</code>.
      </p>

      <div className="actions">
        <div className="actions-inner">
          <button type="button" className="btn btn-primary" onClick={saveDraft} disabled={busy !== null}>
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button type="button" className="btn btn-accent" onClick={requestRender} disabled={busy !== null}>
            {busy === "render" ? "Requesting…" : "Request render"}
          </button>
        </div>
      </div>
    </main>
  );
}

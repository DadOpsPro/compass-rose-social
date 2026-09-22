#!/usr/bin/env node
/**
 * CI entry: render one timeline, or every queue/pending/*.json.
 * Silent MP4s land in out/. No Drive upload (drop artifacts there by hand).
 *
 *   TIMELINE=examples/self-host-gsl-silent.json node scripts/ci-render.mjs
 *   TIMELINE=pending node scripts/ci-render.mjs
 */
import { appendFile, mkdir, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PENDING_DIR = path.join(ROOT, "queue", "pending");

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd: ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${bin} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function listPending() {
  let names = [];
  try {
    names = await readdir(PENDING_DIR);
  } catch {
    return [];
  }
  return names
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join("queue", "pending", name));
}

async function setOutput(count) {
  if (!process.env.GITHUB_OUTPUT) {
    console.log(`count=${count}`);
    return;
  }
  await appendFile(process.env.GITHUB_OUTPUT, `count=${count}\n`);
}

async function main() {
  const spec = (process.env.TIMELINE || process.argv[2] || "pending").trim();
  const files = spec === "pending" || spec === "" ? await listPending() : [spec];

  await mkdir(path.join(ROOT, "out"), { recursive: true });

  if (files.length === 0) {
    console.log("No pending timelines — skip render.");
    await setOutput(0);
    return;
  }

  for (const rel of files) {
    const dest = path.join("out", `${path.basename(rel, ".json")}.mp4`);
    console.log(`Rendering ${rel} → ${dest}`);
    await run("node", ["renderer/bin/render.mjs", rel, "-o", dest]);
  }

  await setOutput(files.length);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

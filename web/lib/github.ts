const EVENT_TYPE = "render-reel";

export type DispatchResult =
  | { ok: true; mode: "dispatched"; repository: string; eventType: string }
  | { ok: true; mode: "fallback"; reason: string }
  | { ok: false; error: string };

function dispatchToken(): string | undefined {
  const token = (
    process.env.RENDER_DISPATCH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    ""
  ).trim();
  return token || undefined;
}

export function githubRepository(): string | undefined {
  const fromEnv = process.env.GITHUB_REPOSITORY?.trim();
  if (fromEnv && fromEnv.includes("/")) return fromEnv;
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  if (owner && repo) return `${owner}/${repo}`;
  return undefined;
}

export function renderDispatchConfigured(): boolean {
  return Boolean(dispatchToken() && githubRepository());
}

export async function dispatchRender(draft: unknown, outputName = "reel.mp4"): Promise<DispatchResult> {
  const token = dispatchToken();
  const repository = githubRepository();

  if (!token || !repository) {
    return {
      ok: true,
      mode: "fallback",
      reason:
        "No GitHub dispatch token. Download the JSON and render locally, or set RENDER_DISPATCH_TOKEN (or GITHUB_TOKEN) plus GITHUB_REPOSITORY on Vercel.",
    };
  }

  const url = `https://api.github.com/repos/${repository}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event_type: EVENT_TYPE,
      client_payload: {
        draft,
        output_name: outputName,
        requested_by: "kristin-editor",
      },
    }),
  });

  if (res.status === 204) {
    return { ok: true, mode: "dispatched", repository, eventType: EVENT_TYPE };
  }

  let detail = `${res.status} ${res.statusText}`;
  try {
    const body = (await res.json()) as { message?: string };
    if (body.message) detail = `${detail}: ${body.message}`;
  } catch {
    // ignore non-JSON error bodies
  }

  return {
    ok: false,
    error: `GitHub repository_dispatch failed (${detail}). Check that the token can write Actions on ${repository}.`,
  };
}

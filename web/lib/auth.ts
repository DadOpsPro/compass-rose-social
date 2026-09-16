export const AUTH_COOKIE = "crs_editor";

export async function authToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`compass-rose-editor:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export function editorPassword(): string | undefined {
  const value = process.env.EDITOR_PASSWORD?.trim();
  return value || undefined;
}

export async function cookieMatchesPassword(
  cookieValue: string | undefined,
  password: string | undefined,
): Promise<boolean> {
  if (!password) return true;
  if (!cookieValue) return false;
  const expected = await authToken(password);
  return cookieValue === expected;
}

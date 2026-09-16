import { NextResponse } from "next/server";
import { AUTH_COOKIE, authToken, editorPassword } from "../../../lib/auth";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function GET() {
  const password = editorPassword();
  return NextResponse.json({
    required: Boolean(password),
    authDisabled: !password,
  });
}

export async function POST(request: Request) {
  const password = editorPassword();
  if (!password) {
    return NextResponse.json({ ok: true, authDisabled: true });
  }

  let body: { password?: string } = {};
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password !== password) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await authToken(password), cookieOptions());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import {
  CREATE_COOKIE,
  CREATE_COOKIE_MAX_AGE_MS,
  comparePasswordSafe,
  signCreateToken,
  verifyCreateAuth,
} from "@/lib/auth";

export const runtime = "nodejs";

type Body = { password?: string };

export async function POST(req: NextRequest) {
  const expected = process.env.CREATE_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "サーバー設定エラー: CREATE_PASSWORD が未設定です" },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  const submitted = body.password ?? "";
  if (!comparePasswordSafe(submitted, expected)) {
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }

  const expiresAt = Date.now() + CREATE_COOKIE_MAX_AGE_MS;
  const token = signCreateToken(expiresAt, expected);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CREATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
  return res;
}

export async function GET(req: NextRequest) {
  const ok = verifyCreateAuth(req);
  return NextResponse.json({ authed: ok }, { status: ok ? 200 : 401 });
}

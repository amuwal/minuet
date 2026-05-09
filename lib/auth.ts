import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const CREATE_COOKIE = "minuet_create";
export const CREATE_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function hmacHex(message: string, key: string): string {
  return createHmac("sha256", key).update(message).digest("hex");
}

export function signCreateToken(expiresAtMs: number, secret: string): string {
  const payload = String(expiresAtMs);
  const sig = hmacHex(payload, secret);
  return `${payload}.${sig}`;
}

export function verifyCreateAuth(req: NextRequest): boolean {
  const secret = process.env.CREATE_PASSWORD;
  if (!secret) return false;

  const cookie = req.cookies.get(CREATE_COOKIE)?.value;
  if (!cookie) return false;

  const parts = cookie.split(".");
  if (parts.length !== 2) return false;

  const [payload, sigHex] = parts;
  const expectedHex = hmacHex(payload, secret);

  let aBuf: Buffer;
  let bBuf: Buffer;
  try {
    aBuf = Buffer.from(sigHex, "hex");
    bBuf = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }
  if (aBuf.length === 0 || aBuf.length !== bBuf.length) return false;
  if (!timingSafeEqual(aBuf, bBuf)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;
  if (Date.now() >= expiresAt) return false;

  return true;
}

export function comparePasswordSafe(submitted: string, expected: string): boolean {
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    const padded = Buffer.alloc(b.length);
    a.copy(padded, 0, 0, Math.min(a.length, b.length));
    timingSafeEqual(padded, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

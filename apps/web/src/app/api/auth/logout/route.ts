import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  revokeSessionByToken,
} from "@/lib/identity";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  await revokeSessionByToken(token);
  const cleared = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cleared.name, cleared.value, cleared.options);
  return res;
}

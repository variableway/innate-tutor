import { NextResponse } from "next/server";
import {
  IdentityError,
  buildSessionCookie,
  createSession,
  getIdentityProvider,
} from "@/lib/identity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const provider = getIdentityProvider();
    if (!provider.authenticateWithPassword) {
      throw new IdentityError("Password login is not supported by this provider", "UNSUPPORTED");
    }
    const principal = await provider.authenticateWithPassword({
      email: body.email ?? "",
      password: body.password ?? "",
    });
    const { token, expiresAt } = await createSession(principal);
    const cookie = buildSessionCookie(token, expiresAt);
    const res = NextResponse.json({
      user: {
        id: principal.userId,
        email: principal.email,
        displayName: principal.displayName,
        tenantId: principal.tenantId,
        role: principal.role,
        provider: principal.provider,
      },
    });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (err) {
    if (err instanceof IdentityError) {
      const status =
        err.code === "INVALID_CREDENTIALS"
          ? 401
          : err.code === "VALIDATION"
            ? 400
            : err.code === "UNSUPPORTED"
              ? 501
              : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

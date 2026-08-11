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
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
    };
    const provider = getIdentityProvider();
    if (!provider.registerLocal) {
      throw new IdentityError("Registration is not supported by this provider", "UNSUPPORTED");
    }
    const principal = await provider.registerLocal({
      email: body.email ?? "",
      password: body.password ?? "",
      displayName: body.displayName,
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
        err.code === "EMAIL_TAKEN"
          ? 409
          : err.code === "VALIDATION"
            ? 400
            : err.code === "UNSUPPORTED"
              ? 501
              : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

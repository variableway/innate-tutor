import { NextResponse } from "next/server";
import { getPrincipalFromCookies } from "@/lib/identity";

export const runtime = "nodejs";

export async function GET() {
  const principal = await getPrincipalFromCookies();
  if (!principal) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      id: principal.userId,
      email: principal.email,
      displayName: principal.displayName,
      tenantId: principal.tenantId,
      role: principal.role,
      provider: principal.provider,
    },
  });
}

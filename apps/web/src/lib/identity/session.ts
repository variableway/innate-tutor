import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerEnv } from "../env";
import { withIdentityDb } from "./pool";
import type { MembershipRole, Principal } from "./types";
import { IdentityError } from "./types";

export const SESSION_COOKIE = "innate_session";

interface SessionRow {
  user_id: string;
  tenant_id: string;
  role: MembershipRole;
  email: string;
  display_name: string;
  idp_issuer: string;
  idp_subject: string;
  expires_at: Date;
  revoked_at: Date | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sessionTtlMs(): number {
  return getServerEnv().sessionTtlHours * 60 * 60 * 1000;
}

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export function buildSessionCookie(token: string, expiresAt: Date): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    expires: Date;
  };
} {
  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    },
  };
}

export function clearSessionCookie(): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    expires: Date;
  };
} {
  return {
    name: SESSION_COOKIE,
    value: "",
    options: {
      httpOnly: true,
      secure: cookieSecure(),
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    },
  };
}

function rowToPrincipal(row: SessionRow): Principal {
  const provider = row.idp_issuer === "local" ? "local" : "oidc";
  return {
    userId: row.user_id,
    tenantId: row.tenant_id,
    role: row.role,
    email: row.email,
    displayName: row.display_name,
    provider,
    identity: {
      issuer: row.idp_issuer,
      subject: row.idp_subject,
    },
  };
}

export async function createSession(principal: Principal): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionTtlMs());
  await withIdentityDb(async (pool) => {
    await pool.query(
      `INSERT INTO auth_sessions (id, user_id, tenant_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), principal.userId, principal.tenantId, hashToken(token), expiresAt],
    );
  });
  return { token, expiresAt };
}

export async function revokeSessionByToken(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await withIdentityDb(async (pool) => {
    await pool.query(
      `UPDATE auth_sessions SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [hashToken(token)],
    );
  });
}

async function resolveToken(token: string | undefined | null): Promise<Principal | null> {
  if (!token) return null;
  return withIdentityDb(async (pool) => {
    const { rows } = await pool.query<SessionRow>(
      `SELECT s.user_id, s.tenant_id, s.expires_at, s.revoked_at,
              u.email, u.display_name, u.idp_issuer, u.idp_subject,
              m.role
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       JOIN memberships m ON m.user_id = s.user_id AND m.tenant_id = s.tenant_id
       WHERE s.token_hash = $1
       LIMIT 1`,
      [hashToken(token)],
    );
    const row = rows[0];
    if (!row) return null;
    if (row.revoked_at) return null;
    if (row.expires_at.getTime() <= Date.now()) return null;
    return rowToPrincipal(row);
  });
}

export async function getPrincipalFromRequest(req: NextRequest): Promise<Principal | null> {
  return resolveToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function getPrincipalFromCookies(): Promise<Principal | null> {
  const jar = await cookies();
  return resolveToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requirePrincipalFromRequest(req: NextRequest): Promise<Principal> {
  const principal = await getPrincipalFromRequest(req);
  if (!principal) {
    throw new IdentityError("Authentication required", "UNAUTHORIZED");
  }
  return principal;
}

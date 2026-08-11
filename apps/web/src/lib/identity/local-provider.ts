import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "./password";
import { withIdentityDb } from "./pool";
import type {
  IdentityProvider,
  LoginLocalInput,
  Principal,
  RegisterLocalInput,
} from "./types";
import { IdentityError } from "./types";

const LOCAL_ISSUER = "local";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new IdentityError("Password must be at least 8 characters", "VALIDATION");
  }
}

function validateEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new IdentityError("Invalid email", "VALIDATION");
  }
}

async function loadPrincipal(userId: string, tenantId: string): Promise<Principal> {
  return withIdentityDb(async (pool) => {
    const { rows } = await pool.query<{
      user_id: string;
      tenant_id: string;
      role: Principal["role"];
      email: string;
      display_name: string;
      idp_issuer: string;
      idp_subject: string;
    }>(
      `SELECT u.id AS user_id, m.tenant_id, m.role, u.email, u.display_name,
              u.idp_issuer, u.idp_subject
       FROM users u
       JOIN memberships m ON m.user_id = u.id AND m.tenant_id = $2
       WHERE u.id = $1 AND u.status = 'active'
       LIMIT 1`,
      [userId, tenantId],
    );
    const row = rows[0];
    if (!row) {
      throw new IdentityError("User membership not found", "UNAUTHORIZED");
    }
    return {
      userId: row.user_id,
      tenantId: row.tenant_id,
      role: row.role,
      email: row.email,
      displayName: row.display_name,
      provider: "local",
      identity: { issuer: row.idp_issuer, subject: row.idp_subject },
    };
  });
}

/**
 * Local email/password IdentityProvider.
 * Creates a personal tenant per registration (owner membership).
 */
export class LocalIdentityProvider implements IdentityProvider {
  readonly id = "local" as const;

  async registerLocal(input: RegisterLocalInput): Promise<Principal> {
    const email = normalizeEmail(input.email);
    validateEmail(email);
    validatePassword(input.password);
    const displayName = (input.displayName?.trim() || email.split("@")[0] || "User").slice(0, 80);

    const ids = await withIdentityDb(async (pool) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const existing = await client.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
        if (existing.rowCount) {
          throw new IdentityError("Email already registered", "EMAIL_TAKEN");
        }

        const userId = randomUUID();
        const tenantId = randomUUID();
        await client.query(
          `INSERT INTO tenants (id, name, status) VALUES ($1, $2, 'active')`,
          [tenantId, `${displayName}'s workspace`],
        );
        await client.query(
          `INSERT INTO users (id, email, display_name, status, idp_issuer, idp_subject)
           VALUES ($1, $2, $3, 'active', $4, $5)`,
          [userId, email, displayName, LOCAL_ISSUER, userId],
        );
        await client.query(
          `INSERT INTO memberships (tenant_id, user_id, role) VALUES ($1, $2, 'owner')`,
          [tenantId, userId],
        );
        await client.query(
          `INSERT INTO local_credentials (user_id, password_hash) VALUES ($1, $2)`,
          [userId, hashPassword(input.password)],
        );
        await client.query("COMMIT");
        return { userId, tenantId };
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    });

    return loadPrincipal(ids.userId, ids.tenantId);
  }

  async authenticateWithPassword(input: LoginLocalInput): Promise<Principal> {
    const email = normalizeEmail(input.email);
    validateEmail(email);
    if (!input.password) {
      throw new IdentityError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    return withIdentityDb(async (pool) => {
      const { rows } = await pool.query<{
        user_id: string;
        tenant_id: string;
        password_hash: string;
        status: string;
      }>(
        `SELECT u.id AS user_id, u.status, c.password_hash, m.tenant_id
         FROM users u
         JOIN local_credentials c ON c.user_id = u.id
         JOIN memberships m ON m.user_id = u.id
         WHERE u.email = $1 AND u.idp_issuer = $2
         ORDER BY CASE m.role
           WHEN 'owner' THEN 0 WHEN 'admin' THEN 1
           WHEN 'author' THEN 2 ELSE 3 END
         LIMIT 1`,
        [email, LOCAL_ISSUER],
      );
      const row = rows[0];
      if (!row || row.status !== "active") {
        throw new IdentityError("Invalid email or password", "INVALID_CREDENTIALS");
      }
      if (!verifyPassword(input.password, row.password_hash)) {
        throw new IdentityError("Invalid email or password", "INVALID_CREDENTIALS");
      }
      return loadPrincipal(row.user_id, row.tenant_id);
    });
  }
}

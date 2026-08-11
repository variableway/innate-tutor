import type pg from "pg";

/**
 * Identity tables live in the `innate` database alongside Catalog.
 * `idp_issuer` + `idp_subject` keep local and future OIDC subjects linkable.
 */
export const IDENTITY_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  -- 'local' today; OIDC issuer URL later (e.g. Authentik).
  idp_issuer TEXT NOT NULL,
  idp_subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email),
  UNIQUE (idp_issuer, idp_subject)
);

CREATE TABLE IF NOT EXISTS memberships (
  tenant_id UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('owner', 'admin', 'author', 'learner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON memberships (user_id);

-- Local password credentials only. OIDC users have no row here.
CREATE TABLE IF NOT EXISTS local_credentials (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opaque BFF sessions (HttpOnly cookie). Same shape for local and future OIDC.
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions (expires_at);
`;

declare global {
  // eslint-disable-next-line no-var
  var __innateIdentitySchemaReady: Promise<void> | undefined;
}

export async function ensureIdentitySchema(pool: pg.Pool): Promise<void> {
  if (!global.__innateIdentitySchemaReady) {
    global.__innateIdentitySchemaReady = pool
      .query(IDENTITY_SCHEMA_SQL)
      .then(() => undefined);
  }
  await global.__innateIdentitySchemaReady;
}

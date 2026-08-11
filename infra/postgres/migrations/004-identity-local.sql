-- Identity tables for Catalog BFF (local auth now; OIDC-ready subject model).
-- Applied automatically by apps/web on startup; this file is for existing volumes.

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

CREATE TABLE IF NOT EXISTS local_credentials (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

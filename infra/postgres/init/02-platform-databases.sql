-- Optional platform services (Authentik IdP; Nubase metadata when using a
-- backend-only spike against this instance). Safe on fresh volumes only —
-- docker-entrypoint-initdb.d runs once. For existing volumes, apply
-- infra/postgres/ensure-platform-databases.sql instead.

CREATE DATABASE authentik OWNER innate;
CREATE DATABASE postgrest_metadata OWNER innate;

\connect authentik
-- Authentik manages its own schema via migrations.

\connect postgrest_metadata
CREATE EXTENSION IF NOT EXISTS vector;

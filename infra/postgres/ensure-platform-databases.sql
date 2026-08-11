-- Idempotent helper for volumes that already ran 01-create-databases.sql.
-- Example:
--   docker compose exec -T postgres psql -U innate -d innate \
--     < infra/postgres/ensure-platform-databases.sql

SELECT 'CREATE DATABASE authentik OWNER innate'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'authentik')\gexec

SELECT 'CREATE DATABASE postgrest_metadata OWNER innate'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'postgrest_metadata')\gexec

\connect postgrest_metadata
CREATE EXTENSION IF NOT EXISTS vector;

-- One PostgreSQL instance, separate logical databases. Sharing tables between
-- upstream projects would couple their migrations and is intentionally avoided.

CREATE DATABASE openmaic OWNER innate;
CREATE DATABASE lightrag OWNER innate;

\connect innate
CREATE EXTENSION IF NOT EXISTS vector;

-- Catalog metadata (also applied by apps/web on startup for existing volumes).
CREATE TABLE IF NOT EXISTS catalog_courses (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  requirement TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  openmaic_job_id TEXT,
  openmaic_course_id TEXT,
  classroom_url TEXT,
  model TEXT,
  error_code TEXT,
  error_message TEXT,
  progress INTEGER,
  step TEXT,
  message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS catalog_courses_created_at_idx
  ON catalog_courses (created_at DESC);

CREATE INDEX IF NOT EXISTS catalog_courses_status_idx
  ON catalog_courses (status);

CREATE TABLE IF NOT EXISTS catalog_generation_events (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES catalog_courses (id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  step TEXT,
  progress INTEGER,
  message TEXT,
  raw_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS catalog_generation_events_course_id_idx
  ON catalog_generation_events (course_id, created_at DESC);

\connect openmaic
CREATE EXTENSION IF NOT EXISTS vector;

\connect lightrag
CREATE EXTENSION IF NOT EXISTS vector;

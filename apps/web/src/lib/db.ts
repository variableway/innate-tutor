import { randomUUID } from "node:crypto";
import pg from "pg";
import type { CatalogCourse, CatalogCourseStatus } from "@innate/contracts";
import { getServerEnv } from "./env";

const { Pool } = pg;

const CATALOG_SCHEMA_SQL = `
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
  course_version_id TEXT,
  artifact_id TEXT,
  artifact_checksum TEXT,
  artifact_path TEXT,
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

ALTER TABLE catalog_courses
  ADD COLUMN IF NOT EXISTS course_version_id TEXT,
  ADD COLUMN IF NOT EXISTS artifact_id TEXT,
  ADD COLUMN IF NOT EXISTS artifact_checksum TEXT,
  ADD COLUMN IF NOT EXISTS artifact_path TEXT;

CREATE INDEX IF NOT EXISTS catalog_courses_course_version_id_idx
  ON catalog_courses (course_version_id);
`;

declare global {
  // eslint-disable-next-line no-var
  var __innatePgPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __innateSchemaReady: Promise<void> | undefined;
}

function getPool(): pg.Pool {
  if (!global.__innatePgPool) {
    global.__innatePgPool = new Pool({
      connectionString: getServerEnv().databaseUrl,
    });
  }
  return global.__innatePgPool;
}

export async function ensureCatalogSchema(): Promise<void> {
  if (!global.__innateSchemaReady) {
    global.__innateSchemaReady = getPool().query(CATALOG_SCHEMA_SQL).then(() => undefined);
  }
  await global.__innateSchemaReady;
}

interface CatalogCourseRow {
  id: string;
  title: string;
  requirement: string;
  status: CatalogCourseStatus;
  openmaic_job_id: string | null;
  openmaic_course_id: string | null;
  classroom_url: string | null;
  model: string | null;
  error_code: string | null;
  error_message: string | null;
  progress: number | null;
  step: string | null;
  message: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  latency_ms: number | null;
  course_version_id: string | null;
  artifact_id: string | null;
  artifact_checksum: string | null;
  artifact_path: string | null;
  created_at: Date;
  updated_at: Date;
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function mapCourse(row: CatalogCourseRow): CatalogCourse {
  return {
    id: row.id,
    title: row.title,
    requirement: row.requirement,
    status: row.status,
    openmaicJobId: row.openmaic_job_id,
    openmaicCourseId: row.openmaic_course_id,
    classroomUrl: row.classroom_url,
    model: row.model,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    progress: row.progress,
    step: row.step,
    message: row.message,
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
    latencyMs: row.latency_ms,
    courseVersionId: row.course_version_id ?? null,
    artifactId: row.artifact_id ?? null,
    artifactChecksum: row.artifact_checksum ?? null,
    artifactPath: row.artifact_path ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function insertCourse(input: {
  title: string;
  requirement: string;
  model: string | null;
}): Promise<CatalogCourse> {
  await ensureCatalogSchema();
  const id = randomUUID();
  const { rows } = await getPool().query<CatalogCourseRow>(
    `INSERT INTO catalog_courses (
      id, title, requirement, status, model, progress, step, message
    ) VALUES ($1, $2, $3, 'queued', $4, 0, 'queued', 'Waiting to submit to OpenMAIC')
    RETURNING *`,
    [id, input.title, input.requirement, input.model],
  );
  return mapCourse(rows[0]!);
}

export async function listCourses(): Promise<CatalogCourse[]> {
  await ensureCatalogSchema();
  const { rows } = await getPool().query<CatalogCourseRow>(
    `SELECT * FROM catalog_courses ORDER BY created_at DESC LIMIT 100`,
  );
  return rows.map(mapCourse);
}

export async function getCourse(id: string): Promise<CatalogCourse | null> {
  await ensureCatalogSchema();
  const { rows } = await getPool().query<CatalogCourseRow>(
    `SELECT * FROM catalog_courses WHERE id = $1`,
    [id],
  );
  return rows[0] ? mapCourse(rows[0]) : null;
}

export async function updateCourse(
  id: string,
  patch: Partial<{
    status: CatalogCourseStatus;
    openmaicJobId: string | null;
    openmaicCourseId: string | null;
    classroomUrl: string | null;
    model: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    progress: number | null;
    step: string | null;
    message: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    latencyMs: number | null;
    courseVersionId: string | null;
    artifactId: string | null;
    artifactChecksum: string | null;
    artifactPath: string | null;
  }>,
): Promise<CatalogCourse> {
  await ensureCatalogSchema();
  const { rows } = await getPool().query<CatalogCourseRow>(
    `UPDATE catalog_courses SET
      status = COALESCE($2, status),
      openmaic_job_id = COALESCE($3, openmaic_job_id),
      openmaic_course_id = COALESCE($4, openmaic_course_id),
      classroom_url = COALESCE($5, classroom_url),
      model = COALESCE($6, model),
      error_code = $7,
      error_message = $8,
      progress = COALESCE($9, progress),
      step = COALESCE($10, step),
      message = COALESCE($11, message),
      started_at = COALESCE($12, started_at),
      finished_at = COALESCE($13, finished_at),
      latency_ms = COALESCE($14, latency_ms),
      course_version_id = COALESCE($15, course_version_id),
      artifact_id = COALESCE($16, artifact_id),
      artifact_checksum = COALESCE($17, artifact_checksum),
      artifact_path = COALESCE($18, artifact_path),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *`,
    [
      id,
      patch.status ?? null,
      patch.openmaicJobId ?? null,
      patch.openmaicCourseId ?? null,
      patch.classroomUrl ?? null,
      patch.model ?? null,
      patch.errorCode ?? null,
      patch.errorMessage ?? null,
      patch.progress ?? null,
      patch.step ?? null,
      patch.message ?? null,
      patch.startedAt ?? null,
      patch.finishedAt ?? null,
      patch.latencyMs ?? null,
      patch.courseVersionId ?? null,
      patch.artifactId ?? null,
      patch.artifactChecksum ?? null,
      patch.artifactPath ?? null,
    ],
  );
  if (!rows[0]) {
    throw new Error(`catalog course not found: ${id}`);
  }
  return mapCourse(rows[0]);
}

export async function appendGenerationEvent(input: {
  courseId: string;
  status: CatalogCourseStatus;
  step: string | null;
  progress: number | null;
  message: string | null;
  rawError: string | null;
}): Promise<void> {
  await ensureCatalogSchema();
  await getPool().query(
    `INSERT INTO catalog_generation_events (
      id, course_id, status, step, progress, message, raw_error
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      randomUUID(),
      input.courseId,
      input.status,
      input.step,
      input.progress,
      input.message,
      input.rawError,
    ],
  );
}

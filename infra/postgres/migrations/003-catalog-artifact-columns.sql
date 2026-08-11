-- CourseArtifact snapshot metadata on catalog rows (G1 hot path).

ALTER TABLE catalog_courses
  ADD COLUMN IF NOT EXISTS course_version_id TEXT,
  ADD COLUMN IF NOT EXISTS artifact_id TEXT,
  ADD COLUMN IF NOT EXISTS artifact_checksum TEXT,
  ADD COLUMN IF NOT EXISTS artifact_path TEXT;

CREATE INDEX IF NOT EXISTS catalog_courses_course_version_id_idx
  ON catalog_courses (course_version_id);

# CourseArtifact fixtures (Track A F4 / Track B)

Immutable CourseArtifact v0 snapshots for adapter and Tutor context work.

## Layout

```text
fixtures/course-artifacts/<courseVersionId>/
  artifact.json          # CourseArtifactV0 envelope
  classroom.json         # OpenMAIC GET /api/classroom payload
  validate-report.json   # validator output (must be ok: true)
  media/                 # optional archived media (empty when media disabled)
```

Contract: [`docs/contracts/course-artifact-v0.md`](../../docs/contracts/course-artifact-v0.md)

## Freeze a new fixture

With Catalog + OpenMAIC healthy:

```bash
node scripts/snapshot-course-artifact.mjs
# or
node scripts/snapshot-course-artifact.mjs \
  --catalog-course-id <uuid> \
  --classroom-id <openmaicClassroomId>
```

## Current golden fixture

| Field | Value |
| --- | --- |
| courseVersionId | `76267f4f-ed8d-4ebc-b8fc-2d22857082b9` |
| catalogCourseId | `5b989362-67f6-4108-ae01-947c262536de` (F2 b05 cell quiz) |
| openmaicClassroomId | `A99uUPPOly` |
| scenes | slide + quiz |
| checksum | see `artifact.json` |

Track B should load `artifact.json` offline — do not require a live OpenMAIC for fixture reads.

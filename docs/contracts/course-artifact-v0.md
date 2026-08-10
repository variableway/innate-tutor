# CourseArtifact v0

Track A F4 (`INN-5`) baseline. Slimmer than the target `1.0` envelope in
[`docs/refined/03-target-architecture.md`](../refined/03-target-architecture.md).

## Schema

- TypeScript: [`packages/contracts/src/course-artifact.ts`](../../packages/contracts/src/course-artifact.ts)
- `artifactSchemaVersion`: `"0.1"`
- Source of content: OpenMAIC `GET /api/classroom?id=` → `{ id, stage, scenes, createdAt }`

### Required fields

| Field | Meaning |
| --- | --- |
| `id` / `courseVersionId` | Immutable artifact / CourseVersion id (ULID or UUID) |
| `courseId` | Catalog course id |
| `openmaicClassroomId` | Upstream classroom id |
| `renderer` | `openmaic` + appVersion + adapterVersion + zip format version |
| `content.stage` / `content.scenes` | Opaque OpenMAIC document payload |
| `sceneIndex` | Denormalized `{ sceneId, type, title, order }` for Track B |
| `assetManifest` | Asset refs (may be empty when media generation is disabled) |
| `sourceMap` | Material → scene mapping (may be `[]` in v0) |
| `generationManifest` | Catalog/job/model snapshot metadata |
| `package` | On-disk layout (`classroom-json+media` for v0 fixtures) |
| `checksum` | `sha256` hex of **canonical** `{ stage, scenes }` JSON |

## Checksum rule

1. Take `{ stage, scenes }` from the classroom snapshot (ignore `createdAt` / envelope).
2. Serialize with stable key sort (deep) and no insignificant whitespace variance
   (`JSON.stringify` with sorted keys).
3. `checksum = sha256(utf8_bytes).hex`.

Re-running snapshot on the same classroom content must produce the same checksum.

## Package layout (`classroom-json+media`)

```text
fixtures/course-artifacts/<courseVersionId>/
  artifact.json          # CourseArtifactV0 (content included)
  classroom.json         # raw OpenMAIC classroom { id, stage, scenes, createdAt }
  validate-report.json   # ArtifactValidationReport
  media/                 # optional archived media files
```

## Validation (v0)

Errors fail the report (`ok: false`):

- missing/empty `stage` or `scenes`
- scene missing `id` / `type` / `title`
- checksum mismatch vs recomputed canonical hash
- `artifactSchemaVersion` ≠ `0.1`

Warnings (still `ok: true` unless policy tightens):

- remote `http(s)` asset URLs
- asset marked `missing: true`
- interactive HTML with external script hosts

## Fixture for Track B

Frozen under `fixtures/course-artifacts/`. Adapters should load `artifact.json`
and use `sceneIndex` + `content` without calling live OpenMAIC.

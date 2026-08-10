---
id: decision-6
title: CourseArtifact v0 uses classroom-json snapshot with sha256 checksum
date: '2026-08-09 23:54'
status: Accepted
---

## Context

F4 needs an immutable CourseArtifact before Track B Tutor adapters. OpenMAIC `.maic.zip` export is browser/IndexedDB-based and not available to the Catalog BFF. Catalog previously only stored classroom URLs.

## Decision

Define CourseArtifact **v0.1** as a slim envelope over OpenMAIC `GET /api/classroom` payload:

- Package kind: `classroom-json+media` (not zip for v0)
- Checksum: `sha256` of canonical `{ stage, scenes }` JSON (sorted keys)
- Validator writes `validate-report.json`
- Freeze fixtures under `fixtures/course-artifacts/<courseVersionId>/`

Do not import OpenMAIC vendor modules into Catalog packages; use HTTP adapter only.

## Consequences

- Track B can load `artifact.json` offline.
- Media-heavy classrooms may need a later zip/archive step; v0 allows empty `assetManifest` when media generation is disabled.
- Target envelope `1.0` in refined docs remains future work.

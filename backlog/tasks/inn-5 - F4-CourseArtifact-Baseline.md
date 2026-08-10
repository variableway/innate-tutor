---
id: INN-5
title: F4 CourseArtifact Baseline
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:24'
updated_date: '2026-08-09 23:54'
labels:
  - track-a
milestone: m-1
dependencies:
  - INN-4
documentation:
  - docs/refined/08-fast-validation-parallel-evolution.md
priority: high
type: feature
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evolve from URL records to versioned CourseArtifact v0 with checksum/asset checks; freeze fixtures for Track B.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CourseArtifact v0 defined
- [x] #2 manifest/checksum/asset check passes
- [x] #3 immutable CourseVersion fixture for Track B
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define CourseArtifact v0 in @innate/contracts + docs/contracts. 2. Extend openmaic-adapter: getClassroom, package snapshot + sha256, validate. 3. Add scripts/snapshot-course-artifact.mjs to freeze from live OpenMAIC. 4. Commit fixture under fixtures/course-artifacts for Track B.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
decision-6; docs/contracts/course-artifact-v0.md; adapter getClassroom/package/validate; fixture 76267f4f...
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
CourseArtifact v0 baseline: schema, checksummed classroom-json package, validator report, frozen Track B fixture.
<!-- SECTION:FINAL_SUMMARY:END -->

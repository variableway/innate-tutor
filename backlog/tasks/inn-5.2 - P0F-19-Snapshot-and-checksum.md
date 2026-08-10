---
id: INN-5.2
title: P0F-19 Snapshot and checksum
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:25'
updated_date: '2026-08-09 23:54'
labels:
  - track-a
milestone: m-1
dependencies: []
parent_task_id: INN-5
type: task
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Save .maic.zip or equivalent manifest/media snapshot with checksum.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Checksum reproducible
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. getClassroom in adapter. 2. packageCourseArtifact + sha256. 3. scripts/snapshot-course-artifact.mjs
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Checksum reproducible via scripts/verify-course-artifact-fixture.mjs on frozen fixture.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Snapshot+checksum via openmaic-adapter packageCourseArtifact; fixture checksum verified.
<!-- SECTION:FINAL_SUMMARY:END -->

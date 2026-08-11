---
id: INN-8.1
title: P0T-05 Define trusted context inputs from F4
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:25'
updated_date: '2026-08-10 08:29'
labels:
  - track-b
milestone: m-2
dependencies: []
parent_task_id: INN-8
type: task
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use F4 fixture: courseVersionId/sceneId/selection/SourceRef.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Input contract documented
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define TrustedTutorContextRequest/SourceRef in contracts. 2. Document in docs/contracts/tutor-context-v0.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Contract: packages/contracts/src/tutor-context.ts + docs/contracts/tutor-context-v0.md
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Documented trusted tutor inputs from F4 (courseVersionId/sceneId/selection/SourceRef).
<!-- SECTION:FINAL_SUMMARY:END -->

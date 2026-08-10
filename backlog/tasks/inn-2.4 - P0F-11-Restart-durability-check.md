---
id: INN-2.4
title: P0F-11 Restart durability check
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:24'
updated_date: '2026-08-09 15:14'
labels:
  - track-a
milestone: m-1
dependencies: []
parent_task_id: INN-2
type: task
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Verify classroom still opens after refresh and container restart.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Classroom survives restart
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. After successful classroom generation with wired LLM key, restart openmaic once. 2. Confirm classroom URL still opens and Catalog row still has classroomUrl. 3. Record evidence and finalize.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Pending full classroom success after LLM_API_KEY is configured; Catalog restart durability of metadata already covered by Postgres.

LLM_* wired from aiswitcher minimax-codex; openmaic recreated with KEY_SET=yes BASE=minimaxi MODEL=MiniMax-M3.

Verified: restarted openmaic+catalog; catalog metadata unchanged for 3 succeeded courses; classroom API 200 for kHpqq-4XFP, UhnwD38sLX, GrkHlLA_eT.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
After F1 3/3 success, restarted openmaic and catalog. Catalog rows kept classroomUrl/openmaicCourseId and all three classroom APIs returned 200.
<!-- SECTION:FINAL_SUMMARY:END -->

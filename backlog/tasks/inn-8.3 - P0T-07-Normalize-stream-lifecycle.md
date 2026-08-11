---
id: INN-8.3
title: P0T-07 Normalize stream lifecycle
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
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Normalize stream/cancel/reconnect/citation/usage.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Contract tests green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Normalize TutorStreamEvent. 2. Contract tests for stream/cancel/reconnect/citation/usage.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
pnpm --filter @innate/deeptutor-adapter test: 6/6 pass (normalize content/done/usage/citation/cancel/reconnect).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Normalized stream lifecycle; contract tests green.
<!-- SECTION:FINAL_SUMMARY:END -->

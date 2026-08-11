---
id: INN-8.2
title: P0T-06 Implement Adapter via stable boundary
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
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use only DeepTutorApp or /api/v1/ws.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No unstable internal imports
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Implement deeptutor-adapter WS client only. 2. No DeepTutor internal imports.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Package @innate/deeptutor-adapter uses only ws/http to /api/v1/ws; no DeepTutor vendor imports.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented DeepTutor WS adapter boundary without unstable internal imports.
<!-- SECTION:FINAL_SUMMARY:END -->

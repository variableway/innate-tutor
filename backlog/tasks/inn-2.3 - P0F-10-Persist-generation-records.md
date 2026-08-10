---
id: INN-2.3
title: P0F-10 Persist generation records
status: Done
assignee: []
created_date: '2026-08-08 14:24'
updated_date: '2026-08-09 01:33'
labels:
  - track-a
milestone: m-1
dependencies: []
parent_task_id: INN-2
type: task
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Save job ID, course ID, URL, total latency, model, error type.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Records saved for all 3
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
job/course/URL/latency/error persisted in catalog_courses; verified with live OpenMAIC job failure path.
<!-- SECTION:FINAL_SUMMARY:END -->

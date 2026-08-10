---
id: INN-5.3
title: P0F-20 Validate assets and format
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
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Validate remote assets, interactive HTML, AV missingness, format version.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Validator report produced
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. validateCourseArtifact. 2. Write validate-report.json in snapshot script.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validator report ok=true for golden fixture; unit test validate-artifact.test.ts passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Produced validate-report.json; no schema/asset errors on golden quiz fixture.
<!-- SECTION:FINAL_SUMMARY:END -->

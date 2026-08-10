---
id: INN-3.2
title: P0F-13 Classify failures
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:24'
updated_date: '2026-08-09 22:29'
labels:
  - track-a
milestone: m-1
dependencies: []
parent_task_id: INN-3
type: task
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Classify failures as provider/generation/schema/media/persistence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every failure has a class
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Use failure classifier in scripts/f2-batch-benchmark.py (provider/gen/schema/media/persist). 2. Aggregate counts into report.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Failures: b01/b06/b10 classified provider (MiniMax TLS/Headers timeout). No schema/media/persist failures in this run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Classified 3/10 failures as provider; 0 schema/media/persist.
<!-- SECTION:FINAL_SUMMARY:END -->

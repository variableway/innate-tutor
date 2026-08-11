---
id: INN-8.5
title: P0T-09 Player degrades without Tutor
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
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
OpenMAIC Player keeps playing when Tutor times out/unavailable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Degradation demo recorded
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Player open path independent of tutor health. 2. Document degradation in notes + UI.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
openPlayerIndependently unit test + docs/benchmarks/t3-player-degrade-note.md; Tutor Panel open Player ignores tutorOk.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Recorded Player degradation path independent of Tutor availability.
<!-- SECTION:FINAL_SUMMARY:END -->

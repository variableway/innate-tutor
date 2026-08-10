---
id: INN-3.1
title: P0F-12 Expand to 10-benchmark + rubric
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
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Run 10-sample benchmark with human quality rubric.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 10 samples scored
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prepare 10 short Chinese topics (knowledge/quiz/material mix). 2. Generate through Catalog. 3. Score with heuristic rubric from classroom API structure + openability.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
10 samples scored via scripts/f2-batch-benchmark.py heuristic rubric; report docs/benchmarks/f2-batch-report.md
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Ran 10 Catalog samples on openai:MiniMax-M3; 7 passed rubric/openability. Report in docs/benchmarks/.
<!-- SECTION:FINAL_SUMMARY:END -->

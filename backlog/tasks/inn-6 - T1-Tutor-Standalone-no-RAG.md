---
id: INN-6
title: T1 Tutor Standalone no-RAG
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:25'
updated_date: '2026-08-10 00:26'
labels:
  - track-b
milestone: m-2
dependencies: []
references:
  - docs/benchmarks/t1-tutor-standalone-report.md
documentation:
  - docs/refined/08-fast-validation-parallel-evolution.md
priority: high
type: spike
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Configure DeepTutor single-user with one LLM (no KB/Embedding). Validate scene/selection direct-context Q&A.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 20 baseline questions stream successfully
- [x] #2 Failures recorded
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Start DeepTutor; PUT/apply LLM-only model catalog from root .env MiniMax. 2. Build 20 scene/selection Qs from CourseArtifact fixture. 3. WS smoke with knowledge_bases=[]. 4. Write docs/benchmarks/t1-tutor-standalone-report + finalize.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence: node scripts/t1-scene-qa-smoke.mjs -> passed 20/20; reports docs/benchmarks/t1-tutor-standalone-report.{md,json}. Failures recorded: 0. LLM=MiniMax-M3 via DeepTutor catalog.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
T1 Tutor Standalone (no-RAG): DeepTutor MiniMax configured; 20/20 direct-context WS streams succeeded; failures recorded as 0; reports under docs/benchmarks/.
<!-- SECTION:FINAL_SUMMARY:END -->

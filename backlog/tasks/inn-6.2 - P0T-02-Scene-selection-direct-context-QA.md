---
id: INN-6.2
title: P0T-02 Scene/selection direct-context Q&A
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:25'
updated_date: '2026-08-10 00:26'
labels:
  - track-b
milestone: m-2
dependencies: []
parent_task_id: INN-6
type: task
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Validate current scene/selection context answers and no-citation boundary.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 20 questions completed with notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. 20 direct-context questions from fixture. 2. Record stream success/fail + no-citation notes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Node WS smoke scripts/t1-scene-qa-smoke.mjs; questions fixtures/tutor-baseline/questions.json; fixture 76267f4f...; 20/20 stream ok; citationLike heuristic hit q13/q20 refusal text (false positive); ragHintCount=0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed 20 scene/selection/oos/boundary direct-context Q&A over DeepTutor WS with empty knowledge_bases; report written.
<!-- SECTION:FINAL_SUMMARY:END -->

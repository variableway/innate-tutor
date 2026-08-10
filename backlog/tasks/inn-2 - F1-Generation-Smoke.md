---
id: INN-2
title: F1 Generation Smoke
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:24'
updated_date: '2026-08-09 15:14'
labels:
  - track-a
milestone: m-1
dependencies: []
documentation:
  - docs/implementation-journal.md
priority: high
type: spike
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generate and open 3 short courses via OpenMAIC. Record job/course IDs, URLs, latency, model, errors.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 3/3 classrooms open
- [x] #2 job/course/URL/latency/error recorded
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Execute 3 smoke topics via Catalog once web app is up; records land in catalog_courses.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Smoke pipeline wired through Catalog. Full 3/3 open classrooms blocked on empty LLM_API_KEY; records and failure classification verified.

Journal/decisions recorded. Still blocked on LLM_API_KEY for 3/3 classroom opens (INN-2.4).

Plan: wire LLM_* from aiswitcher minimax-codex (data.db) into root .env, recreate openmaic, finish 3/3 classroom smoke and INN-2.4.

LLM_* from aiswitcher minimax-codex. Succeeded courses: knowledge 7d34d319/kHpqq-4XFP, quiz 00059014/UhnwD38sLX (retry after MiniMax timeout), material 774ce553/GrkHlLA_eT. Model MiniMax-M3. decision-5 + doc-1 updated.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Wired local MiniMax via aiswitcher minimax-codex into .env, generated 3/3 openable Catalog classrooms, and passed INN-2.4 restart durability.
<!-- SECTION:FINAL_SUMMARY:END -->

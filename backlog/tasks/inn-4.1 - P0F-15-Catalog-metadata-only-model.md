---
id: INN-4.1
title: P0F-15 Catalog metadata-only model
status: Done
assignee: []
created_date: '2026-08-08 14:24'
updated_date: '2026-08-09 01:33'
labels:
  - track-a
milestone: m-1
dependencies: []
parent_task_id: INN-4
type: task
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New app stores course catalog metadata only; do not copy OpenMAIC state machine.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No OpenMAIC internal state duplication
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Catalog metadata tables and Course model live in innate DB; no OpenMAIC state duplication.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: INN-1.4
title: P0F-04 LLM-only defaults
status: Done
assignee: []
created_date: '2026-08-08 14:24'
labels:
  - track-ab
  - infra
milestone: m-0
dependencies: []
parent_task_id: INN-1
type: chore
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Default mode requires only LLM; Embedding/RAG stay in optional profile; no secrets committed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 env.example has no real secrets
- [ ] #2 RAG vars only needed for profile
<!-- AC:END -->

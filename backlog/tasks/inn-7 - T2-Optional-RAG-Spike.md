---
id: INN-7
title: T2 Optional RAG Spike
status: To Do
assignee: []
created_date: '2026-08-08 14:25'
updated_date: '2026-08-10 08:29'
labels:
  - track-b
milestone: m-2
dependencies:
  - INN-6
documentation:
  - docs/refined/09-optional-rag-provider-strategy.md
priority: medium
type: spike
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enable a retrieval provider only when long-doc/citation needs appear; verify ingest/retrieve + citations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Citations resolve to source materials
- [ ] #2 Index survives restart
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deferred per decision-7 until after T3/T4 Gates (G3/G4). Do not start without long-doc/citation trigger.
<!-- SECTION:NOTES:END -->

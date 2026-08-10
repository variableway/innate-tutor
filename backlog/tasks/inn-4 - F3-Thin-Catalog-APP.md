---
id: INN-4
title: F3 Thin Catalog APP
status: Done
assignee: []
created_date: '2026-08-08 14:24'
updated_date: '2026-08-09 03:01'
labels:
  - track-a
milestone: m-1
dependencies:
  - INN-3
documentation:
  - docs/implementation-journal.md
  - docs/local-compose-quickstart.md
priority: high
type: feature
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Independent thin Catalog app: submit, poll, list, detail, open Player. Store catalog metadata only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Submit/poll/list/open Player works
- [x] #2 Player fault does not take down Catalog
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Scaffold pnpm monorepo with apps/web Catalog BFF, packages/contracts + openmaic-adapter, Postgres catalog tables, compose catalog service on :3100. F1 smoke runs through Catalog generate/list/open Player. No OIDC/queue.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Recording pass 2026-08-09: added backlog doc-1 journal, doc-2 architecture notes, decisions 2-4, docs/implementation-journal.md index.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Thin Catalog monorepo shipped: apps/web on :3100, packages/contracts + openmaic-adapter, compose catalog service. E2E submit/poll works; classroom success needs LLM_API_KEY.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: INN-1.2
title: P0F-02 Three logical databases
status: Done
assignee: []
created_date: '2026-08-08 14:23'
labels:
  - track-ab
  - infra
milestone: m-0
dependencies: []
parent_task_id: INN-1
type: chore
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One PostgreSQL instance with innate/openmaic/lightrag databases.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Init SQL creates three DBs
- [ ] #2 Each service uses correct DATABASE_URL
<!-- AC:END -->

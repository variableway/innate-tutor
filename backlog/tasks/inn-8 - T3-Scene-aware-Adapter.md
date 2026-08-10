---
id: INN-8
title: T3 Scene-aware Adapter
status: To Do
assignee: []
created_date: '2026-08-08 14:25'
labels:
  - track-b
milestone: m-2
dependencies:
  - INN-6
  - INN-5
documentation:
  - docs/refined/08-fast-validation-parallel-evolution.md
priority: high
type: feature
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adapter over DeepTutorApp or /api/v1/ws using F4 fixture context; normalize stream/cancel/citation; degrade Player safely.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Browser-forged body never enters trusted prompt
- [ ] #2 stream/cancel/reconnect/citation/usage normalized
- [ ] #3 Player continues when Tutor unavailable
<!-- AC:END -->

---
id: INN-9
title: T4 Product Integration Tutor Panel
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:25'
updated_date: '2026-08-10 08:29'
labels:
  - convergence
milestone: m-3
dependencies:
  - INN-5
  - INN-8
documentation:
  - docs/refined/05-implementation-roadmap.md
priority: medium
type: feature
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Join tracks: Tutor Panel, session mapping, citation jump. Course playback must not depend on Tutor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Playback independent of Tutor
- [x] #2 Tutor failure degrades gracefully
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Course page Tutor Panel + independent Player. 2. Server turn API. 3. Degrade UI when tutor down.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Course detail TutorPanel + independent Player button; /api/tutor/health degrade UI; turn NDJSON; forged body sent from client intentionally.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
T4 Tutor Panel integrated on course detail; playback independent of Tutor; graceful degrade when Tutor down.
<!-- SECTION:FINAL_SUMMARY:END -->

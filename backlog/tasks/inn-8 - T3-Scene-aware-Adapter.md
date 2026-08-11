---
id: INN-8
title: T3 Scene-aware Adapter
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:25'
updated_date: '2026-08-10 08:29'
labels:
  - track-b
milestone: m-2
dependencies:
  - INN-6
  - INN-5
references:
  - docs/contracts/tutor-context-v0.md
  - docs/benchmarks/t3-player-degrade-note.md
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
- [x] #1 Browser-forged body never enters trusted prompt
- [x] #2 stream/cancel/reconnect/citation/usage normalized
- [x] #3 Player continues when Tutor unavailable
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add tutor context contracts + docs. 2. Create @innate/deeptutor-adapter (trusted assemble, WS stream/cancel/reconnect, tool allowlist). 3. Contract tests. 4. Wire Catalog BFF tutor APIs + degradation. 5. Finalize ACs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence: adapter tests 6/6; forged body discarded test; player degrade test; APIs /api/tutor/*.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
T3 scene-aware adapter: trusted context, WS lifecycle, tool allowlist, Player degrade. Verified with package tests + degrade note.
<!-- SECTION:FINAL_SUMMARY:END -->

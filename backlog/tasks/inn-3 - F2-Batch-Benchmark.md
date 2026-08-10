---
id: INN-3
title: F2 Batch Benchmark
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:24'
updated_date: '2026-08-09 22:29'
labels:
  - track-a
milestone: m-1
dependencies:
  - INN-2
documentation:
  - docs/refined/08-fast-validation-parallel-evolution.md
priority: high
type: spike
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expand to 10 topics/materials with quality rubric and Go/No-Go decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 JSON/Markdown report produced
- [x] #2 Failures classified (provider/gen/schema/media/persist)
- [x] #3 Go/No-Go written
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Wire Anthropic-compatible Volcengine glm-5.2 via ANTHROPIC_* + DEFAULT_MODEL (aiswitcher volcengine-claude). 2. Define 10 short benchmark topics + heuristic rubric. 3. Run via Catalog generate/poll; score each sample. 4. Classify failures; write Go/No-Go JSON+Markdown report; finalize INN-3.*
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Volcengine anthropic path returned Unauthorized on outline generation; switching DEFAULT_MODEL to aiswitcher xiaomi-claude (anthropic:mimo-v2.5-pro).

Provider probes: volcengine anthropic Unauthorized; xiaomi anthropic Not Found. F2 continues on proven openai:MiniMax-M3. Compose now also wires XIAOMI_* for Token Plan /v1 if configured later.

Evidence: docs/benchmarks/f2-batch-report.md. Volcengine Unauthorized; Xiaomi anthropic 404; used MiniMax. Compose supports ANTHROPIC_* and XIAOMI_*.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
F2 benchmark complete: 7/10 Go on MiniMax; failures all provider-class. Report + classifier + decision published under docs/benchmarks/.
<!-- SECTION:FINAL_SUMMARY:END -->

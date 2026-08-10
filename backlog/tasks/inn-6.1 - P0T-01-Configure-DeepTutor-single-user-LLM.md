---
id: INN-6.1
title: P0T-01 Configure DeepTutor single-user LLM
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:25'
updated_date: '2026-08-10 00:26'
labels:
  - track-b
milestone: m-2
dependencies: []
parent_task_id: INN-6
type: task
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Single-user mode + one LLM; no KB/Embedding.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 DeepTutor answers without RAG
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Configure LLM catalog via API. 2. Verify answer with empty knowledge_bases.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DeepTutor :8001/:3782 up; catalog PUT/apply MiniMax from root .env via scripts/t1-configure-deeptutor-llm.py (embedding disabled). Smoke used knowledge_bases=[] tools=[]; rag event hints=0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Configured DeepTutor single-user MiniMax LLM (no Embedding/KB). Verified no-RAG chat via WS smoke 20/20 (docs/benchmarks/t1-tutor-standalone-report.md).
<!-- SECTION:FINAL_SUMMARY:END -->

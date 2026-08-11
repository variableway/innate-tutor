---
id: INN-8.4
title: P0T-08 Disable high-risk tools
status: Done
assignee:
  - '@agent'
created_date: '2026-08-08 14:25'
updated_date: '2026-08-10 08:29'
labels:
  - track-b
milestone: m-2
dependencies: []
parent_task_id: INN-8
type: task
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Disable shell, arbitrary MCP, subagent by default.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tool allowlist enforced
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. DEFAULT_TOOL_ALLOWLIST empty; strip client tools.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DEFAULT_TOOL_ALLOWLIST=[]; HIGH_RISK_TOOLS stripped; unit test covers shell/mcp/subagent rejection.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Tool allowlist enforced empty by default; high-risk tools disabled.
<!-- SECTION:FINAL_SUMMARY:END -->

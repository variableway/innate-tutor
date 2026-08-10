---
id: decision-4
title: F1 smoke executes through Catalog rather than standalone scripts
date: '2026-08-09 02:59'
status: accepted
---

## Context

Backlog had `INN-2` (F1 Generation Smoke) before `INN-4` (Thin Catalog). Building Catalog first risked duplicating smoke harnesses.

## Decision

Fold F1 smoke into Catalog: UI “提交 3 个 Smoke” + BFF generate/poll, with records in `catalog_courses`. Do not maintain a separate smoke script for the same path.

## Consequences

- One path for validation and product demo.
- `INN-2` / `INN-2.4` completed after local `LLM_*` was wired from aiswitcher `minimax-codex` (`decision-5`).
- F2 benchmark (`INN-3`) can reuse the same Catalog APIs later.

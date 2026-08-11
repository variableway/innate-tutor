---
id: decision-7
title: Defer RAG and identity until after T3/T4 Gates
date: '2026-08-10 00:58'
status: accepted
---
## Context

Track A (F0–F4) and T1 Tutor Standalone are done. Remaining Backlog includes optional RAG (`INN-7`) and production identity/events (`INN-10`). The critical path to a joined product is scene-aware Adapter (`INN-8`) then Tutor Panel (`INN-9`). Starting RAG or OIDC before G3/G4 would dilute the convergence Gate and is not required for scene/selection direct-context demos.

## Decision

Defer `INN-7` (optional RAG spike) and `INN-10` (identity / LearningEvent / progress) until after T3 Adapter and T4 Tutor Panel pass their gates:

1. Do not enable Compose `rag-lightrag` as a product dependency for Tutor Panel.
2. Keep Catalog unauthenticated / single-user loopback until G4 Product is demonstrated.
3. Document the deferral on `INN-7` / `INN-10` notes; do not mark them In Progress.

## Consequences

- Near-term work is Adapter + Catalog artifact hot path + Tutor Panel.
- Long-doc citation grounding remains a future opt-in (see `docs/refined/09-optional-rag-provider-strategy.md`).
- Multi-user pilots stay blocked until T5/P1; local demos stay on 127.0.0.1.

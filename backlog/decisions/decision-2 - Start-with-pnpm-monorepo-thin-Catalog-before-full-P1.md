---
id: decision-2
title: Start with pnpm monorepo + thin Catalog before full P1
date: '2026-08-09 02:59'
status: accepted
---

## Context

Refined plan offers both a fast Track A Catalog (F3) and a heavier P1 platform foundation (OIDC, durable queue, object storage). The user asked to create a new project and start implementing after F0 Compose was ready.

## Decision

Build a minimal pnpm monorepo now with `apps/web` thin Catalog as the first Innate-owned deployable. Explicitly defer OIDC/RBAC, durable workers, Object Storage, and Agent Service until later Gates.

## Consequences

- Faster product signal: generate → list → open Player without waiting for full platform.
- Technical debt accepted: generation still depends on OpenMAIC in-process jobs.
- Later P1 work must migrate Catalog APIs behind identity and durable orchestration without rewriting Player integration.

---
id: decision-3
title: Catalog calls OpenMAIC over HTTP only; no vendor imports
date: '2026-08-09 02:59'
status: accepted
---

## Context

OpenMAIC internals (`lib/server/*`) change frequently. Copying or deep-importing those modules would couple Innate to unstable paths and violate the adapter strategy in `docs/refined`.

## Decision

All Catalog→OpenMAIC interaction goes through `@innate/openmaic-adapter` using public HTTP endpoints (`/api/generate-classroom`, job poll, classroom URL). Business code must not import `OpenMAIC/lib/**`.

## Consequences

- Clear Anti-Corruption boundary; upstream upgrades are contract-tested at the HTTP layer.
- Limited to capabilities exposed by OpenMAIC HTTP today (no durable job semantics).
- Player remains the upstream app opened by URL/new window for this phase.

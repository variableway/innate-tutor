---
id: decision-5
title: Local LLM keys sourced from innate-aiswitcher minimax-codex
date: '2026-08-09 15:13'
status: Accepted
---

## Context

F1 Catalog→OpenMAIC smoke (`INN-2`) was blocked on empty root `.env` `LLM_API_KEY`. Local LLM credentials already exist in the `innate-aiswitcher` PocketBase SQLite store used for agent provider switching.

## Decision

For local Compose smoke, copy the active `minimax-codex` provider into root `.env` only:

- Source DB: `%USERPROFILE%\.innate-aiswitcher\pb_data\data.db`
- Provider slug: `minimax-codex` (OpenAI-compatible base URL)
- Map to `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` (Compose → OpenMAIC `OPENAI_*`)
- Never commit `.env` or paste raw keys into docs/Backlog

## Consequences

- Unblocks 3/3 classroom generation without changing OpenMAIC/DeepTutor code.
- Anthropic-style aiswitcher providers remain unused until Compose gains Anthropic wiring.
- MiniMax latency/timeouts may require smoke retries; Catalog still records failures.
- DeepTutor embeddings stay a separate credential concern.

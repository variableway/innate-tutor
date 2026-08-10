---
id: doc-2
title: Thin Catalog Architecture Notes
type: specification
created_date: '2026-08-09 02:59'
tags: ['catalog', 'architecture', 'track-a']
---

# Thin Catalog Architecture Notes

## Role

Catalog is the first Innate-owned app. It stores course generation metadata only and delegates classroom generation/playback to pinned OpenMAIC.

## Boundaries

| Owns | Does not own |
| --- | --- |
| `catalog_courses`, `catalog_generation_events` in Postgres `innate` | OpenMAIC job files / RuntimeStore |
| Submit + poll orchestration via BFF | Durable queue / worker lease |
| List/detail UI and open-Player link | HostBridge iframe protocol |
| Error surfacing when OpenMAIC is down | Identity, enrollment, publish workflow |

## Runtime flow

1. Browser posts to `/api/catalog/generate`
2. Catalog inserts a `queued` row in `innate`
3. `@innate/openmaic-adapter` calls OpenMAIC `POST /api/generate-classroom`
4. Catalog stores `openmaic_job_id` with status `queued` or `running`
5. Poll `GET /api/generate-classroom/{jobId}`; update row and append event
6. On success store `openmaic_course_id` and public `classroom_url`
7. Player opens in a new window to `NEXT_PUBLIC_OPENMAIC_URL/classroom/{id}`

## Env

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres `innate` |
| `OPENMAIC_BASE_URL` | Server-side OpenMAIC (compose: `http://openmaic:3000`) |
| `NEXT_PUBLIC_OPENMAIC_URL` | Browser Player base (`http://localhost:3000`) |
| `LLM_MODEL` | Recorded on catalog rows (generation still uses OpenMAIC env keys) |

## Related Backlog

- Decisions: `decision-2`, `decision-3`, `decision-4`
- Tasks: `INN-4` (Done), `INN-2` (In Progress)
- Plan source: Cursor `catalog_monorepo_start`
- Operator guide: `docs/local-compose-quickstart.md`
- Repo journal index: `docs/implementation-journal.md`

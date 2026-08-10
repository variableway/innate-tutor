$ErrorActionPreference = 'Continue'
Set-Location (Resolve-Path (Join-Path $PSScriptRoot '..'))

$journal = @'
# Catalog Monorepo Implementation Journal

> Source plan: Cursor plan `catalog_monorepo_start` (2026-08-09). Execution tracked as Backlog `INN-4` (+ F1 via `INN-2`).

## Timeline

| When (UTC+8 approx) | Event | Evidence |
| --- | --- | --- |
| 2026-08-08 | Sync DeepTutor/OpenMAIC to upstream; local Compose F0 stack up | DeepTutor `v1.5.10` / `8865da7c`; OpenMAIC `b4834f5c`; compose healthy |
| 2026-08-08 | Init Backlog.md; seed F0–T5 milestones/tasks | `backlog/`, prefix `INN-` |
| 2026-08-09 | Approve Catalog monorepo start plan (F3 + fold F1) | Plan: monorepo + thin Catalog, no OIDC/queue |
| 2026-08-09 | Scaffold `apps/web`, `packages/contracts`, `packages/openmaic-adapter` | pnpm workspace root |
| 2026-08-09 | Add `catalog_courses` / `catalog_generation_events` | `infra/postgres/migrations/002-catalog-courses.sql` + app boot migrate |
| 2026-08-09 | Implement generate/poll/list/detail APIs + UI | `/api/catalog/*`, `http://localhost:3100` |
| 2026-08-09 | Compose `catalog` service; Docker npm registry retries via npmmirror | `apps/web/Dockerfile`, `.dockerignore` |
| 2026-08-09 | OpenMAIC data volume EACCES fixed via `openmaic-data-init` | compose init container chown 1001 |
| 2026-08-09 | E2E: Catalog→OpenMAIC job submit/poll; failure recorded without crashing Catalog | job `API key required for provider: openai` when `LLM_API_KEY` empty |
| 2026-08-09 | Backlog: `INN-4` Done; `INN-2` partial (records OK, 3/3 open classrooms blocked on API key) | task finals/notes |

## Deliverables

- `apps/web` — Next.js Catalog + BFF
- `packages/contracts` — Catalog Course/Job types
- `packages/openmaic-adapter` — HTTP client for generate/poll/classroom URL
- Compose service `catalog` on `127.0.0.1:3100`
- Docs: `docs/local-compose-quickstart.md`, `docs/README.md`

## Open follow-ups (not done this slice)

- Fill `LLM_API_KEY` and finish `INN-2` / `INN-2.4` (3/3 classrooms open + restart durability of Player)
- `INN-3` F2 benchmark
- `INN-5` CourseArtifact baseline
- Full P1 identity/queue/OIDC (explicitly deferred)

## Verification commands

```bash
pnpm install
pnpm --filter @innate/contracts build
pnpm --filter @innate/openmaic-adapter build
pnpm --filter @innate/web build
docker compose up -d
curl http://127.0.0.1:3100/api/health
```
'@

$arch = @'
# Thin Catalog Architecture Notes

## Role

Catalog is the first Innate-owned app. It stores **course generation metadata only** and delegates classroom generation/playback to pinned OpenMAIC.

## Boundaries

| Owns | Does not own |
| --- | --- |
| `catalog_courses`, `catalog_generation_events` in Postgres `innate` | OpenMAIC job files / RuntimeStore |
| Submit + poll orchestration via BFF | Durable queue / worker lease |
| List/detail UI and open-Player link | HostBridge iframe protocol |
| Error surfacing when OpenMAIC is down | Identity, enrollment, publish workflow |

## Runtime flow

1. Browser → `POST /api/catalog/generate`
2. Catalog inserts `queued` row in `innate`
3. `@innate/openmaic-adapter` → OpenMAIC `POST /api/generate-classroom`
4. Catalog stores `openmaic_job_id`, status `queued|running`
5. Poll `GET /api/generate-classroom/{jobId}`; update row + append event
6. On success: store `openmaic_course_id` + public `classroom_url`
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
'@

function Invoke-Bl {
  param([string[]]$CmdArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'SilentlyContinue'
  $out = & npx --yes backlog.md@latest @CmdArgs 2>&1 | ForEach-Object { "$_" } | Out-String
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  if ($code -ne 0) { throw "backlog failed ($code): $out" }
  return $out
}

Invoke-Bl doc update doc-1 --content $journal -t other --tags "journal,catalog,track-a" | Out-Null
Write-Host 'updated doc-1'
Invoke-Bl doc update doc-2 --content $arch -t specification --tags "catalog,architecture,track-a" | Out-Null
Write-Host 'updated doc-2'

# Link docs onto completed Catalog task
Invoke-Bl task edit INN-4 --doc "backlog/docs/journal/doc-1 - Catalog-Monorepo-Implementation-Journal.md" --doc "backlog/docs/catalog/doc-2 - Thin-Catalog-Architecture-Notes.md" --doc "docs/local-compose-quickstart.md" --append-notes "Recording complete: journal doc-1, architecture doc-2, decisions 2-4." | Out-Null
Invoke-Bl task edit INN-2 --doc "backlog/docs/journal/doc-1 - Catalog-Monorepo-Implementation-Journal.md" --append-notes "F1 execution path documented in journal; blocked on LLM_API_KEY for full classroom opens." | Out-Null
Write-Host 'linked tasks'

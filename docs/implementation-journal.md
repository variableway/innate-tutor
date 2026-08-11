# 实施记录（Implementation Journal）

本文件是仓库级实施过程索引。任务级细节、验收与决策正文以 Backlog.md 为准。

## 记录位置

| 类型 | 位置 | 用途 |
| --- | --- | --- |
| 执行任务 | `backlog/tasks/`（前缀 `INN-`） | 计划、AC、备注、Final Summary |
| 过程日志 | [`backlog/docs/journal/`](../backlog/docs/journal/) | 时间线与验证证据 |
| 架构说明 | [`backlog/docs/catalog/`](../backlog/docs/catalog/) | 已落地模块边界 |
| 决策 | [`backlog/decisions/`](../backlog/decisions/) | 接受/否决的关键选择 |
| 产品/技术基线 | [`docs/refined/`](./refined/) | 长期方案，不替代执行日志 |
| 本地运行 | [`docs/local-compose-quickstart.md`](./local-compose-quickstart.md) | Compose / Catalog 操作说明 |

查看命令：

```bash
npx backlog.md@latest task list --plain
npx backlog.md@latest doc list --plain
npx backlog.md@latest search "Catalog" --plain
```

## 已完成切片

### 2026-08-08 · F0 Compose Contract

- DeepTutor / OpenMAIC 同步上游；Compose 默认无 RAG 三服务可用。
- Backlog 初始化并播种 Track A/B 任务。
- Backlog：`INN-1` Done；里程碑 `m-0` 完成。

### 2026-08-09 · Thin Catalog Monorepo（F3 + F1 路径）

- 落地 pnpm monorepo：`apps/web`、`packages/contracts`、`packages/openmaic-adapter`。
- Catalog 服务 `http://localhost:3100`：提交生成、轮询、列表、详情、打开 Player。
- 元数据表：`catalog_courses`、`catalog_generation_events`（Postgres `innate`）。
- 决策：`decision-2`（先 Catalog 后 P1）、`decision-3`（仅 HTTP adapter）、`decision-4`（F1 走 Catalog）。
- Backlog：`INN-4` Done；`INN-2` / `INN-2.4` Done（3/3 classroom + restart）。

### 2026-08-09 · F1 LLM key + Generation Smoke

- Local keys from aiswitcher provider `minimax-codex` → root `.env` `LLM_*` only（never committed）；see `decision-5`.
- Compose OpenMAIC: `OPENAI_BASE_URL=https://api.minimaxi.com/v1`, model `MiniMax-M3`.
- 3/3 Catalog smoke classrooms openable: `kHpqq-4XFP`, `UhnwD38sLX`, `GrkHlLA_eT`.
- Restart `openmaic`+`catalog`: metadata unchanged; classroom APIs still 200.

### 2026-08-09 · F2 Batch Benchmark

- Compose now wires `DEFAULT_MODEL`, `ANTHROPIC_*`, `XIAOMI_*` in addition to `LLM_*`/`OPENAI_*`.
- Provider probes: Volcengine `anthropic:` → Unauthorized；Xiaomi Claude URL → Not Found；F2 ran on `openai:MiniMax-M3`.
- Result: **7/10 Go**（3 provider timeouts）. Report: `docs/benchmarks/f2-batch-report.md`.
- Backlog: `INN-3` / `INN-3.1`–`3.3` Done.

### 2026-08-10 · F4 CourseArtifact Baseline

- Contract: `docs/contracts/course-artifact-v0.md` + `@innate/contracts` `CourseArtifactV0`.
- Adapter: `getClassroom`, `packageCourseArtifact`, `validateCourseArtifact`（`decision-6`）.
- Golden fixture: `fixtures/course-artifacts/76267f4f-ed8d-4ebc-b8fc-2d22857082b9`（classroom `A99uUPPOly`, slide+quiz；checksum verified）.
- Backlog: `INN-5` / `INN-5.1`–`5.4` Done. Next: Track B `INN-6` Tutor Standalone.

### 2026-08-10 · T1 Tutor Standalone (no-RAG)

- DeepTutor LLM catalog: MiniMax from root `.env` via `scripts/t1-configure-deeptutor-llm.py` (embedding disabled).
- 20 direct-context Q&A over `ws://127.0.0.1:8001/api/v1/ws` with `knowledge_bases: []` (`scripts/t1-scene-qa-smoke.mjs`).
- Result: **20/20** stream success; rag event hints 0. Report: `docs/benchmarks/t1-tutor-standalone-report.md`.
- Backlog: `INN-6` / `INN-6.1`–`6.2` Done.

### 2026-08-10 · T3 Adapter + G1 hot path + T4 Tutor Panel

- Contracts: `docs/contracts/tutor-context-v0.md` + `@innate/contracts` tutor types.
- Package: `@innate/deeptutor-adapter` (trusted assemble, WS normalize/cancel/reconnect, empty tool allowlist, player degrade helper) + unit tests.
- Catalog: generation success snapshots CourseArtifact to `ARTIFACT_STORE_DIR`; columns `course_version_id` / artifact_*; APIs `/api/tutor/{health,context,turn}`; course detail Tutor Panel.
- Decision: `decision-7` defer `INN-7` RAG and `INN-10` identity until after G3/G4.
- Backlog: `INN-8` / `INN-8.1`–`8.5` + `INN-9` Done. Degradation note: `docs/benchmarks/t3-player-degrade-note.md`.

详细时间线见 Backlog `doc-1`（Catalog Monorepo Implementation Journal）。

## 记录规范（后续迭代必须遵守）

1. **开始实现前**：对应 `INN-*` 设为 In Progress，写入 Implementation Plan；重大取舍创建/更新 `decision-*`。
2. **实现中**：用 `--append-notes` 记录阻塞、验证命令、偏差；不要只改代码不记任务。
3. **完成时**：勾选 AC，写 Final Summary，必要时更新 journal doc；再把任务标 Done。
4. **方案文档**：改变架构边界时同步 `docs/refined/*` 或新增 ADR/decision；`refined/` 不做流水账。
5. **禁止**手改 Backlog task 文件；用 `backlog` CLI。decision 正文若 CLI 无 update，可维护 `backlog/decisions/*.md` 的 Context/Decision/Consequences 三段。

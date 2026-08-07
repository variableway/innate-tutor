# InnateTutor Refined Plan

> 状态：**Proposed / 可进入 Phase 0**  
> 基线日期：2026-08-06  
> 适用对象：产品、架构、前端、Node/Python 后端、AI/Eval、测试与运维  
> 目标：把 DeepTutor 与 OpenMAIC 的优势组合成一个可迭代的 AI Interactive Education 产品，而不是永久维护两个 UI 的松散拼接。

## 1. 执行摘要

InnateTutor 的产品闭环应定义为：

> 教师或内容作者基于可信材料生成并审核课程；学习者在互动课堂中学习、答题和记录；上下文敏感的 AI Tutor 根据当前内容、学习轨迹和知识证据提供辅导；系统再用学习事件更新进度和后续推荐。

方向技术上可行，但需要修正原方案的三个前提：

1. **三段式首先是职责边界，不是三个仓库或一组微服务。** MVP 使用一个 monorepo、三个逻辑 plane、少量可部署单元，等负载和团队边界被验证后再拆分。
2. **不在 MVP 拆分 DeepTutor 为十多个 PyPI 包，也不假设 OpenMAIC 已把完整课堂能力发布成 npm SDK。** 两个上游都通过版本锁定的 Anti-Corruption Adapter 接入。
3. **Postgres 中的业务数据和 append-only Learning Event 才是产品事实源。** OpenMAIC 的 IndexedDB/RuntimeStore 与 DeepTutor 的文件式 Memory 是执行与派生能力，不能代替课程、用户、进度和审计主数据。

## 2. 推荐方案一览

| 决策 | 推荐 |
| --- | --- |
| 产品切入 | 先完成“材料 → 课程草稿 → 审核发布 → 学习/答题 → 上下文问答 → 进度更新”垂直闭环 |
| 上游策略 | 固定 commit/版本，通过 adapter 使用；保留小而可审计的 fork patch，不复制大段内部源码 |
| OpenMAIC 使用 | MVP 复用完整课堂应用作为隔离的 Player/Producer Runtime；直接使用 `dsl`、`storage`，按边界使用 `renderer`、`generation` |
| DeepTutor 使用 | 通过稳定 `DeepTutorApp` / `/api/v1/ws` 接入 Agent、RAG 与工具；由 Innate Agent Adapter 负责身份和上下文转换 |
| 总体形态 | Monorepo + Web/Control Plane + Course Worker/OpenMAIC Runtime + Agent Service + Postgres/Object Storage |
| 身份 | Innate 统一身份；下游仅接收服务端签发、带 tenant/user/scope 的短期内部令牌 |
| 内容模型 | 不发明过度统一的 `ContentNode`；以版本化 `CourseArtifact` envelope 包装 OpenMAIC 文档，并保留 adapter/schema 版本 |
| 进度模型 | append-only `LearningEvent` + 可重建的 Progress/Mastery projection |
| 异步任务 | 使用持久化队列、幂等键、租约、重试、取消和费用预算；不直接把 OpenMAIC 进程内 `after()` 当生产队列 |
| MVP 非目标 | 离线全功能、Edge Agent、MP4、大规模媒体生成、多人实时协作、计费、全量上游拆包 |

## 3. 源码事实基线

| 项目 | 版本 / Commit | 本地状态 | 关键事实 |
| --- | --- | --- | --- |
| DeepTutor | v1.5.9 / `37c3db6df7e886aee4f61c97ec5e618b8ab379e8` | `main` clean | 有稳定 `DeepTutorApp` facade、统一 `/api/v1/ws`、多用户上下文、RAG/Memory；核心数据仍强依赖工作区文件布局 |
| OpenMAIC | v0.3.1 / `9556a035b13724b11e575818910d817264a74d4e` | `main` clean | 已发布 5 个 npm 包；完整 Scene 生成、Player、多 Agent 与媒体仍主要位于应用内部；一键生成任务仍是进程内执行 + 本地文件状态 |

关键源码证据：

- DeepTutor 稳定 facade：[facade.py](../../DeepTutor/deeptutor/app/facade.py)
- DeepTutor 统一流协议：[unified_ws.py](../../DeepTutor/deeptutor/api/routers/unified_ws.py)
- OpenMAIC npm 包边界：[generation README](../../OpenMAIC/packages/@openmaic/generation/README.md)、[renderer README](../../OpenMAIC/packages/@openmaic/renderer/README.md)
- OpenMAIC 一键生成入口：[route.ts](../../OpenMAIC/app/api/generate-classroom/route.ts)
- OpenMAIC 当前任务执行方式：[classroom-job-runner.ts](../../OpenMAIC/lib/server/classroom-job-runner.ts)、[classroom-job-store.ts](../../OpenMAIC/lib/server/classroom-job-store.ts)
- OpenMAIC 生产持久化认证警告：[server-auth.ts](../../OpenMAIC/lib/persistence/server-auth.ts)
- iframe 祖先配置：[next.config.ts](../../OpenMAIC/next.config.ts)

## 4. 文档地图

| 文档 | 回答的问题 |
| --- | --- |
| [01 总体目标与范围](./01-goals-and-scope.md) | 为谁做、解决什么、MVP 做与不做什么、如何衡量 |
| [02 可行性评估](./02-feasibility-assessment.md) | 哪些能力能直接复用，哪些需适配/重写，原计划有哪些不成立的假设 |
| [03 目标架构](./03-target-architecture.md) | 系统边界、部署单元、数据流、数据所有权和关键决策 |
| [04 模块与契约设计](./04-module-design.md) | 模块职责、核心实体、API、事件和 adapter 如何设计 |
| [05 实施路线图](./05-implementation-roadmap.md) | Phase、顺序、依赖、工期、团队和进入/退出 Gate |
| [06 Phase 任务清单](./06-phase-task-checklists.md) | 可以直接进入 issue tracker 的任务与验收条件 |
| [07 质量、安全与运维](./07-quality-security-operations.md) | 测试、AI Eval、安全、SLO、观测和发布要求 |
| [08 快速验证与双轨演进](./08-fast-validation-parallel-evolution.md) | 如何让课程生成/Catalog 与 DeepTutor/RAG 集成独立推进并按 Gate 汇合 |
| [09 无 RAG 与 Provider 策略](./09-optional-rag-provider-strategy.md) | 第一阶段如何无 RAG 运行，以及未来如何选择、替换和迁移检索系统 |

## 5. 推荐阅读与决策顺序

1. 产品与技术负责人先确认 `01` 的 MVP 范围。
2. 对照 `02` 接受或调整风险等级和不做事项。
3. 通过 `03`、`04` 中标记的架构决策。
4. 以 `05` 的 Gate 排期，再把 `06` 拆成 issue。
5. Phase 0 完成后，用真实 benchmark 更新 `07` 的目标值和 Phase 1 以后工期。

## 6. 变更规则

- 所有影响数据所有权、身份、CourseArtifact、LearningEvent 或上游 adapter 的变化，先更新对应 ADR/契约，再改实现。
- 上游升级必须通过 adapter contract test、fixture migration test 和三条核心 E2E。
- 工期是区间估算，不是日期承诺；每个 Phase 只有在 exit criteria 通过后才能进入下一阶段。
- 本文档集不要求一次实现最终态。每个模块都区分 Pilot、Beta 与 Scale-out 目标。

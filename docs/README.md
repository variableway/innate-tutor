# InnateTutor 文档索引

本目录包含两类文档：

1. `refined/`：基于 2026-08-06 本地源码逐项核验后的推荐执行基线。
2. 原有分析文档：保留为调研记录和方案演进历史，不再直接作为排期或架构承诺。

## 项目管理与实施记录

本仓库使用 [Backlog.md](https://github.com/MrLesk/Backlog.md) 管理执行任务、过程文档与决策（目录 `backlog/`，前缀 `INN-`）。

```bash
npx backlog.md@latest task list --plain
npx backlog.md@latest doc list --plain
npx backlog.md@latest board
npx backlog.md@latest browser
```

| 记录 | 路径 |
| --- | --- |
| 实施记录索引 | [implementation-journal.md](./implementation-journal.md) |
| 任务看板 | `backlog/tasks/`（F0 Done → Track A/B） |
| 过程日志 / 架构笔记 | `backlog/docs/` |
| 决策 | `backlog/decisions/`（如 `decision-2`…`decision-6`） |
| CourseArtifact v0 | [contracts/course-artifact-v0.md](./contracts/course-artifact-v0.md) |
| Track B fixture | `fixtures/course-artifacts/` |

自研代码位于 `apps/web`（Catalog）与 `packages/*`；本地 Compose 中 Catalog 地址为 `http://localhost:3100`。

部署与基础设施：懒猫微服（Lazycat）私有云打包仓库以 git submodule 形式接入于
[`lazycat-edu-apps/`](../lazycat-edu-apps)（GitHub: qdriven/lazycat-edu-apps），
内含 DeepTutor / OpenMAIC / 共享 PostgreSQL 三个 LPK 应用定义、版本锁定（`versions.env`）、
Makefile 自动化（sync/pack/deploy/backup）与部署/运维文档；其共享 PG 方案与本仓库
`infra/postgres` 的关系见该仓库 `docs/POSTGRES-SHARED.md`。

## 推荐从这里开始

- [实施记录索引](./implementation-journal.md)
- [CourseArtifact v0](./contracts/course-artifact-v0.md)
- [Refined Plan 总览](./refined/README.md)
- [总体目标与范围](./refined/01-goals-and-scope.md)
- [可行性评估与修正建议](./refined/02-feasibility-assessment.md)
- [目标架构](./refined/03-target-architecture.md)
- [模块与契约设计](./refined/04-module-design.md)
- [实施路线图](./refined/05-implementation-roadmap.md)
- [各 Phase 任务清单](./refined/06-phase-task-checklists.md)
- [质量、安全与运维方案](./refined/07-quality-security-operations.md)
- [快速验证与双轨演进计划](./refined/08-fast-validation-parallel-evolution.md)
- [无 RAG 默认模式与可替换 Provider 策略](./refined/09-optional-rag-provider-strategy.md)
- [本地 Compose 快速启动说明](./local-compose-quickstart.md)

## 原有调研文档

- [服务级集成可行性](./integration-feasibility.md)
- [组件级新项目集成](./new-project-integration.md)
- [三段式架构](./three-tier-architecture.md)
- [DeepTutor 调研](./deeptutor/architecture.md)
- [DeepTutor 深度分析与 innate-tutor 改造设计](./deeptutor/innate-tutor-redesign.md)（edu-playground 会话产出，含懒猫部署草案；其部署部分已由 `lazycat-edu-apps/` 取代）
- [OpenMAIC 调研](./openmaic/architecture.md)

原有文档中的能力清单仍有参考价值，但其中部分接口、组件成熟度、工期和生产指标与当前源码并不完全一致。涉及研发决策时，以 `refined/` 中的结论和源码基线为准。

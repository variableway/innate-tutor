# InnateTutor 文档索引

本目录包含两类文档：

1. `refined/`：基于 2026-08-06 本地源码逐项核验后的推荐执行基线。
2. 原有分析文档：保留为调研记录和方案演进历史，不再直接作为排期或架构承诺。

## 推荐从这里开始

- [Refined Plan 总览](./refined/README.md)
- [总体目标与范围](./refined/01-goals-and-scope.md)
- [可行性评估与修正建议](./refined/02-feasibility-assessment.md)
- [目标架构](./refined/03-target-architecture.md)
- [模块与契约设计](./refined/04-module-design.md)
- [实施路线图](./refined/05-implementation-roadmap.md)
- [各 Phase 任务清单](./refined/06-phase-task-checklists.md)
- [质量、安全与运维方案](./refined/07-quality-security-operations.md)
- [快速验证与双轨演进计划](./refined/08-fast-validation-parallel-evolution.md)
- [本地 Compose 快速启动说明](./local-compose-quickstart.md)

## 原有调研文档

- [服务级集成可行性](./integration-feasibility.md)
- [组件级新项目集成](./new-project-integration.md)
- [三段式架构](./three-tier-architecture.md)
- [DeepTutor 调研](./deeptutor/architecture.md)
- [OpenMAIC 调研](./openmaic/architecture.md)

原有文档中的能力清单仍有参考价值，但其中部分接口、组件成熟度、工期和生产指标与当前源码并不完全一致。涉及研发决策时，以 `refined/` 中的结论和源码基线为准。

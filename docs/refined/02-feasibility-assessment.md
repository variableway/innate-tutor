# 02 · 可行性评估与修正建议

## 1. 结论

总体结论是“**产品方向可行，直接拼装方案不可直接生产化**”。

- 用两个项目快速做出单用户/受控环境 Demo：高可行，约 2–4 周。
- 做成有统一身份、持久任务、课程版本、跨设备进度和可审计 Tutor 的 Pilot：中高可行，约 12–16 周。
- 做成多租户、高并发、离线完整、媒体丰富的商业平台：可行，但需要独立产品工程，不是两个开源项目的配置工作。

本评估将能力分为：

| 等级 | 含义 |
| --- | --- |
| A · 直接复用 | 有清晰公共边界和测试，少量装配即可使用 |
| B · Adapter 复用 | 能力成熟，但边界/身份/数据模型需适配 |
| C · 需要产品化改造 | 当前实现适合单机或上游 App，不能直接承担 Innate 生产职责 |
| D · 延后 | 收益尚未验证或成本明显超过当前阶段 |

## 2. OpenMAIC 核验结果

### 2.1 可以直接或优先复用

| 能力 | 等级 | 证据与判断 |
| --- | --- | --- |
| `@openmaic/dsl` | A | 零运行时依赖，含 Stage/Scene/Action、schema、validate、normalize、migration；适合作为课程 artifact 的底层合同 |
| `@openmaic/storage` | A/B | Document/Runtime/KV 的 browser、HTTP、Postgres 合约和 contract tests 较完整；生产 auth 需由 Innate 实现 |
| `@openmaic/importer` | A/B | PPTX → Slide，接口清楚；媒体上传、字体和视频编码仍需产品处理 |
| `@openmaic/renderer` | B | 可独立渲染 Slide，版本仅 `0.0.5`，peer/CSS/font 约束较强；它不是完整 Classroom Player |
| `@openmaic/generation` | B | 已发布且可注入 `AICallFn`，但当前主要覆盖 Outline 合同、prompt asset 与 JSON repair，不是完整 Scene 生产引擎 |
| 完整 OpenMAIC Player | B | 上游应用内功能丰富、测试多；MVP 应作为隔离 runtime 复用，而不是只用 renderer 重写一遍 |
| Quiz/PBL runtime | B | 已逐步迁入 RuntimeStore，适合通过 adapter 接入学习事件；需补统一身份和全局 progress projection |

包版本已经通过 npm registry 核验：`dsl 0.6.2`、`generation 0.1.0`、`storage 0.2.2`、`importer 0.1.2`、`renderer 0.0.5`。

### 2.2 不能按原方案直接假设成立

#### 完整课程生成不是一个独立 npm 包

`@openmaic/generation` 的公开导出目前集中在 Outline、prompt、JSON repair 等能力；完整的 Scene content/action、PBL、媒体编排仍由 `OpenMAIC/lib/generation`、`lib/server` 和其他 app 模块共同完成。当前一键生成仍从应用内部导入：

- [classroom-generation.ts](../../OpenMAIC/lib/server/classroom-generation.ts)
- [generation package exports](../../OpenMAIC/packages/@openmaic/generation/src/index.ts)

因此，`pnpm add @openmaic/generation` 后 3 周完成完整 Classroom MVP 的原估算不成立。可选路径是：

1. Pilot 直接调用固定版本 OpenMAIC Runtime。
2. 在固定 fork 中建立一个很薄的 `OpenMaicProducerAdapter`。
3. 等上游 Scene 生成真正形成公共包后，再替换 adapter 内实现。

#### 完整 Player 不能只靠 `@openmaic/renderer`

Renderer README 明确其 v1 是 read-only Slide canvas。Quiz、Interactive、PBL、Playback Engine、Action Engine、Whiteboard、Chat、TTS 等仍在应用内。用 renderer 自建完整 Player 会重复实现上游最复杂的一半，MVP 不建议这样做。

#### 当前“异步课堂生成”不是 durable job system

当前行为是：

- Route 通过 Next.js `after()` 启动任务，`maxDuration = 30`。
- 运行中的 Promise 存在进程内 `Map`。
- Job 状态和课程结果写到本地 `data/*.json`。
- 没有队列租约、跨节点协调、取消、步骤 checkpoint、dead-letter 或成本幂等。
- 进程重启后 running job 只能在超时后被标记 stale。

相关源码：[route](../../OpenMAIC/app/api/generate-classroom/route.ts)、[runner](../../OpenMAIC/lib/server/classroom-job-runner.ts)、[store](../../OpenMAIC/lib/server/classroom-job-store.ts)、[classroom storage](../../OpenMAIC/lib/server/classroom-storage.ts)。

该实现适合本地/单实例 Skill 调用，不适合 Vercel 长任务、水平扩容和生产恢复。生产方案必须把 `generateClassroom()` 放入持久化 worker，并把结果写入 Innate CourseVersion/Object Storage。

#### Server Persistence 的 auth 目前明确是开发用途

[server-auth.ts](../../OpenMAIC/lib/persistence/server-auth.ts) 明确说明公开浏览器 token 不是秘密，客户端可伪造 `x-learner-key`。Storage 包本身的 auth hook 设计是正确方向，但应用默认实现不能用于多租户生产。Innate 必须从已验证 session/JWT 服务端派生 learner identity，不能信任请求中的 learner key。

#### iframe 可配置，但还不是完整宿主集成协议

`ALLOWED_FRAME_ANCESTORS` 能允许指定宿主，默认 `SAMEORIGIN`；这使 iframe/反向代理方案可行。但现有 `postMessage` 主要服务于课堂内部 Interactive iframe，并没有稳定的“外层 Host ↔ Classroom”协议来上报 scene、quiz、completion 或打开 Tutor。需要新增 origin allowlist、消息 schema、版本和 replay/ack 机制。

### 2.3 OpenMAIC 生产化差距

| 差距 | 影响 | 最小对策 |
| --- | --- | --- |
| 一键任务非 durable | 重启丢执行、横向扩容竞争 | 持久化队列 + worker lease + step checkpoint |
| 课程 fallback 存本地 JSON | 多实例/容器重建后不可用 | CourseArtifact 写 Postgres + Object Storage |
| 生产身份缺失 | tenant/user 越权 | 替换 storage authenticate hook；BFF 派生 subject |
| Full Player 无公共包 | 自研壳难以直接组合 | 独立 runtime origin + iframe 复用完整 app，维护 host bridge |
| Interactive/PBL 类型仍 app-side | 纯 DSL 验证不完整 | Innate artifact envelope + app scene validator/version |
| 素材引用弱 | 课件事实不可追溯 | GroundingBundle + SourceMap + publish quality gate |
| Asset server backend 未完成 | 媒体 portability/权限困难 | MVP 关闭媒体或使用 Innate S3 adapter + asset manifest |
| Provider 配置分散 | 泄密、模型漂移 | Provider Registry 只存引用；服务端 secret resolver |

## 3. DeepTutor 核验结果

### 3.1 可以直接或优先复用

| 能力 | 等级 | 证据与判断 |
| --- | --- | --- |
| `DeepTutorApp` facade | A/B | 源码标注为 stable application-layer facade；包含 start/stream/cancel/regenerate/session 能力 |
| `/api/v1/ws` | A/B | 统一、可重放的 turn stream，支持 subscribe/resume/cancel/ask_user；适合作为 Agent Adapter 的执行协议 |
| LlamaIndex RAG 基线 | B | 本地向量/BM25、版本化索引与丰富测试；先只支持一个基线引擎 |
| 多引擎 RAG | C | 能力存在，但每种引擎的部署、费用、引用和运维语义不同，不宜全量进入 MVP |
| L1/L2/L3 Memory | B/C | 可审计、有价值；作为派生个性化层可复用，不可作为用户/进度事实源 |
| Mastery Path | B/C | 已有 grading/policy/scheduler 和测试；需要先定义与 Innate LearningEvent/课程节点的映射 |
| Book / Co-Writer | C/D | 功能丰富但强依赖 DeepTutor 工作区和 UI；不是首个闭环必需 |

### 3.2 关键边界

#### 不需要先拆成十多个 PyPI 包

DeepTutor 已发布完整 `deeptutor` 包，并提供稳定 facade。把 core/llm/rag/memory/book 等先拆包，会把上游重构、版本发布和依赖解耦变成 Innate 的关键路径，预计远超过原计划 4–6 周，且不能直接验证用户价值。

推荐顺序：

1. 固定 `deeptutor==1.5.9` 或 commit。
2. `InnateDeepTutorAdapter` 只依赖 `DeepTutorApp` 和必要公共 API。
3. 用 contract tests 固定输入/事件 envelope。
4. 只有当某一内部模块阻碍部署或升级时，才提出单一、小范围上游抽取。

#### 身份和工作区映射必须显式设计

DeepTutor 支持自身 JWT/cookie、多用户 context 和 per-user 文件路径，但它不是 Innate 的统一 OIDC/组织系统。直接让 Web 同时登录两套系统会产生账号漂移和越权风险。

Pilot 可让 Agent Service 仅在内网以单租户方式运行；Beta 前必须实现并测试：

`Innate tenant_id/user_id → trusted internal token → DeepTutor owner/workspace context`

#### Memory 是 projection，不是主数据库

DeepTutor Memory 的 L1/L2/L3 很适合生成可解释画像，但课程完成度、Quiz 分数、发布版本和权限必须来自 Innate Postgres。Memory 只能消费经过筛选的 LearningEvent，并且生成的事实要保留证据引用、可撤销和可重算。

#### WebSocket 是主执行面，不是原文档所写的通用 `/api/chat`

推荐接入面是 `/api/v1/ws` 或进程内 `DeepTutorApp`。旧的 `/api/v1/chat` WebSocket 和插件 playground SSE 不应被误当成未来稳定业务 API。Agent Adapter 需要统一转换为 Innate 自己的 Turn/SSE contract。

### 3.3 DeepTutor 生产化差距

| 差距 | 影响 | 最小对策 |
| --- | --- | --- |
| 工作区文件与进程耦合 | 多副本、备份、迁移复杂 | Agent shard 先单副本；中心保存会话映射/事件；工作区持久卷与备份 |
| 自有身份模型 | 双登录/用户漂移 | 内部 token + owner mapper；不公开暴露 DeepTutor API |
| 内部模块并非稳定包边界 | 升级破坏 | 只依赖 facade/WS；adapter contract test |
| Memory 由 LLM consolidation | 非确定、可能过期/错误 | 仅作派生提示；重要事实需证据和用户可删除 |
| RAG Provider 数量过多 | 镜像大、故障面大 | MVP 固定 LlamaIndex + 一种 parser/embedding |
| Tool/Skill/Sandbox 权限高 | 数据泄露/命令执行风险 | 默认关闭；按组织 allowlist 和 sandbox policy 开启 |

## 4. 能力可行性矩阵

| 产品能力 | 当前基础 | 评级 | MVP 建议 |
| --- | --- | --- | --- |
| Topic → Outline | OpenMAIC package/app | A/B | 复用 |
| Outline → 完整 Scenes | OpenMAIC app 内部 | B/C | 固定 runtime/fork adapter，不复制代码 |
| Slide 播放 | renderer + app | A/B | 完整 Player 优先 |
| Quiz | OpenMAIC app/runtime | B | 接 LearningEvent adapter |
| Interactive/PBL | OpenMAIC app-only 类型 | B/C | Interactive 灰度，PBL 延后到 Beta |
| 课堂多 Agent | OpenMAIC orchestration | B/C | 先作为课堂内部功能，不和 DeepTutor Agent 统一抽象 |
| 材料解析 | 双方都有 | B | 只保留一个 ingest owner，避免重复解析 |
| Grounded RAG | DeepTutor | B | LlamaIndex 基线 + stable SourceRef |
| 当前页 Tutor | DeepTutor + 自研 context gateway | B | MVP 核心 |
| Memory | DeepTutor | B/C | 消费事件的 projection，不主写业务表 |
| Mastery | DeepTutor + 自研映射 | C | Phase 5，在进度事件稳定后接入 |
| 统一身份 | 两边均不足 | C | Innate 自研控制面，Beta blocker |
| Durable generation | 当前不足 | C | Phase 1 blocker |
| 课程审核/版本/发布 | 当前不足 | C | Innate 核心域 |
| 跨设备进度 | Storage 合同已有、auth 不足 | B/C | 替换 auth 后使用 |
| 完整离线 | OpenMAIC 有导出基础 | C/D | 先做只读缓存/outbox，完整离线延后 |
| PPTX/MP4 | OpenMAIC 有能力 | C/D | 需求验证后启用 |
| Edge Agent | 无必要 baseline | D | 不进 MVP |
| 计费 | 两边仅用量基础 | C/D | 先建 CostLedger，不做收费系统 |

## 5. 对原有三份方案的关键修正

| 原判断 | 修正 |
| --- | --- |
| “技术、协议层都兼容，可低成本打通” | Provider 重叠不等于身份、数据、任务和教学语义兼容；这些才是主要成本 |
| “OpenMAIC 五个包开箱即用完成课堂” | 包都已发布，但 generation/renderer 只覆盖完整应用的一部分 |
| “先拆 DeepTutor 为多个 PyPI 包” | 不作为产品前置；先用 stable facade + adapter |
| “Book iframe 可直接回写进度” | iframe 可允许嵌入，但外层 host bridge 尚未存在；进度和身份也需服务端接入 |
| “共享 `.env` / API Key” | 不共享明文配置；用统一 Provider Registry + Secret Manager + 下游引用 |
| “OpenMAIC endpoint 稳定” | 当前实际轮询为 `/api/generate-classroom/{jobId}`，课堂读取为 `/api/classroom?id=...`；应由 adapter 隔离 |
| “14 周生产化” | 3–5 人可在 12–16 周到受控 Pilot，生产 Beta 更合理为 18–24 周；1–2 人约 28–36 周 |
| “Agent 首字节 <100/200ms” | 云 LLM 下不现实；拆成网关 ACK 和首个有意义 token 两项指标 |
| “三层 = 三仓库/三团队” | MVP 保持 monorepo 和逻辑分层，避免契约/发布成本提前发生 |
| “Cloud Postgres 是唯一真相，Client/Agent 各自同步” | 方向正确，但需明确表级 ownership；Memory 与 cache 是 projection，不可反向覆盖主数据 |

## 6. 最大可实现性风险

| 风险 | 概率 | 影响 | Gate |
| --- | --- | --- | --- |
| 上游内部接口升级破坏 | 高 | 高 | 固定 commit、adapter fixture、升级演练 |
| 课程生成时间/成本不可控 | 高 | 高 | Phase 0 benchmark；Scene/Token/Media budget |
| 生成内容缺少证据与事实偏差 | 高 | 高 | GroundingBundle、citation eval、发布门禁 |
| 双身份或 learnerKey 伪造 | 中 | 严重 | Beta 前统一身份/服务令牌/IDOR 测试 |
| Job 重启/重复执行 | 高 | 高 | durable queue、idempotency、step checkpoint |
| Player 与 Shell 数据割裂 | 高 | 中高 | 独立 runtime origin + versioned host bridge + event ledger |
| 文件式 Agent 数据难扩容 | 中 | 中高 | 单副本/分片策略、持久卷、备份、中心事件副本 |
| Interactive HTML 供应链风险 | 中 | 严重 | sandbox/CSP/allowlist、静态扫描、禁止任意联网 |
| 多 Provider 支持拖慢交付 | 高 | 中 | MVP 每类只支持一个主 Provider + 一个 fallback |
| 教学效果不可证明 | 中 | 高 | Pilot 对照、rubric、学习结果指标，而非功能数量 |

## 7. 许可、隐私与内容风险

Apache-2.0（DeepTutor）和 MIT（OpenMAIC）通常可以在同一产品中组合，但“许可证兼容”不代表产品合规已经完成：

- 分发时保留两个项目的 LICENSE、版权声明以及 Apache-2.0 所需告知；维护修改记录和 SBOM。
- 检查 npm/Python 传递依赖、字体、模型权重、媒体素材、文档解析器和外部 CDN 的各自许可证。
- `@openmaic/renderer` 可选字体 CSS 依赖外部 font host；内网/商业部署应自托管并核对字体许可。
- 用户上传材料可能受版权或保密约束；需要组织级用途声明、访问控制、删除与保留策略。
- LLM/Embedding/TTS Provider 会接触学习内容或个人数据；需提供可配置的数据区域、零保留选项和 DPA 评审。
- 面向未成年人时，画像、语音、行为事件和长期 Memory 属高敏感数据；默认最小化收集并提供删除/导出。
- Interactive HTML、文档内容和外部 URL 都可能携带 prompt injection、XSS、SSRF 或恶意文件；必须进入安全模型，而不是只靠 prompt 约束。

这不是法律意见；正式商用前需要针对目标市场做单独法律与隐私评审。

## 8. Go / No-Go 建议

建议 **Go**，但以 Phase 0 的四个 spike 作为继续投资条件：

1. 10 份材料的无媒体课程生成 benchmark，记录成功率、调用数、token、费用和耗时。
2. 从受控 runtime origin 嵌入 OpenMAIC Player，并把 scene/quiz/course-complete 事件写入 Innate event ledger。
3. DeepTutor Agent 在给定 `courseVersion + scene + selection + source refs` 时稳定流式回答并返回引用。
4. 统一身份原型能阻断跨 tenant/user 读取 RuntimeStore、课程草稿和 Agent session。

任一项无法在 Phase 0 结束时形成可重复自动测试，应暂停后续开发并调整集成边界，而不是继续增加功能。

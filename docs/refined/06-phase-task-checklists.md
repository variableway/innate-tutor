# 06 · 各 Phase 任务清单

## 1. 使用方式

- 每个 `P?-??` 建议对应一个 Epic/Issue；过大的任务再拆成 1–3 天的子任务。
- Issue 必填：目标、非目标、依赖、contract/migration、测试、telemetry、安全影响、回滚方式。
- `DoD` 是最低验收，不是建议项。未满足 DoD 不关闭任务。
- 标记：`[BE]` Web/Node 后端，`[FE]` 前端，`[AI]` Python/AI，`[QA]` 测试/Eval，`[SRE]` 运维，`[SEC]` 安全，`[PD]` 产品/设计。

## 2. P0 · Evidence & Spikes

- [ ] **P0-01 [BE/AI] 固定源码基线**：记录两个上游 commit、tag、分支、clean status、Node/Python 版本和启动命令。DoD：机器可读 `upstream-lock` 与本地复现说明通过第二台机器验证。
- [ ] **P0-02 [SEC/SRE] License/SBOM 初查**：收集根 LICENSE、npm/pip 依赖、字体/CDN、模型与媒体组件许可证。DoD：列出必须保留的 notice、未知项 owner 和商用前复审项。
- [ ] **P0-03 [SRE] 可重复本地环境**：用 Compose 启动 OpenMAIC、DeepTutor、Postgres、对象存储和 mock provider。DoD：一条命令启动、健康检查明确、无开发者私有路径。
- [ ] **P0-04 [AI/QA] 生成 benchmark harness**：准备 10 份不同长度/类型材料，记录每阶段耗时、调用、token、费用、错误和 artifact。DoD：同一配置可重复运行，输出 JSON/Markdown 报告。
- [ ] **P0-05 [PD/QA] 课程质量 rubric**：定义结构、事实、引用、Quiz 正确性、互动价值、可编辑性六项评分。DoD：至少两名评审对样本评分，记录一致性差异。
- [ ] **P0-06 [FE/BE] Player 嵌入 spike**：通过本地 gateway 或独立 runtime origin 加载 OpenMAIC 完整课堂，验证 CSP/frame ancestor、session、路由和错误页。DoD：Chrome/Safari/Firefox 至少两类浏览器通过，并记录生产 origin 选择。
- [ ] **P0-07 [FE/BE] HostBridge spike**：实现 `ready/scene.changed/quiz.graded/course.completed` 四类 versioned 消息和 origin 校验。DoD：伪造 origin/source/schema 的测试被拒绝。
- [ ] **P0-08 [BE/QA] LearningEvent spike**：将 Player 事件批量写入临时 ledger，验证幂等、乱序、刷新重放。DoD：相同批次提交 3 次只产生一组事件。
- [ ] **P0-09 [AI/BE] DeepTutor context spike**：用 `DeepTutorApp` 或 `/api/v1/ws` 传入 course/scene/source context，流式回答并规范化引用。DoD：固定 20 个问题可自动验证 citation resolvable。
- [ ] **P0-10 [BE/SEC] Identity spike**：BFF session → internal JWT → runtime/agent，服务端派生 tenant/user。DoD：跨用户 course/runtime/agent session 负向用例全部返回 403/404 且有 audit。
- [ ] **P0-11 [ARCH] Contract/ADR 草案**：冻结 CourseArtifact、LearningEvent、TutorEvent、HostBridge v1 草案并审阅 ADR-001–010。DoD：所有未决项有 owner/deadline，不以“以后再说”隐藏关键选择。
- [ ] **P0-12 [SEC] 初版 threat model**：覆盖 upload、prompt injection、SSRF、XSS/iframe、IDOR、secret、sandbox、Memory。DoD：每个高风险项映射到 Phase task 和 release gate。
- [ ] **P0-13 [PD/ARCH] Go/No-Go 评审**：根据数据更新范围、工期和指标。DoD：形成签字决策；No-Go 时写明改用的简化路线。

## 3. P1 · Platform Foundation

- [ ] **P1-01 [BE/SRE] Monorepo 骨架**：建立 `apps/services/packages/infra/tests/evals`，统一 pnpm/uv/format/lint。DoD：根命令可构建所有自研单元。
- [ ] **P1-02 [ARCH/SRE] 上游 pin/fork 流程**：决定 submodule、fork 或 package pin；禁止业务代码直接修改上游 main。DoD：有 update、diff、contract-test、rollback SOP。
- [ ] **P1-03 [SRE] CI 基线**：lint、typecheck、unit、contract、migration、image build、SBOM。DoD：required checks 阻止未通过变更进入主分支。
- [ ] **P1-04 [SRE] Dev/CI 环境**：Compose、seed、mock provider、ephemeral Postgres/Object Store。DoD：CI 不依赖真实 LLM key 也能跑核心合同测试。
- [ ] **P1-05 [BE] 数据库与 migration 框架**：创建 tenant/user/course/job/event/audit/provider 初始 schema。DoD：空库升级、已有 fixture 升级和 down-level app 兼容测试通过。
- [ ] **P1-06 [BE/FE] 用户登录与 session**：OIDC 或选定身份方案、HttpOnly/Secure/SameSite cookie、CSRF。DoD：登录、登出、过期、刷新、多 tab 行为有 E2E。
- [ ] **P1-07 [BE] Tenant/Membership/RBAC**：author/learner/admin scope policy。DoD：每个资源 API 有正/负 authorization matrix 测试。
- [ ] **P1-08 [BE/SEC] 内部服务令牌**：短期 JWT、audience、scope、key rotation。DoD：错误 aud/exp/signature/scope 全部拒绝且不泄露细节。
- [ ] **P1-09 [BE/SRE] Object Storage**：signed upload/download、checksum、tenant prefix、retention。DoD：越权 object key 和篡改 checksum 被拒绝。
- [ ] **P1-10 [BE] Durable Queue**：Postgres queue、lease、heartbeat、retry/backoff、dead-letter、cancel。DoD：kill worker 后任务自动恢复且单步不重复 commit。
- [ ] **P1-11 [BE/AI] Contract toolchain**：OpenAPI/JSON Schema → TS/Python types/clients。DoD：生成物可重复、CI 检查 drift、破坏性变更失败。
- [ ] **P1-12 [SRE] Telemetry**：W3C trace context、structured logs、metrics、PII redaction。DoD：一次 mock 请求可跨 Web→Worker→Provider、Web→Agent stub 检索完整 trace。
- [ ] **P1-13 [BE/AI] Provider Registry**：ProviderConnection、SecretRef、ModelPolicy、health/capability。DoD：浏览器/API 响应不包含 secret；一个 primary + fallback mock 可路由。
- [ ] **P1-14 [BE] Usage/CostLedger**：调用记录、定价版本、estimated/actual、adjustment。DoD：同一调用重试分 attempt 记录但能汇总到 job/turn。
- [ ] **P1-15 [BE/SEC] Audit Log**：角色/Provider/发布/删除等管理操作。DoD：日志 append-only、可按 tenant/actor/resource/trace 查询。
- [ ] **P1-16 [FE/BE] Feature Flag**：tenant/environment 级 flag，默认关闭 Interactive/PBL/media/high-risk tools。DoD：flag 变更被审计，服务端强制而非只隐藏 UI。

## 4. P2 · Authoring & Production

- [ ] **P2-01 [BE/FE] 文件上传流程**：PDF/Markdown/Text 的大小、MIME、checksum、状态 UI。DoD：重复文件去重策略明确，失败可重试，临时文件会清理。
- [ ] **P2-02 [SEC] 上传安全**：MIME sniff、压缩炸弹/恶意文件限制、病毒扫描接口。DoD：测试样本触发正确 quarantine，不进入 parser/LLM。
- [ ] **P2-03 [AI] Parser 基线**：选定一个默认 parser，输出 stable fragment locator。DoD：golden 文档页码/章节定位和文本 hash 可重复。
- [ ] **P2-04 [AI/BE] DeepTutor KB Adapter**：创建/ingest/status/retrieve 的窄接口，只启用 LlamaIndex。DoD：不向业务层暴露内部路径；失败状态有稳定 code。
- [ ] **P2-05 [AI] GroundingBundle Builder**：检索、去重、token budget、SourceRef、coverage。DoD：相同输入/版本产生相同 input hash，可追溯所有 excerpt。
- [ ] **P2-06 [BE] Generation Job API**：submit/status/cancel/retry + `Idempotency-Key`。DoD：OpenAPI、auth、quota、partial status、错误分类测试齐全。
- [ ] **P2-07 [BE] Course Worker skeleton**：按 step 执行、checkpoint、lease guard、usage context。DoD：每步可独立重入，失去 lease 后停止提交结果。
- [ ] **P2-08 [BE] OpenMAIC Producer Adapter**：封装 outline/scene/validate/package；固定上游版本。DoD：上游 internal import 只存在于 adapter，业务包无路径依赖。
- [ ] **P2-09 [BE/AI] Outline 步骤**：传入目标受众/语言/时长/Scene cap/Grounding。DoD：输出通过 schema，失败可重试，保存模型/prompt 版本。
- [ ] **P2-10 [BE/AI] Scene checkpoint**：逐 scene 生成并保存 output ref。DoD：第 N 个 scene 失败后只重跑 N 及必要后续，已成功费用不重复。
- [ ] **P2-11 [BE] Artifact Envelope**：renderer/app/dsl/adapter/schema version、source/asset/generation manifest、checksum。DoD：fixture round-trip byte/checksum 稳定。
- [ ] **P2-12 [QA/AI] Artifact Validator**：纯 DSL + app scene validator、Quiz answer、引用、资产、禁止内容。DoD：每类错误返回定位到 scene/field 的稳定 code。
- [ ] **P2-13 [BE] Draft/Review/Publish**：状态机、乐观锁、immutable publish。DoD：并发编辑不静默覆盖；已发布 artifact 无 update API。
- [ ] **P2-14 [FE] 作者任务 UI**：输入、进度、步骤错误、取消/重试、预算摘要。DoD：刷新页面 job 状态仍正确，失败操作可理解。
- [ ] **P2-15 [FE] Outline/Review UI**：最小顺序/标题/文本/Quiz 修订，复杂编辑跳转 OpenMAIC editor。DoD：revision 有审计和冲突提示。
- [ ] **P2-16 [AI/QA] Publish Quality Gate**：rubric、source coverage、quiz validity、safety、预算完整。DoD：blocking/warning 分类可配置，override 必须有 reviewer/reason。
- [ ] **P2-17 [QA] Golden generation suite**：10 份材料、mock contract 与受控真实 provider nightly。DoD：报告趋势可比较，失败保留 artifact/trace 引用但脱敏。
- [ ] **P2-18 [SRE] Worker 运维**：并发、rate limit、dead-letter、stale lease、手动 retry/runbook。DoD：模拟 provider 429/timeout/5xx/invalid JSON 均有预期状态。

## 5. P3 · Learner Runtime

- [ ] **P3-01 [BE/SRE] OpenMAIC Runtime Origin**：独立 origin、health、版本 pin、内部 API 隔离。DoD：浏览器无法访问管理/provider route，主应用与 runtime 不共享 DOM 权限。
- [ ] **P3-02 [BE/SEC] Runtime Launch Session**：一次性短期 code、绑定 tenant/user/courseVersion、兑换后 HttpOnly session。DoD：过期、重放、换用户、换课程、错误 audience 全部拒绝。
- [ ] **P3-03 [BE] Artifact Loader Adapter**：Published CourseVersion → OpenMAIC document。DoD：draft/archived/跨 tenant/错误版本加载被拒绝。
- [ ] **P3-04 [SEC/FE] iframe policy**：`frame-ancestors`、sandbox、Permissions-Policy、origin allowlist。DoD：安全 header 自动测试在每次 build 运行。
- [ ] **P3-05 [FE] HostBridge Host SDK**：ready/ack/context/navigation/theme/error。DoD：version negotiation、timeout、duplicate message 处理有测试。
- [ ] **P3-06 [FE] HostBridge Runtime SDK**：scene/quiz/complete/tutor-request 事件。DoD：只向配置 origin 发送，message source 严格匹配。
- [ ] **P3-07 [BE] Runtime 身份 Adapter**：从 Innate runtime session/internal token 派生 learner。DoD：忽略/拒绝客户端伪造 learner key。
- [ ] **P3-08 [BE] LearningSession API**：enrollment 校验、create/resume、per-session seq。DoD：并发创建得到一个 active session 或明确多 session 规则。
- [ ] **P3-09 [BE] LearningEvent batch API**：accepted/duplicate/rejected、idempotency、离线时间。DoD：部分成功和重试测试通过。
- [ ] **P3-10 [FE] Client Outbox**：IndexedDB queue、指数重试、登录切换隔离、容量上限。DoD：断网操作恢复后上传，不把 A 用户事件发到 B 用户。
- [ ] **P3-11 [BE] OpenMAIC Event Mapper**：scene/quiz/PBL/raw record → standard event。DoD：未知 upstream event 保留 raw 且不破坏 projector。
- [ ] **P3-12 [BE] Progress Projector**：scene/course/quiz read model、projection version/checkpoint。DoD：全量 replay 与增量结果一致。
- [ ] **P3-13 [FE] Continue Learning**：课程列表进度、最后场景、恢复提示。DoD：换设备读取相同服务端进度。
- [ ] **P3-14 [BE/QA] Completion 规则**：按 scene type 定义 required evidence，不直接信客户端 completion。DoD：规则单元测试覆盖刷新/跳转/重复提交。
- [ ] **P3-15 [QA] Runtime resilience E2E**：刷新、断网、跨设备、Runtime 重启、重复事件。DoD：无重复 attempt、无进度回退、错误可恢复。
- [ ] **P3-16 [QA/SEC] Enrollment/IDOR suite**：public/private/org course、draft/version/runtime/event。DoD：authorization matrix 全绿，拒绝被 audit。

## 6. P4 · Contextual Tutor

- [ ] **P4-01 [AI/SRE] Agent Service skeleton**：Python 3.11、health/readiness、internal auth、graceful shutdown。DoD：无公网暴露，镜像锁依赖。
- [ ] **P4-02 [AI] DeepTutor Adapter**：只使用 `DeepTutorApp`/统一 WS 稳定边界。DoD：start/stream/cancel/resume fixture contract 通过。
- [ ] **P4-03 [AI/SEC] Owner/Workspace Mapper**：tenant/user claims → DeepTutor context/path。DoD：并发请求 context 不串用户；路径 traversal 测试拒绝。
- [ ] **P4-04 [BE] Agent Session/Turn API**：mapping、status、idempotency、quota。DoD：同一 turn request 不启动两个执行。
- [ ] **P4-05 [BE/AI] TutorEvent Translator**：DeepTutor event → v1 stream，保留 seq/terminal。DoD：未知事件 namespaced；一个 turn 只有一个 terminal。
- [ ] **P4-06 [BE/FE] SSE replay**：`Last-Event-ID/afterSeq`、heartbeat、cancel、timeout。DoD：中途断线恢复不丢 delta/citation/terminal。
- [ ] **P4-07 [BE] Trusted Context Assembler**：验证 enrollment 后加载 course/scene/selection/progress/quiz。DoD：客户端提交的正文/答案/memory 不作为 trusted source。
- [ ] **P4-08 [AI] RAG Retrieval Adapter**：SourceRef、top-k、token budget、citation normalizer。DoD：结果只来自授权 KB，引用 locator 可打开。
- [ ] **P4-09 [AI] Tutor Policy/Prompt**：解释、提示、反问、答案泄露策略、语言。DoD：prompt/version 随 trace 保存，固定 eval 可重复。
- [ ] **P4-10 [FE] Tutor Panel**：当前页/选区、流式内容、引用跳转、停止/重试、错误 UX。DoD：键盘/移动端基本可用，页面切换不会把上下文错配。
- [ ] **P4-11 [AI/SEC] Tool allowlist**：默认仅 RAG/安全计算/必要知识工具；关闭 shell/MCP/subagent。DoD：tenant policy 服务端强制，越权 tool call 被记录。
- [ ] **P4-12 [BE/AI] Usage/Cost/Quota**：turn token、模型、延迟、retry、费用。DoD：预算耗尽产生稳定错误并保留已有流内容。
- [ ] **P4-13 [AI] Memory L1 ingest**：只写经过选择的标准事件/对话引用。DoD：事件重复不会产生重复 memory fact，删除可传播。
- [ ] **P4-14 [QA/AI] Tutor Eval 集**：groundedness、citation、helpfulness、answer leakage、safety、language。DoD：mock 每 PR，真实模型 nightly，阈值回归阻断发布。
- [ ] **P4-15 [QA] Agent fault suite**：429、timeout、empty stream、malformed tool、process restart、cancel race。DoD：用户看到可操作错误，后台无孤儿 running turn。
- [ ] **P4-16 [SEC/PD] 对话隐私策略**：原文/trace/Memory 的保存、加密、导出、删除、管理员可见性。DoD：配置和 UI 文案完成，删除 E2E 通过。
- [ ] **P4-17 [QA] 三条核心 E2E**：作者发布、学习/Quiz/恢复、当前页 Tutor/引用/进度。DoD：固定环境连续 20 轮无不可恢复失败。

## 7. P5 · Adaptive Learning

- [ ] **P5-01 [PD/AI] Competency 模型**：定义粒度、课程/Scene/Quiz 映射与版本。DoD：golden 课程能人工审阅映射。
- [ ] **P5-02 [AI/BE] Evidence Policy v1**：强/中/弱证据、衰减、阈值、冲突规则。DoD：规则纯函数化且有表驱动测试。
- [ ] **P5-03 [BE] Mastery Projector**：消费 LearningEvent、保存 evidence IDs/policy version。DoD：全量 replay 确定性通过。
- [ ] **P5-04 [AI] DeepTutor Mastery Adapter 评估**：对比复用 learning 模块与自研 projector。DoD：有基准/兼容报告；不因“已有模块”默认采用。
- [ ] **P5-05 [BE/AI] Recommendation Engine v1**：规则生成候选，LLM 仅生成解释/排序辅助。DoD：每条建议有 evidence 和有效 resource target。
- [ ] **P5-06 [FE] Progress/Mastery UI**：完成度、薄弱点、证据、下一步、重新学习。DoD：不把低置信度显示成确定事实。
- [ ] **P5-07 [AI] Memory L2/L3 Projection**：consolidate、证据链、版本、失败重试。DoD：Memory 不改变 deterministic mastery，用户可查看来源。
- [ ] **P5-08 [BE/AI] 删除/纠正重算**：tombstone、event correction、projection rebuild、memory cleanup。DoD：删除 Quiz/对话后状态无残留引用。
- [ ] **P5-09 [QA/AI] Adaptive Eval**：错题→提示→再测、过度推荐、答案泄露、冷启动。DoD：固定 learner traces 有期望结果。
- [ ] **P5-10 [BE/AI] PBL Evidence Mapper（可选）**：仅 flag 开启时接入。DoD：PBL evaluator 结果保留 rubric/trace，不能直接强制 mastered。

## 8. P6 · Hardening & Pilot

- [ ] **P6-01 [SEC] Threat model closure**：逐项关闭/接受风险。DoD：P0/P1 无未批准例外，接受项有 owner/expiry。
- [ ] **P6-02 [SEC/SRE] SCA/SAST/secret/SBOM**：Node/Python/container/IaC。DoD：CI 阻断 critical/high policy violation。
- [ ] **P6-03 [SEC] SSRF/egress**：URL parser、DNS rebinding、private range、redirect、Provider allowlist。DoD：OpenMAIC media/proxy 与 DeepTutor fetch 路径都有测试。
- [ ] **P6-04 [SEC] Interactive sandbox**：CSP、sandbox flags、网络/下载/clipboard policy、静态扫描。DoD：恶意 fixture 无法访问宿主 cookie/DOM/任意网络。
- [ ] **P6-05 [QA/SRE] 负载测试**：生成队列、事件 batch、Player load、Agent SSE。DoD：得到容量模型和扩容阈值，不只给单次峰值截图。
- [ ] **P6-06 [QA/SRE] 稳定性/Chaos**：kill worker/runtime/agent、DB 短断、Provider 故障。DoD：关键任务恢复符合状态机，无 silent success。
- [ ] **P6-07 [SRE] 备份/PITR**：Postgres、Object、Agent workspace、secret metadata。DoD：恢复到新环境并跑核心 E2E。
- [ ] **P6-08 [SRE/BE/AI] 上游升级演练**：各升级一个允许版本或模拟差异。DoD：adapter contract 能捕获破坏，rollback 在 runbook 时间内完成。
- [ ] **P6-09 [BE/SEC] 数据生命周期**：retention、export、delete、tenant offboarding。DoD：删除覆盖 DB/Object/Vector/Memory/cache 并生成审计结果。
- [ ] **P6-10 [AI/QA] AI Eval CI/Dashboard**：趋势、模型/prompt 对比、抽检队列。DoD：阈值和 waiver 流程可执行。
- [ ] **P6-11 [SRE] SLO/Alert**：可用性、job stuck、agent latency、event lag、cost anomaly。DoD：每个 page alert 有 runbook 和 owner。
- [ ] **P6-12 [SRE] Runbooks**：Provider outage、queue stuck、bad publish、data restore、security incident。DoD：非作者成员按文档完成演练。
- [ ] **P6-13 [FE/QA] 可访问性/兼容性**：键盘、屏幕阅读、对比度、移动端、三浏览器。DoD：核心旅程无 blocker。
- [ ] **P6-14 [PD/QA] Pilot 计划**：组织/用户、材料、成功指标、支持、反馈、退出标准。DoD：用户同意/隐私说明和问题升级路径完成。
- [ ] **P6-15 [ALL] Production Beta Review**：安全、质量、DR、成本、产品证据联合评审。DoD：明确 Go/Conditional Go/No-Go 和未完成项期限。

## 9. P7 · 可选扩展任务模板

只有在 `05` 的启动条件满足后，才创建以下 Epic：

- [ ] **P7-MEDIA**：单 Provider TTS → asset manifest → 配额 → 质量/版权 → fallback，再扩图片/视频。
- [ ] **P7-OFFLINE**：下载 manifest、加密、本地 quota、版本 pin、event outbox、冲突、撤销访问。
- [ ] **P7-EXPORT**：PPTX/MP4 job、render sandbox、资产许可、超时/费用、结果保留。
- [ ] **P7-PBL**：PBL artifact schema、Runtime event、evidence rubric、Tutor context、安全提交物。
- [ ] **P7-LMS**：LTI/xAPI scope、机构身份映射、成绩回写、conformance tests。
- [ ] **P7-SCALE**：按真实瓶颈拆 queue/cache/service，不以“微服务最佳实践”作为启动理由。
- [ ] **P7-UPSTREAM**：把已稳定且可独立测试的 adapter 边界逐个贡献上游；每次一个包/接口，不提交巨型重构。

## 10. Release Blocker 清单

任一项未通过，不得进入真实用户环境：

- [ ] 跨 tenant/user/course/version 的 authorization matrix 全通过。
- [ ] Provider secret 不出现在浏览器 bundle、API、普通日志和 artifact。
- [ ] Published artifact immutable 且 checksum 校验。
- [ ] Job durable、幂等、可取消、可恢复、有预算。
- [ ] LearningEvent 幂等、可重放，projection 可重建。
- [ ] Runtime/Agent 身份由服务端派生，不信任 learner/user header/body。
- [ ] Interactive/iframe、upload、SSRF、prompt injection 有对应控制与测试。
- [ ] Tutor citation 可解析且不跨权限边界。
- [ ] 备份恢复与 rollback 已演练。
- [ ] AI eval、成本、故障和安全 dashboard 有 owner。

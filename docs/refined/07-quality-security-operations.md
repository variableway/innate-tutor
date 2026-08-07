# 07 · 质量、安全与运维方案

## 1. 质量策略

InnateTutor 同时包含确定性软件和非确定性 AI。两者必须使用不同但互补的验证方法：

- Contract/unit/integration/E2E 证明身份、数据、状态机、适配和恢复正确。
- AI eval + 人工 rubric 证明生成和辅导质量达到可接受阈值。
- Production telemetry 证明真实流量没有偏离实验集。

“页面看起来能用”不能替代其中任何一层。

## 2. 测试金字塔

| 层 | 重点 | 运行频率 |
| --- | --- | --- |
| Pure unit | 状态机、事件幂等、projection、budget、auth policy、mapper | 每 PR |
| Schema/contract | OpenAPI、CourseArtifact、LearningEvent、TutorEvent、HostBridge、上游 adapter | 每 PR |
| Component | Author UI、Player Host、Tutor Panel、outbox | 每 PR |
| Integration | Postgres/Object/Queue、OpenMAIC RuntimeStore、DeepTutor adapter | 每 PR/合并 |
| E2E | 作者发布、学习/Quiz/恢复、Tutor/引用/进度 | 合并/发布 |
| AI eval mock | prompt wiring、引用结构、错误处理、budget | 每 PR |
| AI eval real | 生成质量、groundedness、pedagogy、safety、cost | nightly/候选发布 |
| Load/chaos/DR | 容量、恢复、依赖故障 | 每周/每次大版本 |

## 3. Adapter Contract Test

### 3.1 OpenMAIC fixtures

至少固定以下 artifact：

- 单 Slide（文本、公式、图片、图表）。
- Quiz（single/multiple/short answer）。
- Interactive HTML/widget。
- PBL v1/v2。
- generated agent configs/voice fields。
- whiteboard/actions/playback。
- asset refs 和缺失资产。
- legacy、current、future schema version。

测试：load → validate → package → render/load；比较字段保留、schema、事件映射和 screenshot。未来版本必须 fail loud。

### 3.2 DeepTutor fixtures

至少固定：

- start/stream/complete turn。
- tool status/content/citation/usage。
- cancel 与 restart/replay。
- `ask_user` pause/resume。
- provider error、timeout、malformed tool result。
- 两用户并发 context isolation。

Adapter 只承诺 Innate TutorEvent，不承诺透传所有内部 metadata。

## 4. 三条核心 E2E

### E2E-1 作者生产

`登录作者 → 上传材料 → 生成 → worker restart → 恢复 → 审核 → 发布 → 校验 checksum/source map`

### E2E-2 学习进度

`登录学习者 → 开始课程 → Slide → Quiz → 断网提交 → 恢复同步 → 换设备继续 → 完成`

### E2E-3 上下文 Tutor

`当前场景选区 → 提问 → RAG 引用 → SSE 断线恢复 → 取消/重试 → LearningEvent/usage/progress 可见`

每条 E2E 至少有另一个 tenant 的干扰数据，防止测试只证明 happy path。

## 5. AI Eval

### 5.1 数据集

建立版本化 `evals/datasets/`：

- 10–30 份有明确页码/章节/答案的教学材料。
- 不同语言、长度、公式、表格、冲突信息和过期信息。
- prompt injection/恶意指令材料。
- 事实问题、解释问题、迁移问题、Quiz、答案泄露问题。
- learner traces：初学、连续错题、重复掌握、自我声明与证据冲突。

每个案例包含可接受范围，而不是只存唯一字符串答案。

### 5.2 课程生成指标

| 指标 | 计算方式 | Pilot 阈值建议 |
| --- | --- | --- |
| Schema validity | artifact validator pass | 100% 才能进入 Review |
| Scene success | 生成有效 scene / 计划 scene | ≥ 95%，否则 job partial/fail |
| Source coverage | 可验证事实 scene 有 SourceRef | ≥ 90% |
| Citation correctness | 引用内容支持对应主张 | ≥ 85%，人工抽检 |
| Quiz validity | 答案可判、选项/解释一致 | ≥ 95% |
| Pedagogical coherence | rubric 1–5 | 平均 ≥ 4，单项不得 < 3 |
| Editability | 作者可通过有限修改发布 | ≥ 80% 样本 |
| Safety | critical violation | 0 |

阈值应在 P0 baseline 后更新。自动 LLM-as-judge 结果必须抽样人工校准，不作为唯一发布证据。

### 5.3 Tutor 指标

| 指标 | 说明 | Pilot 阈值建议 |
| --- | --- | --- |
| Groundedness | 关键结论被 context/source 支持 | ≥ 90% |
| Citation resolvability | citation 能打开授权 SourceRef | 100% |
| Citation precision | citation 实际支持主张 | ≥ 90% |
| Context fidelity | 正确使用当前 scene/selection/progress | ≥ 95% |
| Answer leakage | 未到 reveal 时泄露隐藏答案 | 0 critical |
| Helpful hinting | 在不过度代做下推动学习 | rubric 平均 ≥ 4/5 |
| Cross-user leakage | 引用/记忆来自其他用户 | 0 |
| Tool policy | 未授权工具执行 | 0 |

### 5.4 回归策略

- Prompt、model、provider、retriever、chunking、adapter 任一变化都生成新 eval run。
- 比较质量、延迟、token 和费用，禁止只看质量上升而忽略 3 倍成本。
- Release candidate 使用与生产相同 model policy；nightly 结果按版本保留。
- Waiver 必须写明失败案例、用户影响、owner、过期日期和补救方案。

## 6. 安全模型

### 6.1 信任边界

不可信输入包括：

- 浏览器 body/header、iframe/postMessage、离线 outbox。
- 上传文档、PPTX、Interactive HTML、外部 URL 和媒体。
- LLM 输出、tool call、RAG 文本、Memory 摘要。
- 任何 `tenantId/userId/learnerKey/courseId` 标识。
- 上游服务返回的错误文本和 metadata。

可信仅来自：已验证 session/service token、服务端 authorization、版本化 schema validator、受控 secret resolver 和数据库约束。

### 6.2 主要威胁与控制

| 威胁 | 控制 |
| --- | --- |
| IDOR/跨租户 | 服务端派生 tenant/user；资源级 auth；负向 matrix；可选 RLS |
| 伪造 learnerKey | Runtime API 忽略客户端 identity，以 session claims 为准 |
| XSS/恶意 Interactive | sandbox iframe、严格 CSP、禁止同源脚本特权、资源 allowlist、静态扫描 |
| postMessage 注入 | 固定 origin/source、schema/version/messageId、禁止外层 `'*'` |
| SSRF | URL parse、DNS/IP 检查、redirect 重验、私网/metadata 拒绝、egress proxy |
| 恶意上传 | MIME sniff、size/page/ratio limit、quarantine、AV、parser sandbox |
| Prompt injection | 文档标记为 data、tool allowlist、secret 不进 prompt、输出验证、敏感操作需确定性授权 |
| Tool/命令执行 | MVP 默认禁用 shell/subagent/MCP；沙盒、资源限制、无 secret mount |
| Secret 泄露 | Secret Manager、短期 token、log redaction、前端 bundle scan、轮换 |
| Model output poisoning | schema/normalize/quality gate；Published 前人工审核 |
| 成本耗尽 | per-user/tenant/job budget、rate limit、scene/token/media cap、anomaly alert |
| Memory 隐私 | 最小化、来源、用户可见/删、retention、不得跨用户检索 |

### 6.3 安全 Header

至少包含并测试：

- `Content-Security-Policy`，明确 `frame-ancestors`、`script-src`、`connect-src`、`img/media-src`。
- `Permissions-Policy`，默认关闭 camera/mic/geolocation，按功能临时允许。
- `Referrer-Policy`、`X-Content-Type-Options`、HSTS（生产）。
- iframe 使用最小 `sandbox` 权限；需要 `allow-same-origin` 时重新评估脚本与 cookie 风险。

## 7. 隐私与数据治理

### 7.1 数据分类

| 等级 | 示例 | 要求 |
| --- | --- | --- |
| Public | 公开课程 artifact | 完整性、版本、版权标记 |
| Internal | 组织课程草稿、模型策略 | tenant auth、审计 |
| Confidential | 上传教材、对话、作业、笔记 | 加密、最小权限、retention |
| Sensitive | 未成年人画像、语音、长期 Memory、身份凭证 | 明示用途、严格访问、删除/导出、区域评审 |
| Secret | Provider/API/签名密钥 | Secret Manager，禁止入 DB 明文字段/日志/prompt |

### 7.2 生命周期

- 上传 quarantine 临时对象自动过期。
- Published artifact 的保留与课程生命周期绑定；归档不等于立即物理删除。
- Raw prompt/trace 使用较短保留期；质量调试样本需脱敏和单独授权。
- LearningEvent 删除使用 tombstone/correction 并触发 projection/Memory/Vector 清理。
- Tenant offboarding 提供 export、删除进度和可验证完成报告。

## 8. SLO 与性能目标

目标先用于 Pilot，P0/P6 用实测修订。不要把上游单机结果外推到规模 SLA。

| 服务路径 | Pilot SLO/目标 |
| --- | --- |
| Web/Catalog/Event API 可用性 | 99.9% / 月 |
| Agent Gateway 可用性 | 99.5% / 月；Provider 故障单列 |
| LearningEvent ingest | P95 < 500ms（50 条 batch） |
| Progress projection lag | P95 < 5s |
| Agent gateway ACK | P95 < 500ms |
| Agent first meaningful token | P95 < 3s，排除明确标识的冷启动/Provider outage |
| Course generation queue wait | 正常负载 P95 < 60s |
| 3–8 Scene 无媒体生成 | P90 < 10min，按 model policy 分层 |
| Job stuck detection | lease 过期后 < 2min 被重新调度/告警 |
| Published artifact load | CDN/对象命中 P95 < 1s（不含大媒体） |

错误预算分开统计平台故障、上游 Provider 故障、用户预算/验证失败，避免把所有失败都归为“AI 不稳定”。

## 9. 可观测性

### 9.1 Trace

统一字段：

- `trace_id`, `request_id`, `tenant_id_hash`, `user_id_hash`；
- `course_id/version_id`, `job_id/step/attempt`, `session_id/turn_id`；
- `provider/model/policy_version`, token/latency/cost；
- `upstream_project/version/adapter_version`；
- error category/retryable；
- 不默认记录正文、密钥或完整 prompt。

### 9.2 关键指标

| 域 | 指标 |
| --- | --- |
| Generation | queue depth/age、step duration、retry、success/partial/fail、tokens/cost per course |
| Player | artifact load、bridge error、scene/quiz events、client outbox age/size |
| Event | ingest rate、duplicate/reject、projection lag/rebuild duration |
| Agent | active streams、TTFT、completion/cancel/error、tool calls、citation rate、tokens/cost |
| Data | DB connections/locks/storage、object errors、vector latency、backup age |
| Security | auth deny、cross-tenant attempts、SSRF blocks、quarantine、rate-limit、secret scan |
| Quality | eval pass rate、rubric、model/prompt regression、override rate |

### 9.3 告警

Page：身份/DB/事件写入不可用、持续跨租户异常、队列无法消费、备份失败、成本突增、published artifact 大面积无法加载。

Ticket：单 Provider 降级、eval 下降、projection lag、少量 malformed output、字体/CDN fallback。

每个告警必须指向 dashboard、runbook、owner 和最近 deploy/feature flag。

## 10. 容量与成本模型

P0/Pilot 至少测量：

- 每份文档解析 CPU/内存/时间和 object size。
- 每个 outline/scene/quiz 的 input/output token。
- 每个课程的 LLM calls、retry、生成时间和费用分布。
- 每个 active learner 的 event rate、SSE connection、runtime storage。
- 每个 Agent turn 的 context size、retrieval、TTFT、token 与成本。
- Memory consolidation 的频率、费用和增长率。

成本保护顺序：

1. 限制 Scene/文档/token/media 数量。
2. 以 step/model policy 路由便宜模型。
3. 对 deterministic input 缓存 Grounding/Outline，缓存键含版本和权限范围。
4. 避免失败步骤重跑整个课程。
5. 在达到预算前告警；达到 hard cap 后 fail explicit，不静默降质发布。

## 11. 备份、恢复与灾难恢复

### 11.1 备份范围

- Postgres：PITR + 日快照。
- Object Storage：versioning、生命周期、跨区策略按客户要求。
- Agent Service 工作区：加密快照；同时依赖中心 session/event 映射降低不可恢复损失。
- Vector index：视为 projection，可重建；备份配置和 source checksum。
- Secret：由 secret manager 自身备份/轮换，不导出到普通备份。

### 11.2 Pilot 目标

| 指标 | 目标 |
| --- | --- |
| RPO | Postgres ≤ 15 分钟；Published artifact 近似 0（对象版本） |
| RTO | 核心 Catalog/Event ≤ 4 小时；Agent/Generation ≤ 8 小时 |
| 演练 | 每季度或每个重大 schema/upstream 变更前 |

恢复验收不是“数据库启动”，而是在新环境完成三条核心 E2E、checksum 验证和权限负向测试。

## 12. 发布与回滚

- 采用 expand/contract migration；代码回滚期间旧版本仍能读新 schema 的 expand 状态。
- Worker deploy 使用 drain/lease；不直接杀死有写入权限的进行中步骤。
- Prompt/model/provider policy 可独立版本和回滚。
- CourseArtifact reader 至少支持当前和前一个 adapter/schema 版本。
- OpenMAIC/DeepTutor 升级单独发布，先跑 contract/golden/eval/canary。
- Feature flag 关闭功能不能破坏已有 Published artifact 的读取。
- Bad course publish 通过切换 `current_published_version_id` 回滚，不修改坏版本本体。

## 13. 最小 Runbook 集

1. Provider 429/5xx/模型下线。
2. Generation queue stuck/lease storm/dead-letter 增长。
3. OpenMAIC Runtime artifact/version 不兼容。
4. Agent stream 卡死/DeepTutor workspace 损坏。
5. LearningEvent lag/重复/rebuild。
6. 跨租户安全告警。
7. Provider secret 泄露与轮换。
8. Bad publish/课程回滚。
9. Postgres/Object restore。
10. 上游升级失败与版本回退。

每份 runbook 包含判断信号、止血动作、数据安全注意、恢复步骤、验证命令、沟通模板和复盘 owner。

## 14. Production Beta 最终检查

- [ ] Contract、E2E、真实模型 eval、负载、安全扫描全部达到阈值。
- [ ] 身份、事件、artifact、job、agent 的数据所有权无双写歧义。
- [ ] 备份恢复、上游升级、应用 rollback、Provider outage 均已演练。
- [ ] Secret、PII、对话、Memory、上传材料的 retention/删除路径验证。
- [ ] Cost budget、quota、anomaly alert 和人工 override 审计就绪。
- [ ] Dashboard/alert/runbook/on-call owner 就绪。
- [ ] Pilot 用户、数据范围、支持窗口和退出条件明确。

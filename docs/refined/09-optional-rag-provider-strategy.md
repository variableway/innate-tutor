# 09 · 无 RAG 默认模式与可替换 Provider 策略

## 1. 决策

第一阶段默认不安装、不启动、不依赖 RAG。课程生成、Catalog、Player 和 DeepTutor 当前场景问答都必须在无 RAG 时工作。

RAG 是满足以下需求时才启用的增强能力：

- 一份或多份资料超过直接上下文预算；
- 需要跨课程、跨章节或私有知识检索；
- 回答必须提供可打开的原始出处；
- 材料频繁变化，不适合每次完整塞入 prompt；
- 受监管场景要求证据和审计。

## 2. 三种运行模式

| 模式 | 组件 | 优点 | 限制 | 推荐阶段 |
| --- | --- | --- | --- | --- |
| No RAG | OpenMAIC + DeepTutor LLM | 最少资源、最快验证、故障面小 | 无可靠原始引用、长资料覆盖弱 | 第一阶段默认 |
| DeepTutor Local RAG | DeepTutor + LlamaIndex/本地索引 | 不增加服务，接入最短 | 索引绑定工作区，多副本/迁移较弱 | 单机 spike |
| External RAG | LightRAG 或其他 HTTP Provider | 独立扩缩、可被多个 Adapter 使用 | 多一个服务和 Provider 运维 | 引用/长文档被验证后 |

Compose 中：

```bash
# 默认无 RAG
docker compose up -d

# 可选内置 LightRAG
docker compose --profile rag-lightrag up -d
```

外部 RAG 不需要修改 Compose：保持 profile 关闭，由 DeepTutor 配置或未来 Adapter 指向外部 endpoint。

## 3. 无 RAG 的上下文合同

Tutor request 只使用服务端重新加载的可信内容：

```text
Course title/summary
+ current courseVersionId
+ current sceneId/title/text
+ user selection
+ optional previous turns within token budget
```

无 RAG 响应必须：

- 不伪造页码、出处或 SourceRef；
- 明确区分“根据当前课程内容”和“一般模型知识”；
- 当前 scene 没有答案时允许说明不知道；
- 不自动扩大到 web search；
- 不影响 Player、Quiz 和 Catalog 可用性。

## 4. 可替换契约

业务层只依赖 `RagProviderPort`：

```python
class RagProviderPort(Protocol):
    async def health(self) -> RagHealth: ...
    async def ingest(self, source: SourceDocumentRef) -> IngestHandle: ...
    async def retrieve(self, request: RetrievalRequest) -> list[RetrievalChunk]: ...
    async def delete(self, source_id: str) -> None: ...
```

规范化结果：

```typescript
interface RetrievalChunk {
  sourceRefId: string;
  text: string;
  locator: { page?: number; section?: string; fragment?: string };
  score?: number;
  contentHash: string;
  providerTraceRef?: string;
}
```

Provider 自有的 collection、workspace、graph node、vector ID、认证格式不能进入 CourseArtifact、LearningEvent 或前端 API。

## 5. 可选择和替换的实现

DeepTutor 当前已经具备多个 RAG 方向，包括本地 LlamaIndex、PageIndex、GraphRAG、LightRAG、Obsidian 以及外部 LightRAG Server。Innate 第一版不承诺同时支持全部，只实现一个 Adapter，其他 Provider 必须通过相同 contract 和 conformance tests。

选择建议：

| 需求 | 首选 |
| --- | --- |
| 单机、少量 PDF、最快验证 | DeepTutor Local LlamaIndex |
| 独立服务、图谱 + 向量、多个消费者 | External LightRAG |
| 已有企业搜索/向量平台 | 自定义 HTTP Adapter |
| 第一阶段主题/短资料生成 | No RAG |

## 6. 替换与迁移规则

RAG Provider 可以替换，但索引通常不能直接迁移。安全步骤为：

1. 原始 SourceDocument 和 stable SourceRef 始终保存在 Innate 控制范围；
2. 新 Provider 使用相同原始材料重新解析或重新索引；
3. 保持 `sourceRefId/locator/contentHash` 对外稳定；
4. 对固定问题集 shadow retrieve，比较召回、引用、延迟和费用；
5. 通过 tenant/environment feature flag 小流量切换；
6. 保留旧 Provider 只读回滚窗口；
7. 观察期结束后删除旧索引并产生审计记录。

Embedding 模型或维度变化也视为一次 Provider/index migration，必须重建索引。不能把旧向量静默用于新模型。

## 7. Provider Conformance Gate

任何新 Provider 至少通过：

- health/timeout/auth 错误规范化；
- ingest 幂等和状态可查询；
- tenant/KB/source scope 不越权；
- top-k 和 token budget 生效；
- 每个返回 chunk 有稳定 SourceRef/locator；
- 删除后不能继续被检索；
- provider timeout 时 Tutor 降级为 direct context；
- 固定问题集的 recall/citation/latency/cost 报告。

## 8. Phase 任务

### 第一阶段：No RAG

- [ ] **P0R-01** Compose 默认不激活任何 RAG profile。
- [ ] **P0R-02** OpenMAIC 主题和短材料生成不依赖 Embedding 配置。
- [ ] **P0R-03** DeepTutor 当前 scene 问答不创建 KB。
- [ ] **P0R-04** UI/文案不展示虚假引用能力。
- [ ] **P0R-05** 保存原始材料、scene ID、checksum，为后续索引保留入口。

### 触发后：单 Provider Spike

- [ ] **P0R-06** 根据真实需求选择 Local LlamaIndex 或 External LightRAG，只选一个。
- [ ] **P0R-07** 实现 `RagProviderPort` Adapter 和 fixture contract。
- [ ] **P0R-08** 建立 20 个问题的 retrieval/citation benchmark。
- [ ] **P0R-09** 验证 Provider 故障自动退回 direct context。
- [ ] **P0R-10** 形成继续、替换或保持 No RAG 的 Go/No-Go。

# InnateTutor 三段式架构方案（云端生产 · 客户端发布与进度 · AI 对话 Agent）

> **报告日期**：2026-08-06
> **报告定位**：在「组件集成分析」「服务级集成」两份报告基础上，**按照三段式职责重构**——清晰拆分云端（生产）、客户端（消费）、AI Agent（陪伴）三个独立可演进层级。
>
> **核心结论**：✅ **这种划分非常合理**。前两份报告的"组件化 monorepo"思路与之并不冲突，但需要把"InnateTutor"项目**重新设计为按职责横向拆分为三个独立子产品**，每个子产品独立伸缩、独立替换、独立升级。两大开源项目（DeepTutor / OpenMAIC）将作为这些子产品的"组件库"被按需引入。

---

## 1. 三段式架构总览

### 1.1 职责定义

```mermaid
flowchart TB
  subgraph Cloud["☁️ 云端 (Cloud) — 重资源 · 异步 · 批量生产"]
    C1["教程生成 (Tutorial Producer)"]
    C2["课堂生成 (Classroom Producer)"]
    C3["媒体生产 (Media Producer)"]
    C4["内容审核与版本 (Review & Version)"]
    C5["内容发布与 CDN (Publishing)"]
  end

  subgraph Client["🖥️ 客户端 (Client) — 轻量 · 离线 · 进度跟踪"]
    K1["播放 / 阅读 (Player / Reader)"]
    K2["进度与笔记 (Progress & Notes)"]
    K3["离线缓存 (Offline Cache)"]
    K4["导出与分享 (Export & Share)"]
  end

  subgraph Agent["🤖 AI 对话 Agent (Companion) — 低延迟 · 上下文敏感 · 个性化"]
    A1["上下文加载 (Context Loader)"]
    A2["即时问答 (Real-time Q&A)"]
    A3["知识扩展 (Knowledge Expansion)"]
    A4["引导与反馈 (Hinting & Feedback)"]
  end

  Cloud -- "推送内容版本" --> Client
  Client -- "上报进度 / 提问" --> Agent
  Agent -- "触发工具 / 检索" --> Cloud
  Cloud -- "提供 RAG / 检索" --> Agent
  Client -- "持久化同步" --> Cloud
```

### 1.2 三层职责矩阵

| 层级 | 角色 | 关键属性 | 主要组件来源 |
| --- | --- | --- | --- |
| **☁️ Cloud** | 教程 / 课堂 / 媒体的**生产** | 重资源 · 异步作业 · 可中断 · 高吞吐 | OpenMAIC + DeepTutor 工具链 |
| **🖥️ Client** | 内容的**消费 + 进度跟踪** | 轻量 · 离线优先 · 同步、断点续传 | OpenMAIC Renderer + 自研 |
| **🤖 Agent** | 上下文敏感的**陪伴式答疑** | 低延迟 · 流式 · 个性化 · 上下文跟随 | DeepTutor Agent Loop + RAG |

### 1.3 与前两份报告的关系

| 之前报告 | 重点 | 本报告调整 |
| --- | --- | --- |
| `integration-feasibility.md` | 服务级集成（REST/WS） | 保留作为"应急方案" |
| `new-project-integration.md` | 组件级 monorepo 集成 | **改造为按职责横向拆分**——不再是单一 monorepo 单体应用，而是分层独立子产品 |
| **`three-tier-architecture.md`（本报告）** | **三段式职责清晰划分** | **推荐方案** |

---

## 2. 调整后的整体架构

### 2.1 调整后的三段式架构

```mermaid
flowchart TB
  subgraph EDGE["🌐 边缘层 (CDN / Edge Runtime)"]
    CDN["静态资源 CDN<br/>（课件 / 媒体 / 翻译）"]
    EdgeAgent["Edge Agent<br/>（低延迟接入）"]
  end

  subgraph CLOUD["☁️ 云端 (Cloud) — 异步生产层"]
    direction TB
    CourseProd["Course Producer<br/>基于 @openmaic/generation"]
    TutorialProd["Tutorial Producer<br/>基于 deeptutor-book + cowriter"]
    MediaProd["Media Producer<br/>基于 @openmaic/{audio,media}"]
    Review["Review & Version<br/>人工审核 + 自动化校验"]
    Publish["Publishing Pipeline<br/>→ CDN + Storage"]
    CloudDB[("Postgres · S3 · Vector")]
    Queue["Job Queue<br/>(BullMQ / Celery)"]
    EventBus["Event Bus<br/>(webhook / SSE)"]
  end

  subgraph CLIENT["🖥️ 客户端 (Client) — 端侧消费层"]
    direction TB
    Player["Classroom Player<br/>基于 @openmaic/renderer"]
    Reader["Tutorial Reader<br/>基于自研 Reader"]
    Progress["Progress Tracker<br/>记录学习轨迹 / 笔记"]
    Offline["Offline Cache<br/>Service Worker + IndexedDB"]
    Sync["Sync Engine<br/>断点续传 / 冲突合并"]
    ClientSDK["@innate-tutor/client-sdk"]
  end

  subgraph AGENT["🤖 AI 对话 Agent (Companion) — 陪伴层"]
    direction TB
    Ingest["Context Ingest<br/>（加载当前课件 / 进度）"]
    Loop["Agent Loop<br/>基于 deeptutor-core"]
    Retrieval["RAG Pipeline<br/>基于 deeptutor-rag"]
    Memory["Memory Layers<br/>基于 deeptutor-memory"]
    Skills["Tool / Skills<br/>基于 deeptutor-skill"]
    Stream["Streaming Response<br/>SSE / WebSocket"]
  end

  subgraph SHARED["🧩 共享基础设施"]
    Auth["统一身份 OAuth / OIDC"]
    Meter["用量 / 计费 / 配额"]
    Telemetry["Telemetry / Trace"]
    Config["共享配置中心"]
  end

  CDN --> Client
  EdgeAgent --> Agent
  TutorStream["Tutorial / Course Event"] --> Queue
  CourseProd --> CloudDB
  TutorialProd --> CloudDB
  MediaProd --> CloudDB
  CloudDB --> Review
  Review --> Publish
  Publish --> CDN
  Publish --> EventBus
  EventBus --> Client
  Client --> Sync
  Sync --> CloudDB
  Client --> Progress
  Client --> Ingest
  Ingest --> Loop
  Loop --> Retrieval
  Loop --> Memory
  Loop --> Skills
  Loop --> Stream
  Stream --> Client
  Retrieval --> CloudDB
  Skills --> CloudDB
  Auth --> Client & Agent & Cloud
  Meter --> Cloud & Agent
  Telemetry --> Cloud & Agent & Client
  Config --> Cloud & Agent & Client
```

### 2.2 关键架构特点

1. **三层独立部署**：Cloud / Client / Agent 各自独立伸缩
2. **Cloud 是异步生产者**：所有重计算任务走消息队列
3. **Client 是离线优先**：本地缓存 + 断点同步
4. **Agent 是低延迟常驻服务**：流式响应，SSE
5. **共享基础设施**：身份 / 计费 / 监控 / 配置
6. **数据流向清晰**：Cloud→Client（推送）、Client→Agent（提问）、Agent→Cloud（检索）、Client→Cloud（同步）

---

## 3. 三个子产品的细化设计

### 3.1 ☁️ Cloud Tier — 内容生产云

#### 3.1.1 角色与组成

```mermaid
flowchart TB
  subgraph Producer["Producer 子系统"]
    P1["Tutorial Producer<br/>基于 DeepTutor Book + Co-Writer"]
    P2["Classroom Producer<br/>基于 OpenMAIC Generation"]
    P3["Quiz Producer<br/>基于 DeepTutor Question"]
    P4["Media Producer<br/>基于 OpenMAIC audio/media"]
  end

  subgraph Pipeline["Pipeline 子系统"]
    PL1["Outline Draft"]
    PL2["Review Gate"]
    PL3["Versioning"]
    PL4["Publish to CDN"]
  end

  subgraph Orchestration["Orchestration 子系统"]
    O1["Job Queue"]
    O2["Worker Pool"]
    O3["GPU Pool"]
    O4["Status Stream"]
  end

  subgraph Storage["Storage 子系统"]
    S1[("Postgres<br/>元数据")]
    S2[("S3 / 对象存储<br/>媒体文件")]
    S3[("Vector DB<br/>课件向量")]
    S4[("Redis<br/>缓存 / 队列")]
  end

  Producer --> Pipeline
  Pipeline --> Orchestration
  Orchestration --> Storage
```

#### 3.1.2 核心组件映射

| 子系统 | 使用的能力 | 来自 |
| --- | --- | --- |
| **Tutorial Producer** | BookEngine（章节编译） | DeepTutor `book/` |
| | Co-Writer（选区编辑） | DeepTutor `co_writer/` |
| | Knowledge Manifest | DeepTutor `knowledge/manifest.py` |
| **Classroom Producer** | OutlineGenerator | OpenMAIC `@openmaic/generation` |
| | SceneGenerator | OpenMAIC `@openmaic/generation` |
| | Director Graph | OpenMAIC `lib/orchestration/` |
| | Action Engine | OpenMAIC `lib/action/` |
| **Quiz Producer** | Question Agent | DeepTutor `agents/question/` |
| | Quiz Grading | DeepTutor `learning/grading.py` |
| **Media Producer** | TTS Synth | OpenMAIC `@openmaic/audio` |
| | ASR Transcribe | OpenMAIC `@openmaic/audio` |
| | Image Generation | OpenMAIC `@openmaic/media` |
| | Video Generation | OpenMAIC `@openmaic/media` |
| **Pipeline** | Review workflow | 自研 |
| | Versioning | 基于 Git semantics |
| | CDN Upload | S3 / OSS |
| **Orchestration** | Job Queue | BullMQ / Celery |
| | Worker Pool | K8s / Fargate |
| | GPU Pool | K8s GPU node |

#### 3.1.3 异步任务流程

```mermaid
sequenceDiagram
  participant U as 用户 / 管理员
  participant API as Cloud API
  participant Q as Job Queue
  participant W as Worker
  participant DB as Postgres + S3 + Vector
  participant CDN

  U->>API: 提交 Topic + 材料
  API->>Q: 入队 (job_id, spec)
  API-->>U: 202 Accepted + job_id
  Q->>W: 分发任务
  W->>DB: 写入进度
  W->>W: Outline 生成
  W->>W: 素材检索 (RAG)
  W->>W: Scene 生成
  W->>W: 媒体制作 (TTS/Image)
  W->>DB: 写入持久化
  W->>CDN: 上传静态资源
  W->>DB: 标记完成 + 版本号
  Note over U,API: 客户端通过 Webhook / SSE 订阅
  CDN->>U: 内容可用
```

#### 3.1.4 部署形态

```mermaid
flowchart TB
  subgraph Cloud["Cloud (Production Cluster)"]
    API["API Gateway<br/>FastAPI / Express"]
    Q[("Job Queue")]
    W1["Worker 1 (CPU)"]
    W2["Worker 2 (CPU)"]
    W3["Worker 3 (GPU)"]
    W4["Worker 4 (GPU)"]
    DB[("Postgres")]
    S3[("S3 / OSS")]
    VEC[("Vector DB")]
  end

  CDN["CDN"]
  M["Prometheus + Grafana"]
  L["Loki / ELK"]

  API --> Q
  Q --> W1 & W2 & W3 & W4
  W1 & W2 & W3 & W4 --> DB
  W1 & W2 & W3 & W4 --> S3
  W1 & W2 & W3 & W4 --> VEC
  W1 & W2 & W3 & W4 --> CDN
  API --> M
  W1 & W2 & W3 & W4 --> L
```

---

### 3.2 🖥️ Client Tier — 端侧消费 + 进度

#### 3.2.1 角色与组成

```mermaid
flowchart TB
  subgraph Shell["Client Shell"]
    App["主应用壳 (Next.js PWA)"]
    Router["路由 / Workspace"]
  end

  subgraph Consumer["内容消费"]
    Player["Classroom Player<br/>@openmaic/renderer"]
    Reader["Tutorial Reader<br/>自研 (基于 DeepTutor Markdown)"]
    QuizUI["Quiz UI<br/>基于 DeepTutor Question"]
    NoteUI["Note/Annotation UI"]
  end

  subgraph State["本地状态"]
    Progress["Progress Tracker<br/>Zustand + IndexedDB"]
    Notes["Notes Store<br/>Zustand + IndexedDB"]
    Favorites["Favorites / Bookmarks"]
  end

  subgraph Sync["同步层"]
    SyncEngine["Sync Engine<br/>断点续传 · 冲突合并"]
    SW["Service Worker<br/>离线缓存"]
    BgSync["Background Sync"]
  end

  subgraph SDK["客户端 SDK"]
    CSdk["@innate-tutor/client-sdk"]
    AAR["Auth / RBAC"]
    OBS["Telemetry"]
  end

  Shell --> Consumer
  Consumer --> State
  State --> Sync
  Shell --> SDK
```

#### 3.2.2 核心组件映射

| 子系统 | 使用的能力 | 来自 |
| --- | --- | --- |
| **Classroom Player** | Renderer（与 Web 解耦） | OpenMAIC `@openmaic/renderer` |
| | DSL Runtime | OpenMAIC `@openmaic/dsl` |
| | Stage API | OpenMAIC `@openmaic/stage-api`（待提取） |
| **Tutorial Reader** | Markdown / KaTeX / Mermaid | 自研 |
| | Book Block | DeepTutor `book/`（待提取 @deeptutor/reader） |
| **Quiz UI** | Question Card | DeepTutor `learning/` |
| | Mastery Visualizer | 自研 |
| **Progress Tracker** | Zustand Store | 自研 |
| | IndexedDB persist | OpenMAIC `@openmaic/storage` 思路 |
| **Sync Engine** | Outbox Pattern | 自研 |
| | Conflict Resolution | 自研（CRDT 思路） |
| **Offline Cache** | Service Worker | 自研 |
| | IndexedDB | 自研 |

#### 3.2.3 离线优先策略

```mermaid
flowchart LR
  subgraph On["在线"]
    A1["请求课程"]
    A2["CDN 拉取"]
    A3["写入 IndexedDB"]
    A4["播放 / 同步"]
  end

  subgraph Off["离线"]
    B1["打开应用"]
    B2["本地 IndexedDB 命中"]
    B3["播放 + 进度写入本地"]
    B4["网络恢复后增量同步"]
  end

  A1 --> A2 --> A3 --> A4
  B1 --> B2 --> B3 --> B4
  B4 --> A4
```

#### 3.2.4 进度同步协议

```typescript
// 客户端 SDK 协议
interface ProgressEvent {
  userId: string;
  clientId: string;          // 用于幂等
  timestamp: number;
  contentId: string;         // 教程 / 课堂 ID
  scene?: string;            // 选填: 课堂场景 ID
  type: 'view' | 'complete' | 'quiz' | 'note' | 'bookmark';
  payload: ViewPayload | CompletePayload | QuizPayload | NotePayload | BookmarkPayload;
}

// 增量同步
POST /api/v1/client/progress { events: ProgressEvent[] }

// → 服务端 sync 写入 Postgres
// → 触发 Agent 上下文更新
```

---

### 3.3 🤖 AI Agent Tier — 上下文敏感的陪伴

#### 3.3.1 角色与组成

```mermaid
flowchart TB
  subgraph Ingest["上下文接入"]
    I1["Context Loader<br/>读当前 contentId 的元数据"]
    I2["Progress Snapshot<br/>读用户的进度 / 笔记"]
    I3["Memory Recall<br/>读 L2 / L3 摘要"]
  end

  subgraph Loop["Agent Loop"]
    L1["Planner"]
    L2["Tool Router"]
    L3["Responder"]
    L4["Referee"]
  end

  subgraph Tools["工具集"]
    T1["RAG<br/>基于 deeptutor-rag"]
    T2["Web Search<br/>基于 @openmaic/web-search"]
    T3["Calculator"]
    T4["Code Runner<br/>Sandbox"]
    T5["Knowledge Expansion<br/>扩展检索 + 改写"]
  end

  subgraph Memory["记忆层"]
    M1["L1 Trace<br/>短期上下文"]
    M2["L2 Surface<br/>单场景摘要"]
    M3["L3 Profile<br/>用户画像"]
  end

  subgraph Stream["流式输出"]
    S1["SSE / WebSocket"]
    S2["Citation"]
    S3["Action Suggestion"]
  end

  Ingest --> Loop
  Loop --> Tools
  Loop --> Memory
  Loop --> Stream
```

#### 3.3.2 核心组件映射

| 子系统 | 使用的能力 | 来自 |
| --- | --- | --- |
| **Context Loader** | KD 解析 | DeepTutor `core/` |
| | Progress Join | 自研 |
| | Memory Recall | DeepTutor `services/memory/` |
| **Agent Loop** | 主循环 | DeepTutor `deeptutor-core` |
| | Tool Call | DeepTutor `core/tool_protocol.py` |
| | Capability 协议 | DeepTutor `core/capability_protocol.py` |
| **RAG** | 多引擎 | DeepTutor `deeptutor-rag` |
| | Embedding | DeepTutor `deeptutor-llm` |
| **Web Search** | 多 Provider | OpenMAIC `@openmaic/web-search` |
| **Memory** | L1/L2/L3 | DeepTutor `deeptutor-memory` |
| **Knowledge Expansion** | 检索 + 改写 | 自研 |
| **Streaming** | SSE | 自研 |

#### 3.3.3 上下文与知识扩展

```mermaid
sequenceDiagram
  participant U as 用户
  participant CLR as Client
  participant AG as Agent
  participant RAG as RAG
  participant Cloud as Cloud

  U->>CLR: 看到一段教程
  U->>CLR: 点击"问问 AI"
  CLR->>AG: 开 ctx=contentId/sceneId
  AG->>AG: 加载 content context + progress
  AG->>AG: 加载 L2/L3 memory
  AG->>RAG: 检索 教程 KB
  RAG-->>AG: top-k chunks
  AG->>AG: 拼装 prompt
  AG->>U: 流式回答
  U->>AG: "再展开一下"
  AG->>RAG: 扩展检索（broader）
  AG->>Cloud: Web 搜索（可选）
  AG->>AG: 多源综合
  AG->>U: 流式回答 + 引用
  U->>AG: "我的笔记在哪？"
  AG->>CLR: 拉取笔记
  CLR-->>AG: notes
  AG->>U: 引用 + 总结
```

#### 3.3.4 Agent 关键交互场景

| 场景 | 触发 | 能力 | 工具 |
| --- | --- | --- | --- |
| **即时讲解** | 选中一段文字 → "解释" | 上下文敏感解释 | RAG、Memory |
| **知识扩展** | "再深入一点" | 同主题扩展 | Web Search、Knowledge Expansion |
| **答疑** | "这道题为什么选 B" | 错题解析 | Progress、Quiz 数据 |
| **路径推荐** | "下一步该学什么" | 自适应路径 | Mastery Path |
| **笔记助手** | 写笔记中的伴随 | 知识补充 | RAG |
| **尝试性提问** | "我理解对吗" | 引导式反馈 | Loop 检查 |

#### 3.3.5 部署形态

```mermaid
flowchart TB
  subgraph Region["云区域 (Cloud Region)"]
    LB["Load Balancer<br/>WebSocket 亲和"]
    API["Agent Gateway<br/>FastAPI"]
    LB --> API
    API --> A1["Agent Node 1"]
    API --> A2["Agent Node 2"]
    API --> A3["Agent Node N"]
    A1 & A2 & A3 --> RAG[("Distributed Vector Cache")]
    A1 & A2 & A3 --> DB[("Postgres · Memory")]
  end

  subgraph Edge["边缘 (Edge Runtime)"]
    EA["Edge Agent<br/>小模型 / 缓存"]
  end

  subgraph Client["Client"]
    C1["Client A"]
    C2["Client B"]
  end

  C1 -- "问问题" --> EA
  EA -- "高置信度" --> C1
  EA -- "转交" --> API
  C2 -- "问问题" --> LB
```

> **Edge Agent 优化**：把常见问题（如"这段什么意思"）的响应在边缘节点缓存，首次问答 < 100ms；复杂问题回源到 Region Agent。

---

## 4. 调整后的实施路线图

### 4.1 阶段 0 — 顶层骨架（2 周）

```mermaid
gantt
  title 三段式骨架搭建
  dateFormat YYYY-MM-DD
  section 顶层
  仓库拆分 (cloud/ client/ agent/)        :s0a, 2026-08-15, 5d
  共享 schema / proto                     :s0b, after s0a, 4d
  CI + Lint + Test 流水线                  :s0c, after s0b, 3d
  OAuth / 监控基线                        :s0d, after s0b, 3d
```

建立：

```
innate-tutor/
├── cloud/              # Cloud 子产品
├── client/             # Client 子产品
├── agent/              # Agent 子产品
├── shared/             # 共享 schema / proto / types
└── infra/              # 共享基础设施
```

### 4.2 阶段 1 — Cloud MVP（4 周）

```mermaid
gantt
  title Cloud MVP
  dateFormat YYYY-MM-DD
  section Cloud Producer
  Tutorial Producer (DeepTutor Book)       :c1a, 2026-08-22, 10d
  Classroom Producer (OpenMAIC)            :c1b, after c1a, 10d
  Media Producer (TTS/Image)               :c1c, after c1b, 7d
  section Pipeline
  异步队列 (BullMQ / Celery)               :c1d, 2026-08-22, 5d
  审核流 + 版本                            :c1e, after c1d, 7d
  CDN 发布                                 :c1f, after c1e, 5d
```

### 4.3 阶段 2 — Client MVP（4 周）

```mermaid
gantt
  title Client MVP
  dateFormat YYYY-MM-DD
  section Client Shell
  Next.js PWA 骨架                        :k1a, 2026-09-22, 5d
  路由 + 鉴权                              :k1b, after k1a, 5d
  section Player
  Classroom Player (OpenMAIC Renderer)    :k1c, after k1b, 10d
  Tutorial Reader (自研)                    :k1d, after k1c, 7d
  section Progress
  Progress Tracker (IndexedDB)             :k1e, after k1d, 7d
  Sync Engine                              :k1f, after k1e, 5d
  Service Worker 离线缓存                   :k1g, after k1f, 5d
```

### 4.4 阶段 3 — Agent MVP（4 周）

```mermaid
gantt
  title Agent MVP
  dateFormat YYYY-MM-DD
  section Agent
  Context Loader (读进度 / 记忆)          :a1a, 2026-10-22, 7d
  Agent Loop (基于 deeptutor-core)         :a1b, after a1a, 10d
  RAG Pipeline (基于 deeptutor-rag)        :a1c, after a1b, 7d
  Streaming + Citation                      :a1d, after a1c, 5d
  Edge Agent 缓存                           :a1e, after a1d, 5d
```

### 4.5 阶段 4 — 联调 & 优化（4 周）

```mermaid
gantt
  title 联调与优化
  dateFormat YYYY-MM-DD
  section 联调
  端到端流程验证                            :i1a, 2026-11-22, 10d
  性能基准                                 :i1b, after i1a, 5d
  section 优化
  Cloud 缓存策略                            :i1c, after i1b, 5d
  Agent 边缘加速                            :i1d, after i1c, 7d
  Client 离线策略                          :i1e, after i1d, 5d
```

---

## 5. 关键设计决策

### 5.1 三层通信矩阵

| 通信 | 协议 | 方向 | 性能要求 |
| --- | --- | --- | --- |
| **Cloud → Client**（推送内容） | Webhook / SSE / Pull 缓存 | 主动 + 拉取 | 中（异步） |
| **Client → Cloud**（同步进度） | REST + 增量协议 | 主动 | 中（批量） |
| **Client → Agent**（提问） | WebSocket / SSE | 主动 | **高（< 100ms 首字节）** |
| **Agent → Cloud**（检索） | gRPC / REST | 主动 | 中（缓存） |
| **Agent → Client**（流式回答） | SSE | 主动 | **高（流式）** |

### 5.2 数据一致性策略

```mermaid
flowchart TB
  subgraph Single["单一权威源"]
    CloudDB[("Cloud Postgres")]
  end

  subgraph Local["本地权威（最终一致）"]
    ClientDB[("Client IndexedDB")]
  end

  subgraph Session["会话级权威"]
    AgentMem[("Agent Memory")]
  end

  CloudDB -- "sync" --> ClientDB
  ClientDB -- "report" --> CloudDB
  ClientDB -- "context" --> AgentMem
  AgentMem -- "consolidate" --> CloudDB
```

- **Cloud Postgres = 唯一真相**：所有最终数据
- **Client IndexedDB = 本地副本**：进度、笔记、缓存
- **Agent Memory = 会话级**：短期，会话结束落 Cloud

### 5.3 鉴权与权限

| 角色 | 权限 | 访问层 |
| --- | --- | --- |
| **Admin** | 全权 | Cloud + Client + Agent |
| **Teacher** | 创建内容、查看学生进度 | Cloud + Client |
| **Student** | 消费内容、提问 | Client + Agent |
| **Guest** | 公共内容预览 | Client（只读） |

### 5.4 配额与计费

| 层 | 配额维度 | 计费模型 |
| --- | --- | --- |
| **Cloud** | 教程数 / 课堂数 / 媒体生成量 | 包月 / 按量 |
| **Client** | 离线容量 / 同步频率 | 包含 |
| **Agent** | 每用户每月调用次数 / Token 量 | 按量 |

### 5.5 监控指标

| 层 | 关键指标 |
| --- | --- |
| **Cloud** | 任务吞吐、平均生成时长、失败率、队列长度 |
| **Client** | DAU / 离线率 / 资源加载 P95 / 进度同步 P95 |
| **Agent** | 首字节延迟 / 流式吐字速率 / 引用准确率 / 重试率 |

---

## 6. 数据流：端到端示例

### 6.1 用户学习一个"Python 入门"课堂

```mermaid
sequenceDiagram
  actor U as 用户
  participant CL as Client
  participant AG as Agent
  participant CD as Cloud
  participant CDN

  Note over CD: 之前: 老师发布"Python 入门"课堂
  CD->>CDN: 课件打包上传
  CDN-->>CD: 已发布 v1.0

  U->>CL: 打开 app
  CL->>CDN: 拉取 manifest
  CDN-->>CL: 课程列表
  U->>CL: 进入"Python 入门"
  CL->>CD: 同步进度
  CL->>CDN: 加载场景
  CDN-->>CL: 场景包
  CL->>U: 渲染场景

  U->>CL: 选中一段代码看不懂
  U->>CL: 点"问 AI"
  CL->>AG: 连接 WebSocket
  AG->>CD: 拉取 context (contentId/sceneId)
  CD-->>AG: 上下文 + 摘要
  AG->>AG: LLM 思考
  AG-->>CL: 流式回答
  CL->>U: 显示回答 + 引用

  U->>CL: 写笔记
  CL->>CD: 同步笔记
  CD-->>AG: 更新 memory
  AG->>AG: 巩固 L2
```

### 6.2 老师创建一个新教程

```mermaid
sequenceDiagram
  actor T as 老师
  participant CL as Client
  participant CD as Cloud
  participant AG as Agent

  T->>CL: 进入"教程编辑器"
  CL->>CL: 编辑大纲
  CL->>CD: 提交 Outline
  CD->>CD: 异步生成 (Job 1)
  CD->>CD: 异步生成媒体 (Job 2,3)
  CD->>CD: 审核
  CD->>CD: 版本化 v1.0
  CD->>CD: 发布
  CD-->>CL: 已发布 + 通知

  T->>AG: "我这份教程有没有什么补充？"
  AG->>CD: 拉取教程
  AG->>AG: 检索扩展资料
  AG-->>T: 建议补充点
```

---

## 7. 与上一份"组件集成方案"的对比

| 维度 | 上一份（组件 monorepo） | 本报告（三段式） |
| --- | --- | --- |
| **仓库结构** | 单一 monorepo（apps + services + libs） | **三个独立子产品仓库**（cloud / client / agent） |
| **运行时** | 双语言同进程 | **三层独立部署** |
| **伸缩** | 整体伸缩 | **各层独立伸缩** |
| **更换成本** | 整体替换 | **每层独立替换** |
| **研发分工** | 统一团队 | **Cloud / Client / Agent 三个团队** |
| **MVP 周期** | 16-20 周 | **14 周（4+4+4+2 联调）** |
| **适合阶段** | 早期单团队 | **长期产品化** |
| **互操作性** | 紧密耦合 | **REST/WebSocket 标准化** |

---

## 8. 关键交付物清单

### 8.1 Cloud
- [ ] 异步任务队列（Job Queue）
- [ ] 教程生成器（DeepTutor Book 包装）
- [ ] 课堂生成器（OpenMAIC Generation 包装）
- [ ] 媒体生成器（OpenMAIC audio/media 包装）
- [ ] 审核流 + 版本
- [ ] CDN 发布
- [ ] 元数据 API

### 8.2 Client
- [ ] PWA 壳
- [ ] Classroom Player（OpenMAIC Renderer）
- [ ] Tutorial Reader
- [ ] Progress Tracker
- [ ] Sync Engine
- [ ] 离线缓存（Service Worker）
- [ ] 导出 / 分享

### 8.3 Agent
- [ ] Context Loader
- [ ] Agent Loop（DeepTutor core 包装）
- [ ] RAG Pipeline（DeepTutor rag 包装）
- [ ] Memory Layers（DeepTutor memory 包装）
- [ ] Knowledge Expansion
- [ ] Streaming + Citation
- [ ] Edge Agent 缓存

### 8.4 共享
- [ ] 统一 OAuth / OIDC
- [ ] 共享 Schema（TypeScript + Python）
- [ ] 共享配置中心
- [ ] Telemetry / Trace
- [ ] 计费 / 配额

---

## 9. 风险与缓解

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| 三层间的契约不稳定 | 🟠 高 | **先定义 proto / TS / Py 共享 schema**，再实现 |
| Cross-tier 调试复杂 | 🟡 中 | 统一 Trace ID + OpenTelemetry |
| 鉴权一致性 | 🟡 中 | 共享 OAuth 服务，JWT 传递 |
| 进度同步冲突 | 🟡 中 | 客户端 CRDT，服务端权威冲突合并 |
| 三团队协作 | 🟡 中 | 共享 Backend For Frontend / API 文档 |
| Agent 延迟不达标 | 🟠 高 | Edge Agent + 缓存 + 预热 |
| Client 离线后冲突 | 🟡 中 | 离线只追加，回连后合并 |
| Cloud 任务失控 | 🟡 中 | Job Queue 限流 + 超时 + 重试 |

---

## 10. 推荐起步

```mermaid
flowchart TB
  Start([立即开始]) --> Decision{团队规模?}
  Decision -- "1-2 人" --> P1["阶段 1 + 阶段 2 最小版<br/>只做 Cloud + 静态 Client"]
  Decision -- "3-5 人" --> P2["阶段 1-3 同步<br/>三组并行"]
  Decision -- "6+ 人" --> P3["完整 4 阶段<br/>Cloud/Client/Agent 独立团队"]
  P1 --> V1["MVP 验证 4 周"]
  P2 --> V2["Beta 8-12 周"]
  P3 --> V3["生产 14 周"]
```

> **不论规模，都建议先做阶段 1（Cloud + 第一个客户端渲染）**，验证生产链路通畅后，再启动 Agent。

---

## 11. 总结

| 维度 | 结论 |
| --- | --- |
| **是否需要调整** | ✅ **需要且对齐** |
| **核心变化** | 从"单一 monorepo"调整为"**三段式独立子产品**" |
| **最大优势** | **独立伸缩、独立替换、独立团队** |
| **关键决策** | （1）三段独立仓库（2）Agent 优先 Edge 部署（3）Client 离线优先（4）Cloud 异步生产 |
| **资源复用** | OpenMAIC → Cloud 生产 + Client 播放；DeepTutor → Cloud 教程 + Agent 答疑 |
| **MVP 周期** | 14 周（4+4+4+2 联调） |
| **下一步** | 阶段 0 拆分仓库 + 定义共享 schema |

> **最终建议**：把"InnateTutor"重新定义为"**Innate Cloud** + **Innate Client** + **Innate Agent**"三个子产品的组合，每个子产品独立演进，共享 schema / 鉴权 / 监控。两个开源项目（DeepTutor / OpenMAIC）作为这些子产品的"组件供应链"，按需引入。

---

## 附录 A · 子产品技术栈

### A.1 Cloud 子产品
- **运行时**：Node.js 20+（OpenMAIC）/ Python 3.11+（DeepTutor）
- **框架**：FastAPI + Express + BullMQ
- **存储**：Postgres + S3 + Vector DB (Qdrant / Pinecone)
- **GPU**：可选（VoxCPM2 / MinerU / ComfyUI）
- **监控**：Prometheus + Grafana + Loki

### A.2 Client 子产品
- **运行时**：Browser（现代 evergreen）
- **框架**：Next.js 16 (PWA)
- **状态**：Zustand + IndexedDB
- **UI**：shadcn/ui + Radix
- **离线**：Service Worker + Background Sync
- **渲染**：OpenMAIC Renderer + 自研 Reader

### A.3 Agent 子产品
- **运行时**：Node.js 20+（边缘）/ Python 3.11+（区域）
- **框架**：FastAPI + WebSocket
- **核心**：DeepTutor Agent Loop + RAG + Memory
- **边缘**：Cloudflare Workers / Vercel Edge
- **缓存**：Redis + Vector Cache

### A.4 共享基础设施
- **身份**：OAuth / OIDC
- **Schema**：Protobuf / TypeScript / Pydantic
- **监控**：OpenTelemetry + Sentry
- **CI**：GitHub Actions
- **IaC**：Terraform / Helm

---

## 附录 B · 三层 SLA 目标

| 层 | 可用性 | 延迟 | 吞吐 |
| --- | --- | --- | --- |
| **Cloud** | 99.9% / 月 | 任务完成 < 5 分钟 | 1000 任务 / 小时 |
| **Client** | 99.5% / 月（依赖 CDN） | 首屏 < 1.5s | 50k 并发 |
| **Agent** | 99.95% / 月 | 首字节 < 200ms | 10k 并发连接 |

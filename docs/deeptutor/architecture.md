# DeepTutor 系统架构图

> **DeepTutor** 是一个面向终身学习的"代理原生"（agent-native）个性化辅导工作台。它把 Chat / Quiz / Research / Visualize / Solve / Mastery Path 等多种学习模式统一在一个 Agent Loop 之上，并把知识库、笔记、记忆、Skill、Partner 等可复用的学习上下文在同一运行时中串起来。

---

## 1. 总体架构（System Architecture）

下图展示了 DeepTutor 从前端到后端、从运行时到外部 LLM / RAG / IM 渠道的整体分层。

```mermaid
flowchart TB
  subgraph Client["🖥️ 客户端层"]
    Web["Next.js 16 Web Frontend<br/>(theme / chat / knowledge / settings)"]
    CLI["deeptutor CLI<br/>(Typer REPL · NDJSON)"]
    IM["IM 渠道<br/>Feishu / Slack / Telegram / Discord / Mattermost …"]
  end

  subgraph Edge["🚪 接入层 · Next.js Middleware"]
    Proxy["proxy.ts<br/>/api/* & /ws/* 反向代理"]
    Auth["Auth · ACCESS_CODE / PocketBase"]
  end

  subgraph Backend["⚙️ FastAPI 后端 (deeptutor.api)"]
    Routers["Routers<br/>chat · notebook · book · knowledge · partner<br/>mastery · quiz · co_writer · memory · settings"]
    WS["Unified WebSocket<br/>(流式事件总线)"]
    App["DeepTutorApp (deeptutor.app)"]
  end

  subgraph Runtime["🧠 Agent Runtime (deeptutor.runtime)"]
    Mode["RunMode · CLI / Server"]
    Orchestrator["ChatOrchestrator"]
    LoopCaps["LoopCapability 注册中心<br/>chat / solve / mastery / research / explore_context"]
    ProviderView["ProviderToolView / 工具作用域"]
    Registry["ToolRegistry + DeferredToolLoader"]
  end

  subgraph Core["🧩 Core (deeptutor.core)"]
    Ctx["UnifiedContext · 流式上下文"]
    Bus["StreamBus · 事件总线"]
    Tools["ToolProtocol · CapabilityProtocol"]
    Trace["Trace · L1 事件追溯"]
    Agentic["Agentic 调度<br/>(LLMClient · DispatchToolCalls)"]
  end

  subgraph Agents["🤖 能力模块 (deeptutor.agents)"]
    ChatA["Chat · AgenticChatPipeline"]
    SolveA["Solve · DeepSolve Loop"]
    ResearchA["Research · DecomposeAgent / ResearchAgent"]
    QuestionA["Question · Coordinator + ReAct"]
    VisualA["Visualize · Charts / Diagrams / Animations"]
    MathA["MathAnimator · Manim"]
    NotebookA["Notebook · 分析 / 总结"]
    VisionA["VisionSolver"]
  end

  subgraph Services["🛠️ 服务层 (deeptutor.services)"]
    LLM["LLM 多 Provider 适配"]
    Embed["Embedding 适配"]
    RAG["RAG (LlamaIndex / PageIndex / GraphRAG / LightRAG / Obsidian)"]
    Search["Web / Paper Search"]
    Sandbox["Sandbox · Skill / Tools 执行"]
    MCP["MCP Client & Registry"]
    Memory["Memory 三层架构 L1/L2/L3"]
    Partner["Partner IM 渠道适配"]
    Skill["Skill Marketplace (ClawHub)"]
    Generators["Image / Video / Voice 生成"]
  end

  subgraph Storage["💾 存储"]
    Data["data/user · users · partners · system (JSON)"]
    PocketBase["PocketBase (可选)"]
    VectorStores["向量库 (FAISS / LightRAG / GraphRAG)"]
    FS["本地文件 / 数据湖"]
  end

  subgraph External["🌐 外部世界"]
    LLMApi["OpenAI · Anthropic · Gemini · Bedrock · Novita · …"]
    Hub["ClawHub / EduHub 技能市场"]
    IMApi["IM 平台 API"]
  end

  Web --> Proxy
  CLI --> App
  IM --> Auth
  Proxy --> Routers
  Auth --> Routers
  Routers --> WS
  Routers --> App
  App --> Orchestrator
  Orchestrator --> LoopCaps
  LoopCaps --> ChatA & SolveA & ResearchA & QuestionA & VisualA & MathA & NotebookA & VisionA
  ChatA & SolveA & ResearchA & QuestionA --> Agentic
  Agentic --> Bus
  Agentic --> Ctx
  Agentic --> Trace
  Agentic --> Tools
  Registry --> Tools
  Agentic --> LLM
  ProvidersView --> ProviderView
  ChatA & SolveA & ResearchA --> RAG
  ChatA & SolveA --> Memory
  ChatA & SolveA --> MCP
  ChatA & SolveA --> Search
  ChatA & SolveA --> Generators
  Partner --> IMApi
  Skill --> Hub
  Orchestrator --> Data
  RAG --> VectorStores
  Memory --> FS
  Data -.可选.-> PocketBase
  LLM --> LLMApi
```

---

## 2. Agent Loop 架构（Chat Agent Loop）

DeepTutor 的所有能力（Chat / Solve / Mastery / Research / Visualize）共享同一个 Agent Loop。

```mermaid
flowchart LR
  User((User Input)) --> Compose["Composer<br/>上下文：subagent · KB · persona · model · voice"]
  Compose --> PreLoop["LoopCapability.pre_loop<br/>(e.g. ExploreContext 客观摘要)"]
  PreLoop --> KBSeed["KB Seed<br/>最多 3 个 KB · 每 KB 4000 字"]
  KBSeed --> Loop1{"Round ≤ LLM_MAX_ROUNDS"}

  Loop1 -- 是 --> Think["LLM 思考<br/>(token budget · context window)"]
  Think --> Tools{"tool_calls?"}
  Tools -- 是 --> Dispatch["DispatchToolCalls<br/>(并行 ≤ MAX_PARALLEL_TOOL_CALLS)"]
  Dispatch --> Builtins["Built-in Tools<br/>rag · kb_files · read_source · read/write_memory<br/>read_skill · exec · web_fetch · ask_user<br/>list_notebook · write_note · github · consult_subagent"]
  Dispatch --> Opts["User Tools<br/>brainstorm · web_search · paper_search<br/>reason · geogebra_analysis · imagegen · videogen"]
  Builtins & Opts --> Observed["Tool Results"]
  Observed --> Loop1
  Tools -- 否 --> Stream["流式输出<br/>(StreamBus 节流)"]
  Stream --> Memory["Memory 写入<br/>L1 trace + L2 surface"]
  Stream --> End((完成 / Ask User 暂停))

  Loop1 -- 否 --> End
```

---

## 3. Partner 架构

"Partner = 一个有个性和手机号 的 Chat"。它把已配置 SOUL · 模型 · 渠道 · 工具的聊天实例挂载到 IM 平台。

```mermaid
flowchart TB
  subgraph PartnerWS["Partner Workspace (data/partners/<id>/workspace/)"]
    Soul["SOUL.md · 人设"]
    Model["Model Policy"]
    Lib["KB / Skill / Notebook 快照"]
    Mem["Own Memory (只读 owner · 写自己)"]
    Channels["Channels (schema-driven)"]
  end

  subgraph Channels["IM 渠道 Schema"]
    Feishu["Feishu"]
    Slack["Slack"]
    Telegram["Telegram"]
    Discord["Discord"]
    DingTalk["DingTalk"]
    Matter["Mattermost"]
    Matrix["Matrix / Mochat / Teams / …"]
  end

  Web["Web Chat"] --> ChatOr["ChatOrchestrator"]
  Feishu & Slack & Telegram & Discord & DingTalk & Matter & Matrix --> ChatOr
  ChatOr --> Soul
  ChatOr --> Lib
  ChatOr --> Mem
  ChatOr --> Mem
```

---

## 4. 运行时部署架构

```mermaid
flowchart LR
  subgraph Browser["Browser"]
    FE["Next.js Static / Standalone"]
  end

  subgraph Container["Docker / Podman / 本机"]
    subgraph FE_["Frontend (deeptutor start 启动 Next.js)"]
      Next["Next.js standalone server :3782"]
      Proxy["proxy.ts 中间件"]
    end
    subgraph BE_["Backend (FastAPI)"]
      FastAPI["FastAPI :8001"]
      Workers["异步任务 / Sandbox"]
    end
  end

  Browser -- HTTPS / WS --> Next
  Next -- /api/* & /ws/* --> Proxy
  Proxy -.内网.-> FastAPI
  FastAPI --> Workers
  Workers --> External["LLM / Vector / Storage"]
```

> 仅需对外暴露 `3782` 端口；`8001` 仅在直接调试 API 时可选暴露。

---

## 5. 多用户 / 数据布局

```mermaid
flowchart TB
  subgraph Data["data/"]
    User["user/<br/>Admin workspace + global settings"]
    Users["users/&lt;uid&gt;/<br/>独立 chat · memory · notebook · KB"]
    Partners["partners/&lt;id&gt;/workspace/<br/>Partner-scoped KB/Skill/Notebook"]
    CLIApps["cli-apps/<br/>只读挂载到 Sandbox"]
    System["system/<br/>auth · grants · audit · user-secrets"]
  end

  User --> Admin["首位注册 = Admin"]
  Users --> PerUser["每用户隔离 · 视图脱敏"]
  Partners --> PartnerScope["Partner = 合成用户"]
  System --> OAuth["OAuth tokens (Codex)"]
```

---

## 6. 记忆三层 (Memory Layers)

```mermaid
flowchart TB
  subgraph L1["L1 — Trace (workspace mirror + 事件流)"]
    L1c["trace/&lt;surface&gt;/&lt;date&gt;.jsonl"]
  end
  subgraph L2["L2 — Surface (单场景摘要)"]
    L2c["L2/&lt;surface&gt;.md"]
  end
  subgraph L3["L3 — Synthesis (跨场景合成)"]
    L3c["L3/profile · recent · scope · preferences.md"]
  end

  L1 -- 抽取 --> L2
  L2 -- 合成 + 引用 --> L3
  L3 -- 引用链 --> L1
```

每条 L3 主张都能追溯到 L1 的原始事件；Memory 浏览器提供 **Memory Graph** 视图。

---

## 7. 关键架构特点总结

| 特性 | 体现 |
| --- | --- |
| **One Runtime for Every Mode** | Chat / Solve / Quiz / Research / Visualize / Mastery 都跑在同一个 Agent Loop |
| **Loop Capability 扩展** | 通过 `LoopCapability` 协议无侵入地加入新能力（默认不抑制 chat 工具面） |
| **Provider Flexibility** | 25+ 个 LLM / TTS / STT / Image / Video Provider 适配 |
| **Multi-Engine RAG** | LlamaIndex / PageIndex / GraphRAG / LightRAG / Obsidian 都能挂入 |
| **Memory Auditable** | 三层文件 + Memory Graph，记忆可读、可审、可改 |
| **Subagent & Partner** | 既有 Claude Code / Codex 等外部代理，也在内部跑 Partner Bot |
| **Multi-User Ready** | 单实例通过 auth + grants 即可支持多用户隔离 |

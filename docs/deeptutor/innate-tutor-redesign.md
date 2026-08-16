> **来源**：本文由 edu-playground 工作区的 DeepTutor 深度分析会话产出（2026-08-06，源码快照 v1.5.9，后与 v1.5.10 复核一致），
> 于 2026-08-16 合并入本仓库作为调研记录。其中懒猫部署三件套草案已演进为独立基础设施仓库
> [`lazycat-edu-apps/`](../../lazycat-edu-apps)（git submodule，GitHub: qdriven/lazycat-edu-apps），以该仓库为准。

# innate-tutor 项目文档

> 基于 DeepTutor（HKUDS/DeepTutor, v1.5.x, Apache-2.0）深度分析的改造项目立项文档。
> 分析对象：`../DeepTutor` 本地源码快照（2026-08-06）。
> 目标：**Server 端构建 RAG 知识库并生成教程，前端发布学习任务供用户学习**，并支持部署到**懒猫微服（Lazycat）私服**。

---

## 目录

1. [DeepTutor 深度分析](#一-deeptutor-深度分析)
   - 1.1 主要技术
   - 1.2 架构
   - 1.3 模块交互
   - 1.4 内容集成能力评估
   - 1.5 RAG 系统搭建方式
2. [改造可行性评估](#二-改造可行性评估)
   - 2.1 Server 端 RAG 教程生成 + 前端学习任务
   - 2.2 懒猫私服部署
3. [innate-tutor 改造设计](#三-innate-tutor-改造设计)
4. [实施路线图](#四-实施路线图)
5. [风险与约束](#五-风险与约束)

---

# 一、DeepTutor 深度分析

## 1.1 主要技术

### 后端（Python 3.11–3.13）

| 层 | 技术选型 | 说明 |
|---|---|---|
| Web 框架 | **FastAPI + uvicorn** | 30 个 API router + 统一 WebSocket（`unified_ws`） |
| Agent 运行时 | **自研 agent loop**（非 LangChain） | `deeptutor/agents/chat/agent_loop.py`；单轮对话 = 一个不断增长的 conversation 上的多轮 LLM 调用循环 |
| 工具协议 | 自研 ToolRegistry + **DSML tool calls** | 对不支持原生 tool calling 的模型用 DSML 文本协议兜底（`dsml_tool_calls.py`） |
| LLM 接入 | openai / anthropic / dashscope / perplexityai SDK + OpenAI-compatible 网关 | 支持 Codex OAuth（用 ChatGPT 订阅，无需 API key）、Novita/Eden/Atlas 等网关 |
| RAG 引擎 | **LlamaIndex**（默认）/ PageIndex / GraphRAG / LightRAG / LightRAG Server / 腾讯 IMA / Obsidian | 每个 KB 创建时绑定一个引擎（`services/rag/factory.py`） |
| 向量检索 | **FAISS**（`faiss-cpu`）+ SimpleVectorStore 兜底 | 混合检索：向量 + **BM25**，经 `QueryFusionRetriever`（RRF）融合 |
| 文档解析 | PyMuPDF / **MinerU** / Docling / markitdown / PyMuPDF4LLM | 解析引擎可在 Settings 切换；office 文档走 python-docx / openpyxl / python-pptx / pdfplumber |
| 数据存储 | **文件优先（file-first）**：`data/` 目录树 + SQLite（aiosqlite） | 设置是 `data/user/settings/*.json`；索引是 `version-N` 目录；记忆是 md/jsonl |
| 认证 | JWT（python-jose）+ bcrypt，可选 **PocketBase** sidecar | 默认关闭认证（单用户），开启后首注册用户为 admin |
| 沙箱 | bwrap / 受限 subprocess / sandbox-runner sidecar | `exec` 工具代码执行的隔离层 |
| CLI | typer + rich + prompt_toolkit | `deeptutor` 命令，agent-native（可链式会话、机器可读输出） |

### 前端（`web/`）

- **Next.js 16 + React 19 + TypeScript**，Tailwind CSS
- 图表/可视化：chart.js、cytoscape（记忆图谱）、mermaid、KaTeX（数学）、framer-motion
- 文档预览：docx-preview、exceljs、jspdf
- i18n：i18next 多语言（12+ 语言）
- 关键设计：`web/proxy.ts` 在**请求时**把 `/api/*`、`/ws/*` 重写到后端（base URL 来自 `data/user/settings/system.json`，容器 entrypoint 导出为 `DEEPTUTOR_API_BASE_URL`）——**没有构建期 API 地址硬编码**，这对私有化部署非常友好
- 测试：Playwright + node 测试脚本

### 分发与部署

- PyPI 包（`pip install deeptutor`，`deeptutor init/start` 拉起前后端）
- GHCR 一体化镜像（`ghcr.io/hkuds/deeptutor`）：supervisord 同容器跑 FastAPI(8001) + Next.js standalone(3782)
- Docker / Podman（rootless, read-only rootfs）compose 文件齐全

## 1.2 架构

```
┌─────────────────────── 接入层（Surfaces）───────────────────────┐
│  Web (Next.js:3782)   CLI (deeptutor)   IM Channels(15种)   SDK │
└──────────────┬──────────────────────────────┬─────────────────┘
               │ /api/* /ws/* (proxy.ts 请求时重写)              │
┌──────────────▼─────────────── API 层 ────────▼─────────────────┐
│  FastAPI routers: chat / knowledge / book / learning(mastery)   │
│  question / notebook / memory / partners / settings / auth ...  │
│  + unified WebSocket（StreamBus 事件扇出）                       │
├────────────────────── 编排层（Orchestration）───────────────────┤
│  ChatOrchestrator ──► Agent Loop（所有能力共用一个循环）          │
│  BookEngine（与 ChatOrchestrator 平行的独立编排器）               │
│  Capabilities: quiz / research / visualize / solve / mastery    │
│  runtime/orchestrator + ToolRegistry + CapabilityRegistry       │
├────────────────────── 服务层（Services）────────────────────────┤
│  llm · embedding · rag · parsing · search · memory · session    │
│  mcp · skill · sandbox · storage · cron · voice · image/video   │
├────────────────────── 领域层（Domain）──────────────────────────┤
│  knowledge(KB管理/版本/manifest)  learning(掌握度/评分/间隔重复)  │
│  book(引擎/编译器/类型化blocks)   co_writer   partners(IM伙伴)  │
├────────────────────── 数据面（Data Plane）──────────────────────┤
│  data/user（admin）  data/users/<uid>（多用户隔离）               │
│  data/partners/<id>/workspace    data/system（auth/grants/audit）│
│  KB 索引 version-N 目录 · 记忆 L1/L2/L3 md+jsonl · SQLite        │
└─────────────────────────────────────────────────────────────────┘
```

架构核心判断：

1. **一个 loop 跑所有能力**。Chat / Quiz / Research / Visualize / Solve / Mastery Path 不是六个引擎，而是同一个 agent loop 上的六个"目标"（capability = 工具清单 + prompt 的 manifest）。这是它最值得继承的设计——改造时加"学习任务"只是加一种 capability，不需要新引擎。
2. **文件优先数据面**。没有中心化 DB 依赖（SQLite 仅用于 auth），知识库索引、记忆、书籍、notebook 全是文件，天然适合私服单容器部署和备份。
3. **请求时路由**。前端不在构建期烧死 API 地址，部署拓扑（端口、域名、反向代理）可以运行时再定。
4. **BookEngine 与 Chat 平行**。教程（Book）生成是独立的三阶段流水线，不走 chat loop——这正好是"server 端生成教程"要复用的部分。

## 1.3 模块交互

### Agent loop 主干（所有交互的轴心）

```
用户消息 ─► ChatOrchestrator ─► Agent Loop（每轮一次 LLM 调用）
                                   │
              ┌────────────────────┼─────────────────────┐
              ▼                    ▼                     ▼
        本轮有 tool calls      ask_user              本轮无 tool calls
        → 文本作为 narration   → 暂停回合等用户回答   → 文本即最终回答(finish)
        → 执行工具并把结果     → 回答后协议内恢复     → loop 结束
          追加回 conversation
        → 继续下一轮
```

- 工具分两类：**用户可开关**（brainstorm / web_search / paper_search / reason / imagegen…）和**上下文自动挂载**（`rag`、`kb_files`、`read_memory`、`write_note`、`consult_subagent`、`ask_user` 等——当前回合选中 KB 或子代理时自动出现）。
- 上下文分两类：**粘性会话上下文**（KB、persona、model，挂在 composer 工具栏跨回合保持）和**一次性引用**（文件、历史、书籍，经 `+` 菜单单回合注入）。
- 每轮的 `call_role`（narration/finish）随流式事件告诉前端如何渲染。

### RAG 调用链

```
chat 回合选中 KB
  → rag tool（tools/rag_tool.py，薄封装）
  → multi_user.knowledge_access.resolve_for_rag（权限解析 → kb_base_dir）
  → RAGService → factory 按 KB 绑定的 provider 选 pipeline
  → llamaindex: FAISS 向量检索 + BM25 → QueryFusionRetriever(RRF) → top_k
  → 带引用(citation)的合成答案回流 agent loop
```

### 知识库生命周期

```
knowledge router → KnowledgeManager（manifest + progress_tracker）
  → 文档解析（可插拔引擎）→ ingestion（SentenceSplitter 分块 → embed）
  → 写入新的扁平 version-N 目录（旧版本保留，重建不毁旧索引）
  → embedding signature 绑定版本（换 embedding 模型可识别过期）
```

### Book（教程生成）流水线

```
create_book ─► Stage1 IdeationAgent+SourceExplorer → BookProposal（需用户确认）
confirm_proposal ─► Stage2 SpineSynthesizer → Spine 章节大纲（需用户确认）
confirm_spine ─► 生成 page 空壳 + asyncio 优先队列（用户打开的页最高优先级）
compile_page ─► Stage3-4 BookCompiler → 每页编译成类型化 blocks
                （text/callout/quiz/flash_cards/timeline/code/figure/
                  interactive HTML/animation/concept_graph/deep_dive/user_note）
全程经 StreamBus → WebSocket 向前端推进度；每页有独立 Page Chat
```

### Learning（掌握度）闭环

```
LearningService（learning/service.py）
  → 模块/知识点(KP)初始化 → 答题 → grading.grade_answer + classify_error
  → mastery.compute_mastery（近因加权准确率 + 低置信上限，可整体替换为 IRT/BKT）
  → scheduler.SpacedRepetitionScheduler（间隔重复）
  → 达标(mastery gate)才解锁下一阶段；错题进 Question Bank
```

### 其他关键交互

- **Partners**：15 种 IM 渠道的入站消息 → 转成 partner 工作区里的普通 ChatOrchestrator 回合（"一个有人格和电话号码的 chat"）。
- **Memory**：L1 原始事件 jsonl → L2 分面事实 md → L3 综合画像 md，层层可溯源（L2 引 L1、L3 引 L2）。
- **Multi-user**：auth router 发 JWT → grants 控制 model/KB/skill/tool 授权 → PathService 把每个请求限定在 `data/users/<uid>/` 作用域。
- **Subagents**：`consult_subagent` 工具在回合内真实运行本机 Claude Code / Codex / Gemini / Kimi CLI 并把过程流进 Activity 面板。

## 1.4 内容集成能力评估

**结论：扩展点是它设计上的一等公民，集成其他内容非常容易。**

| 扩展点 | 机制 | 适合集成什么 |
|---|---|---|
| Tools | ToolRegistry 注册 + capability manifest 引用 | 任意新能力（内部系统查询、教务 API） |
| Skills | `SKILL.md` playbook + EduHub/ClawHub 社区安装（带安全门） | 领域教学法、行业知识工作流 |
| MCP Services | 内置 MCP store，一键安装 hosted MCP / 自配 URL | 第三方数据源、企业系统 |
| CLI Apps | CLI-Anything 目录，agent 直接调用 | 现有命令行工具链 |
| KB 引擎 | linked KB / Obsidian vault / 腾讯 IMA / 外部 LightRAG Server | **不重建索引直接挂载已有知识库** |
| 内容来源 | KB 文档、notebook、题库、聊天记录均可作为 Book/Co-Writer 输入 | 已有教材 PDF、PPT、DOCX、XLSX |
| LLM/Embedding | OpenAI-compatible 网关，任意 provider | 私有模型、国产模型 |
| IM 渠道 | schema-driven channel 层（飞书/Telegram/Slack/Discord/钉钉/QQ/企微/WhatsApp/Matrix/Teams 等） | 学习通知、答疑推送 |

## 1.5 RAG 系统搭建方式

DeepTutor 的 RAG 搭建路径（以默认 LlamaIndex 引擎为例）：

1. **配置 embedding**：Settings → Embedding 配置 provider（云端 API 或本地服务）；LLM 用于合成与（GraphRAG/LightRAG 的）图谱抽取。
2. **创建 KB**：Knowledge Center → 新建（上传文档建新索引）或 link existing（挂载已有索引/Obsidian/IMA，**零重建**）。创建时绑定引擎。
3. **文档解析**：按 Settings 选定引擎（Text-only / MinerU / Docling / markitdown / PyMuPDF4LLM）抽取文本与图像。
4. **摄取索引**：`IngestionPipeline` = `SentenceSplitter(chunk_size, chunk_overlap)` → `embed_model`；向量写 FAISS，BM25 语料持久化到 `bm25_retriever/`；整版写入 `version-N` 目录。
5. **检索**：向量 + BM25 双路，`QueryFusionRetriever` RRF 融合，`top_k` 按语料规模自动钳制（小库不崩）；多查询融合可选。
6. **消费**：chat 的 `rag` 工具、Co-Writer 编辑、Book 生成、Partner 对话共用同一 `RAGService`，引用可溯源。
7. **运维**：`deeptutor kb list/info/add/search/delete`；单文档移除（含 error 态）；embedding 签名变更识别过期索引；`deeptutor book health` 检测书籍与源知识漂移。

引擎选型指南：

| 场景 | 引擎 |
|---|---|
| 通用、本地、隐私优先 | **LlamaIndex**（默认，向量+BM25） |
| 需要页级引用、免运维 | PageIndex（hosted） |
| 跨文档实体关系推理 | GraphRAG / LightRAG |
| 已有外部 LightRAG 实例 | LightRAG Server（HTTP 指针） |
| 已有笔记库 | Obsidian linked vault |

---

# 二、改造可行性评估

## 2.1 Server 端 RAG 教程生成 + 前端学习任务

**结论：可行，且 DeepTutor 已自带约 80% 的零件。改造是"补角色与编排"，不是重写。**

现有资产映射：

| 目标能力 | 现有模块 | 差距 |
|---|---|---|
| 教师端构建知识库 | Knowledge Center + multi-user grants（admin 建库、授权给用户只读用） | ✅ 基本零差距 |
| Server 端 RAG 生成教程 | **BookEngine**：从 KB/notebook/题库生成章节式 living book（含 quiz、flash_cards、interactive blocks） | 缺"面向班级发布"的产出形态 |
| 前端学习任务 | **Mastery Path**（guided learning + mastery gate）+ Quiz + 间隔重复 + Learning Space dashboard | 任务是"自学的"，没有"布置/截止/提交"语义 |
| 学习进度追踪 | LearningService 掌握度、错题本、L1 事件流 | 只有个人视角，缺教师侧聚合视图 |
| 多角色 | multi_user：admin + 用户隔离 + grants | 只有 admin/user 两档，缺 teacher/student/class 模型 |

需要新增的（即 innate-tutor 的核心增量）：

1. **角色与班级模型**：teacher / student / class(cohort) 三个实体 + 成员关系（可挂在 multi_user 之上，不破坏原隔离设计）。
2. **Assignment（任务发布）聚合根**：`Assignment = Book/MasteryPath/Quiz × Class × 截止时间 × 达标线`；状态机 draft → published → in-progress → closed。
3. **教程产物固化与分发**：Book 编译完成后"冻结"为课程版本，发布即向班级成员的 Learning Space 注入入口。
4. **教师侧聚合 dashboard**：按 assignment 聚合完成率、平均掌握度、错题 Top-N（数据全在现有 LearningService + L1 trace 里，只需聚合查询层）。
5. **通知**：复用 Partners 的 IM channel 层做任务提醒（飞书/钉钉/Telegram 开箱即用）。

架构上完全顺承：Assignment 可以作为一种新 **capability** 挂进现有 agent loop 与 router 体系，BookEngine / LearningService 原样复用。

## 2.2 懒猫私服部署

**结论：可行，DeepTutor 的部署形态与懒猫 LPK 模型契合度很高。**

有利条件：

- **一体化镜像**：`ghcr.io/hkuds/deeptutor` 单容器含前后端（supervisord），懒猫 manifest 只需一个 service。
- **单一数据树**：整个状态在 `./data`，映射到懒猫的 `/lzcapp/var` 即可，备份迁移一条路径。
- **请求时 API 路由**：前端无构建期地址，懒猫按域名分配路由（`https://<app>.<box>.heiyu.space`）天然兼容。
- **LLM/Embedding 走远程 API**：盒子不需要 GPU；解析引擎选 Text-only/PyMuPDF4LLM 可避免 MinerU 本地模型下载。
- 官方已有 rootless / read-only rootfs 的容器硬化实践，与懒猫运行时模型相容。

需要注意：

1. **镜像体积**：全量 RAG extras（GraphRAG/LightRAG/MinerU）很大，建议构建**精简镜像**（LlamaIndex + FAISS + PyMuPDF4LLM，裁掉 mineru/graphrag/rag-lightrag extras 与数学动画依赖）。
2. **资源**：FastAPI + Next.js + FAISS 建议 ≥ 2 vCPU / 4 GB RAM；在 manifest 里声明。
3. **架构**：确认盒子 CPU 架构（x86_64 / arm64），`faiss-cpu` 两者都有 wheel，但需按架构构建/多架构 manifest。
4. **数据目录**：DeepTutor 支持 `DEEPTUTOR_HOME` 指定数据根，设为 `/lzcapp/var/data`。
5. **PocketBase**：可选；单用户/邀请制直接用 SQLite fallback，建议首版不带。
6. **端口**：懒猫只暴露 HTTP route → 前端 3782；后端 8001 保持容器内部（proxy.ts 请求时转发，外部无需直达）。
7. **认证**：懒猫有 OIDC 可前置；DeepTutor 自带 auth（首注册即 admin）也可独立工作，二者可叠加。

`deploy/lazycat/` 已给出 LPK 三件套 + 可执行脚本（`scripts/deploy.sh` 等）。设计依据与用法见 `deploy/lazycat/DEPLOY.md`（官方 LPK 规范 + DeepTutor 一体镜像 + 本改造目标）。

---

# 三、innate-tutor 改造设计

## 3.1 定位

> 私服上的"教与学"闭环：教师/机构在 server 端导入资料 → RAG 建库 → 一键生成交互式教程（Book）→ 组装成学习任务发布到班级 → 学生在前端学习、答题、达标 → 教师看聚合进度。

## 3.2 技术路线选择

**Fork 改造（推荐）而非插件化**：DeepTutor 的 capability/router/grants 体系虽可扩展，但"班级 + 作业"需要动数据模型与多用户语义，fork 后保持上游 remote 跟踪、按 release cherry-pick。

裁剪策略（innate-tutor = DeepTutor − 个人化冗余 + 教学闭环）：

- 保留：agent loop、RAG 全栈、BookEngine、Learning/mastery、quiz/grading、multi_user、IM 通知、CLI
- 裁减/后置：Partners IM 机器人（保留 channel 层做通知即可）、Co-Writer、My Agents/子代理、Math Animator、videogen
- 新增：`deeptutor/classroom/`（班级/作业/聚合）+ 前端 classroom 工作区

## 3.3 数据模型增量

```text
Class        { id, name, teacher_uid, student_uids[], created_at }
Assignment   { id, class_id, title, kind: book|mastery|quiz,
               ref_id (book_id/path_id/quiz_id), due_at, pass_line,
               status: draft|published|closed, created_by }
Submission   { assignment_id, student_uid, progress_ref,
               mastery_snapshot, submitted_at, state }
Announcement { class_id, channel, payload }   # 走 partners channel 层
```

存储继续 file-first：`data/classroom/<class_id>/...`，复用 PathService 作用域隔离。

## 3.4 关键流程

**教程生成与发布（教师）**：

```
导入资料 → 建 KB（或 link 已有库）
→ create_book(KB) → 确认 proposal/spine → 编译（队列+WS 进度）
→ book freeze 为课程版本
→ 创建 Assignment(book × class × 截止 × 达标线) → publish
→ 班级成员收到入口 + IM 通知
```

**学习（学生）**：

```
Learning Space → 我的任务 → 打开 Book 逐页学习（Page Chat 可问 RAG）
→ 页内 quiz/flash_cards → mastery gate 判定 → 间隔重复复习
→ 达标自动提交 Submission
```

**追踪（教师）**：

```
Assignment dashboard ← 聚合 LearningService 掌握度 + 错题 + L1 事件
→ 完成率 / 平均掌握度 / 错题 Top-N / 未达标名单
```

## 3.5 API 增量（顺承现有 router 风格）

```
POST   /api/classroom/classes                 创建班级
POST   /api/classroom/classes/{id}/members    加成员
POST   /api/classroom/assignments             创建任务（引用 book/path/quiz）
POST   /api/classroom/assignments/{id}/publish
GET    /api/classroom/assignments?role=student 我的任务列表
GET    /api/classroom/assignments/{id}/report  教师聚合报表
WS     /ws (复用 unified_ws，加 classroom 事件通道)
```

---

# 四、实施路线图

| 阶段 | 内容 | 验收 |
|---|---|---|
| M1 基线 | fork 瘦身（裁 Partners/Co-Writer/重型 extras），精简镜像构建，本地跑通 | `deeptutor start` 起服务，建 KB + 生成 Book 全流程通 |
| M2 教学闭环 | classroom 域模型 + Assignment 状态机 + 发布/订阅入口 | 教师发布 Book 任务，学生端可见可学 |
| M3 进度聚合 | 教师 dashboard（掌握度/错题聚合）+ 达标自动提交 | 报表数据与个人学习记录一致 |
| M4 懒猫上架 | `deploy/lazycat` 三件套 + 精简镜像 copy-image + LPK 安装验证 | 盒子上 `lzc-cli lpk install` 成功，域名可访问 |
| M5 通知与打磨 | IM 任务提醒、间隔重复提醒、i18n、备份脚本 | 发布任务触发飞书/钉钉通知 |

# 五、风险与约束

1. **上游演进快**（周更 release）：fork 需建立定期 rebase/cherry-pick 纪律，改动尽量收敛在新增 `classroom/` 包内。
2. **许可证**：Apache-2.0，改造分发需保留 LICENSE 与 THIRD_PARTY_NOTICES。
3. **资源下限**：懒猫盒子建议 ≥4GB 内存；GraphRAG/LightRAG 类重引擎在盒子上慎用，默认 LlamaIndex。
4. **Python 版本**：3.11–3.13（3.14 被显式排除，faiss-cpu 等无 wheel）。
5. **多用户安全**：exec 沙箱对非 admin 默认拒绝；发布场景下学生的代码执行权限保持关闭。
6. **数据一致性**：Book freeze 与 KB 漂移用现有 `book health` 机制检测，课程版本不因源库更新而自动变化（教学确定性优先）。

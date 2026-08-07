# OpenMAIC 模块图

> 本文档从代码视角梳理 OpenMAIC 各模块的职责与依赖关系。所有路径相对仓库根 `OpenMAIC/`。

---

## 1. 仓库结构总览

```mermaid
flowchart TB
  Root["OpenMAIC/"]
  App["app/ (Next.js App Router)"]
  Lib["lib/ (核心业务逻辑)"]
  Comp["components/ (React UI)"]
  Conf["configs/ (常量)"]
  Eval["eval/ (评测脚本)"]
  Skills["skills/openmaic (OpenClaw Skill)"]
  Render["render-service/ (MP4 渲染)"]
  Pkg["packages/ (workspace 包)"]
  Scripts["scripts/ (build / sync / i18n)"]
  Tests["tests/ · e2e/"]
  Public["public/ (静态资源)"]
  Middleware["middleware.ts (AccessCode)"]

  Root --> App
  Root --> Lib
  Root --> Comp
  Root --> Conf
  Root --> Eval
  Root --> Skills
  Root --> Render
  Root --> Pkg
  Root --> Scripts
  Root --> Tests
  Root --> Public
  App --> Middleware
```

---

## 2. app/ — Next.js 路由层

```mermaid
flowchart LR
  subgraph AppDir["app/"]
    Page["page.tsx (Home · 课程输入)"]
    Classroom["classroom/[id]/ (课堂播放页)"]
    Editor["generation-preview"]
    Layout["layout.tsx · globals.css"]
  end

  subgraph APIRoutes["app/api/"]
    Generate["generate/ (场景生成)"]
    GenClassroom["generate-classroom/ (异步生成)"]
    Chat["chat/ (多代理 · SSE)"]
    PBL["pbl/ (PBL endpoints)"]
    ExportVideo["export-video/"]
    ExtractDoc["extract-document/"]
    ParsePDF["parse-pdf/"]
    QuizGrade["quiz-grade/"]
    WebSearch["web-search/"]
    Transcription["transcription/"]
    Provider["provider/ · server-providers/"]
    VerifyImg["verify-image-provider/"]
    VerifyVideo["verify-video-provider/"]
    VerifyPDF["verify-pdf-provider/"]
    VerifyModel["verify-model/"]
    ProxyMedia["proxy-media/ (SSRF 加固)"]
    ClassAPI["classroom/ · classroom-media/"]
    Agent["agent/"]
    Comfy["comfyui-workflows/"]
    AzureVoices["azure-voices/"]
    AccessCode["access-code/"]
    Health["health/"]
    Usage["usage/"]
    Persistence["persistence/"]
  end

  AppDir --> APIRoutes
```

### 2.1 API 路由职责
| 路由 | 职责 |
| --- | --- |
| `generate/` | 同步场景生成（Outline / Scene 阶段） |
| `generate-classroom/` | 异步课堂生成（带 job_id） |
| `chat/` | 多代理互动 SSE 流 |
| `pbl/` | Project-Based Learning endpoints |
| `export-video/` | 触发 MP4 渲染 |
| `extract-document/` · `parse-pdf/` | 文档解析入口 |
| `quiz-grade/` | 实时评分 |
| `web-search/` | 多 Provider 网络搜索 |
| `transcription/` | ASR 入口 |
| `provider/` · `server-providers/` | 运行时 provider 状态 |
| `verify-*/` | 各种 provider 健康/连通性验证 |
| `proxy-media/` | 媒体代理（SSRF 加固） |
| `classroom/` · `classroom-media/` | 课堂元数据 |
| `agent/` | Agent 配置 |
| `comfyui-workflows/` | ComfyUI 工作流 |
| `azure-voices/` | Azure TTS 语音列表 |
| `access-code/` | ACCESS_CODE 校验 |
| `health/` | 健康检查 |
| `usage/` | 用量统计 |
| `persistence/` | 服务端持久化 HTTP |

---

## 3. lib/ — 核心业务

```mermaid
flowchart TB
  subgraph Generation["lib/generation (两阶段课程生成)"]
    G1["generation-pipeline.ts"]
    G2["outline-generator.ts"]
    G3["outline-type.ts"]
    G4["scene-generator.ts"]
    G5["scene-builder.ts"]
    G6["interactive-post-processor.ts"]
    G7["generation-retry.ts"]
    G8["json-repair.ts"]
    G9["prompt-formatters.ts"]
    G10["pipeline-types.ts"]
    G11["action-parser.ts"]
  end

  subgraph Orchestration["lib/orchestration (多代理)"]
    O1["director-graph.ts"]
    O2["director-prompt.ts"]
    O3["prompt-builder.ts"]
    O4["tool-schemas.ts"]
    O5["ai-sdk-adapter.ts"]
    O6["reasoning-sse.ts"]
    O7["stateless-generate.ts"]
    O8["registry/ (agent-selection · store)"]
    O9["summarizers/"]
    O10["types.ts"]
  end

  subgraph Playback["lib/playback (播放状态机)"]
    P1["engine.ts"]
    P2["index.ts"]
    P3["types.ts"]
    P4["cursor.ts"]
    P5["derived-state.ts"]
    P6["action-navigation.ts"]
    P7["action-resume.ts"]
    P8["auto-resume.ts"]
  end

  subgraph Action["lib/action"]
    A1["engine.ts (28+ 动作)"]
  end

  subgraph StageAPI["lib/api (Stage API)"]
    SA1["stage-api.ts"]
    SA2["stage-api-types.ts"]
    SA3["stage-api-scene.ts"]
    SA4["stage-api-canvas.ts"]
    SA5["stage-api-element.ts"]
    SA6["stage-api-mode.ts"]
    SA7["stage-api-navigation.ts"]
    SA8["stage-api-whiteboard.ts"]
    SA9["stage-api-defaults.ts"]
  end

  subgraph AI["lib/ai"]
    AI1["llm.ts"]
    AI2["providers.ts"]
    AI3["azure.ts"]
    AI4["model-aliases.ts"]
    AI5["model-metadata.ts"]
    AI6["reasoning-sse.ts"]
    AI7["thinking-config.ts"]
    AI8["thinking-context.ts"]
  end

  subgraph Store["lib/store (Zustand)"]
    ST1["index.ts"]
    ST2["stage.ts"]
    ST3["canvas.ts"]
    ST4["whiteboard-history.ts"]
    ST5["keyboard.ts"]
    ST6["kv-persist.ts"]
    ST7["settings.ts"]
    ST8["settings-validation.ts"]
    ST9["persist-health.ts"]
    ST10["media-generation.ts"]
    ST11["video-render.ts"]
    ST12["scene-runtime-errors.ts"]
    ST13["snapshot.ts"]
    ST14["user-profile.ts"]
    ST15["interactive-iframe-pool.ts"]
    ST16["widget-iframe.ts"]
  end

  subgraph Export["lib/export"]
    EX1["use-export-classroom.ts"]
    EX2["use-export-pptx.ts"]
    EX3["classroom-zip-types.ts"]
    EX4["classroom-zip-utils.ts"]
    EX5["html-parser/"]
    EX6["inline-assets.ts"]
    EX7["inline-assets-importmap.ts"]
    EX8["inline-assets-shared.ts"]
    EX9["latex-to-omml.ts"]
    EX10["proxied-fetch.ts"]
    EX11["svg2base64.ts"]
    EX12["svg-path-parser.ts"]
    EX13["svg-arc-to-cubic-bezier.d.ts"]
  end

  subgraph Audio["lib/audio"]
    AU1["tts-providers.ts"]
    AU2["asr-providers.ts"]
    AU3["agent-voice.ts"]
    AU4["voice-resolver.ts"]
    AU5["voice-design.ts"]
    AU6["voice-registration.ts"]
    AU7["voice-registration-client.ts"]
    AU8["voxcpm.ts"]
    AU9["voxcpm-voices.ts"]
    AU10["voxcpm-registration.ts"]
    AU11["browser-tts-preview.ts"]
    AU12["use-tts-preview.ts"]
    AU13["use-discussion-tts.ts"]
    AU14["audio-duration.ts"]
    AU15["wav-utils.ts"]
    AU16["regenerate-speech-tts.ts"]
    AU17["provider-display.ts"]
    AU18["provider-enablement.ts"]
    AU19["json-stream.ts"]
    AU20["constants.ts"]
    AU21["types.ts"]
    AU22["azure.json"]
  end

  subgraph Media["lib/media"]
    MD1["image-providers.ts"]
    MD2["video-providers.ts"]
    MD3["media-orchestrator.ts"]
    MD4["polled-task.ts"]
    MD5["probe-auth.ts"]
    MD6["video-manifest.ts"]
    MD7["comfyui-workflows.ts"]
    MD8["types.ts"]
    MD9["adapters/"]
  end

  subgraph Persist["lib/persistence"]
    PS1["bootstrap.ts"]
    PS2["plain-json.ts"]
    PS3["server-auth.ts"]
  end

  subgraph WebSearch["lib/web-search"]
    WS1["index.ts"]
    WS2["types.ts"]
    WS3["utils.ts"]
    WS4["format.ts"]
    WS5["constants.ts"]
    WS6["providers/{tavily,brave,baidu,bocha,minimax,searxng,responses-web-search,doubao}.ts"]
  end

  subgraph PDF["lib/pdf (文档解析)"]
    PD1["parse-pdf.ts"]
    PD2["document-parsers/"]
  end

  subgraph Types["lib/types"]
    TY1["集中 TS 类型定义"]
  end

  subgraph I18N["lib/i18n"]
    I1["index.ts"]
    I2["config.ts"]
    I3["types.ts"]
    I4["locales.ts"]
    I5["locales/{zh-CN,zh-TW,en-US,ja-JP,ru-RU,ar-SA,pt-BR}"]
    I6["TRANSLATION_GUIDE.md"]
  end

  subgraph Hooks["lib/hooks (React 55+)"]
    H1["use-asr-available.ts"]
    H2["use-audio-recorder.ts"]
    H3["use-browser-asr.ts"]
    H4["use-browser-tts.ts"]
    H5["use-canvas-operations.ts"]
    H6["use-discussion-tts.ts"]
    H7["use-draft-cache.ts"]
    H8["use-history-snapshot.ts"]
    H9["use-i18n.tsx"]
    H10["use-order-element.ts"]
    H_more["… (共 55+)"]
  end

  subgraph Storage["lib/storage"]
    SG1["index.ts"]
    SG2["client.ts"]
    SG3["types.ts"]
    SG4["providers/"]
  end

  subgraph Other["lib/ 其它"]
    OT1["utils/"]
    OT2["types/"]
    OT3["stores (老的)"]
  end

  Generation --> Orchestration
  Playback --> Orchestration
  Playback --> Action
  Playback --> StageAPI
  Generation --> AI
  Orchestration --> AI
  Media --> AI
  Audio --> AI
  Export --> StageAPI
  StageAPI --> Store
  Audio --> Store
  Generation --> Media
  Generation --> Audio
  Generation --> WebSearch
  Generation --> PDF
  App --> Generation
  App --> Orchestration
  App --> Playback
  App --> Action
  App --> StageAPI
  App --> AI
  App --> Store
  App --> Export
  App --> Audio
  App --> Media
  App --> WebSearch
  App --> PDF
  App --> I18N
  App --> Persist
  App --> Storage
  App --> Hooks
```

---

## 4. components/ — React UI 组件

```mermaid
flowchart TB
  subgraph Slide["components/slide-renderer/ (Canvas Slide Editor)"]
    SR1["Editor/Canvas/ (交互式画布)"]
    SR2["components/element/ (text · image · shape · table · chart …)"]
  end

  subgraph Scene["components/scene-renderers/"]
    SC1["Quiz · Interactive · PBL Renderer"]
  end

  subgraph Generation["components/generation/"]
    GE1["课程生成工具条 / 进度"]
  end

  subgraph Chat["components/chat/"]
    CH1["聊天区 · 会话管理"]
  end

  subgraph Settings["components/settings/"]
    SE1["Provider / TTS / ASR / Media 设置面板"]
  end

  subgraph Whiteboard["components/whiteboard/"]
    WB1["SVG 白板绘制"]
  end

  subgraph Agent["components/agent/"]
    AG1["Agent Avatar / Config / InfoBar"]
  end

  subgraph Stage["components/stage/"]
    ST1["舞台容器 · 场景切换"]
  end

  subgraph UI["components/ui/ (shadcn/Radix)"]
    UI1["基础原子组件"]
  end

  subgraph Others["components/ 其它"]
    O1["audio/ · roundtable/ · ai-elements/"]
  end

  SR1 --> SR2
  SC1 --> SR1
  Generation --> SC1
  Chat --> Scene
  Stage --> Scene
  Whiteboard --> Stage
  Agent --> Stage
  Settings --> Stage
  UI --> Generation
  UI --> Chat
  UI --> Settings
```

---

## 5. configs/ — 常量与配置

```mermaid
flowchart LR
  C1["shapes"]
  C2["fonts"]
  C3["hotkeys"]
  C4["themes"]
  C5["provider presets"]
  C6["agents / personas"]
```

---

## 6. eval/ — 评估脚本

```mermaid
flowchart LR
  E1["pbl-v2-planner/runner.ts"]
  E2["whiteboard-layout/runner.ts"]
  E3["outline-language/runner.ts"]
  E4["orchestration/runner.ts"]
  E5["orchestration/answering-runner.ts"]
  E6["orchestration/answer-content-runner.ts"]
```

- `eval:pbl-v2-planner` · `eval:whiteboard` · `eval:outline-language` · `eval:orchestration` · `eval:orchestration:answering` · `eval:orchestration:answer-content`

---

## 7. skills/openmaic — OpenClaw Skill

```mermaid
flowchart LR
  SK["SKILL.md (≈路由器)"]
  Refs["references/ (按需加载 SOP)"]
  Entry["配置入口 ~/.openclaw/openclaw.json"]
  SK --> Refs
  Entry --> SK
```

- **路由模式**：skill 开头讲规则 + 列出 references；
- **确认优先**：每步都让用户确认（不会自动 clone / 启动 / 提交）；
- **运行模式**：Hosted（accessCode）或 Self-Hosted（repoDir + url）。

---

## 8. render-service/ — MP4 渲染服务

```mermaid
flowchart LR
  App["OpenMAIC App"] -->|"RENDER_SERVICE_URL"| RS["render-service (Node)"]
  RS --> Chrome["Chromium"]
  RS --> FFmpeg["FFmpeg"]
  RS --> Hyperframes["Hyperframes Producer"]
  RS --> MP4["MP4 文件"]
```

- 由 `video-export` compose profile 启动；
- 与 app 容器独立，配置 `RENDER_MAX_CONCURRENCY` 等参数。

---

## 9. packages/ — Workspace SDK

```mermaid
flowchart TB
  subgraph Pkg["packages/"]
    P1["pptxgenjs (定制)"]
    P2["mathml2omml"]
    P3["@openmaic/dsl"]
    P4["@openmaic/generation"]
    P5["@openmaic/storage"]
    P6["@openmaic/importer"]
    P7["@openmaic/renderer"]
  end

  P3 --> P4
  P3 --> P5
  P3 --> P6
  P3 --> P7
```

- **DSL**：课程场景的描述语言（schema）
- **generation**：服务端生成引擎
- **storage**：RuntimeStore / DocumentStore 合约
- **importer**：把外部资源（课件 / 文档）导入到 OpenMAIC
- **renderer**：场景渲染器（与 Web 端解耦）

---

## 10. middleware.ts — 接入层

```mermaid
flowchart LR
  MW["middleware.ts"]
  AC["ACCESS_CODE cookie 校验"]
  RL["rate limit"]
  H["headers (CSP / frame-ancestors)"]
  PROXY["/api/persistence 代理"]
  MW --> AC
  MW --> RL
  MW --> H
  MW --> PROXY
```

---

## 11. 关键数据流（一次课堂生成）

```mermaid
sequenceDiagram
  participant U as 用户
  participant WEB as Browser (Next.js)
  participant API as API Route
  participant OUT as OutlineGenerator
  participant LNG as LLM (AI SDK)
  participant SCP as SceneGenerator
  participant MEDIA as MediaOrchestrator
  participant TTS as TTS Provider
  participant DB as 持久化

  U->>WEB: 输入主题 + 附件
  WEB->>API: POST /api/generate
  API->>OUT: 调用
  OUT->>LNG: 提示生成大纲
  LNG-->>OUT: JSON 大纲
  OUT-->>API: 大纲
  API-->>WEB: 可编辑大纲
  U->>WEB: 确认大纲
  WEB->>API: POST /api/generate (scenes)
  API->>SCP: 逐场景生成
  SCP->>LNG: 场景 prompt
  LNG-->>SCP: 场景结构
  SCP->>MEDIA: 同时触发图片 / TTS
  MEDIA->>TTS: 合成语音
  TTS-->>MEDIA: 音频 URL
  MEDIA-->>SCP: 媒体资源
  SCP-->>API: 完整场景
  API->>DB: 持久化课堂
  API-->>WEB: 课程 doc + url
  WEB->>U: 跳转播放
```

---

## 12. 一次课堂播放（多代理）

```mermaid
sequenceDiagram
  participant U as 用户
  participant WEB as Browser
  participant PB as Playback Engine
  participant DG as Director Graph
  participant A as Agent (teacher)
  participant A2 as Agent (peer)
  participant AC as Action Engine
  participant TTS as TTS Provider

  U->>WEB: 按 Play
  WEB->>PB: 开始播放
  PB->>DG: 准备 directive
  DG->>A: turn
  A->>AC: 动作(speech + whiteboard)
  AC->>TTS: 合成语音
  TTS-->>AC: 音频
  AC-->>WEB: SSE 事件
  DG->>A2: turn
  A2->>AC: 动作(question)
  AC-->>WEB: SSE
  DG-->>PB: turn 结束
  PB-->>WEB: 等待用户响应 / 继续
```

---

## 13. 进程结构

```mermaid
flowchart TB
  subgraph Compose["docker compose"]
    App["Next.js App"]
    Postgres["Postgres (server-persistence profile)"]
    Render["render-service (video-export profile)"]
  end

  subgraph Local["pnpm dev / build"]
    Next["Next.js 进程"]
  end

  subgraph External["外部进程（可选）"]
    VoxCPM["VoxCPM2 Server (vLLM-Omni / Python / Nano-vLLM)"]
    FunASR["FunASR Server"]
    Lemonade["Lemonade Server"]
    MinerU["MinerU API"]
    ComfyUI["ComfyUI"]
  end

  App --> Postgres
  App --> Render
  App --> VoxCPM
  App --> FunASR
  App --> Lemonade
  App --> MinerU
  App --> ComfyUI
```

---

## 14. 文件 / 资源布局

```
OpenMAIC/
├── app/                        # Next.js App Router
│   ├── api/                    #   Server API routes (~18 endpoints)
│   ├── classroom/[id]/         #   Classroom playback page
│   └── page.tsx                #   Home page (generation input)
├── lib/                        # Core business logic
│   ├── generation/ · orchestration/ · playback/ · action/
│   ├── ai/ · api/ · store/ · types/ · audio/ · media/
│   ├── export/ · hooks/ · i18n/ · persistence/ · storage/
│   └── web-search/ · pdf/ · prosemirror/ · utils/
├── components/                 # React UI
│   ├── slide-renderer/ · scene-renderers/ · generation/
│   ├── chat/ · settings/ · whiteboard/ · agent/ · ui/
├── packages/                   # Workspace packages
│   ├── pptxgenjs/ · mathml2omml/
│   └── @openmaic/{dsl,generation,storage,importer,renderer}/
├── skills/openmaic/            # OpenClaw / ClawHub skill
├── configs/                    # Shared constants
├── render-service/             # MP4 rendering (video-export profile)
├── public/                     # Static assets
└── middleware.ts               # AccessCode / proxy
```

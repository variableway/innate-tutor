# 本地一键环境：默认无 RAG，可选 LightRAG

## 1. 定位

该 Compose 用于快速验证，不修改两个上游项目代码：

- OpenMAIC 从当前源码构建，负责课程生成和课堂播放；
- DeepTutor 使用固定的 `1.5.9` 预构建镜像，负责独立 Tutor/RAG 验证；
- PostgreSQL 是一个实例、三个逻辑数据库：`innate`、`openmaic`、`lightrag`；
- 默认不启动 RAG，OpenMAIC 和 DeepTutor 可以独立完成快速生成与当前场景问答；
- LightRAG 是可选 profile，向 DeepTutor 和未来的 Producer/Agent Adapter 提供 HTTP 契约；
- DeepTutor 的工作区、Memory 和配置仍保存在自己的 volume，不会因为同一 Compose 就自动进入 PostgreSQL；
- OpenMAIC 当前不会自动调用 LightRAG，Compose 只准备服务，不能替代 Adapter。

这满足“生成课程”和“集成两项目”可以分别执行：只启动 OpenMAIC 也能生成课程；DeepTutor/LightRAG 的配置或故障不阻塞这条链路。

## 2. 文件

- 根目录 [`compose.yaml`](../compose.yaml)
- 根目录 [`.env.example`](../.env.example)
- PostgreSQL 初始化脚本 [`01-create-databases.sql`](../infra/postgres/init/01-create-databases.sql)

## 3. 首次启动（需要执行时）

当前只生成配置，不要求现在启动 Docker。以后启动前执行：

```bash
cp .env.example .env
```

默认无 RAG 模式至少填写：

```dotenv
LLM_API_KEY=...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-5.4-mini
```

只有启用内置 LightRAG 时才需要填写：

```dotenv
EMBEDDING_API_KEY=...
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIM=1536
LIGHTRAG_API_KEY=...
```

然后按需要选择启动模式：

```bash
# 最小课程生成路径；不启动 DeepTutor 和 LightRAG
docker compose up -d postgres openmaic

# 默认第一阶段：OpenMAIC + DeepTutor，不启动 RAG
docker compose up -d

# 可选：额外安装并启动内置 LightRAG
docker compose --profile rag-lightrag up -d
```

OpenMAIC 从源码构建，第一次启动耗时和磁盘占用会明显高于后续启动。DeepTutor 使用预构建镜像，避免本地构建其 Python/Next.js 全量依赖。

## 4. 地址

| 服务 | 地址 | 用途 |
| --- | --- | --- |
| OpenMAIC | `http://localhost:3000` | 生成、查看和导出课程 |
| DeepTutor | `http://localhost:3782` | Tutor、KB、模型配置 |
| DeepTutor API | `http://localhost:8001` | `/api/v1/ws` 等接口 |
| LightRAG（可选） | `http://localhost:9621` | `rag-lightrag` profile 的 RAG Web/API |
| PostgreSQL | `localhost:5432` | 本地诊断；服务间使用 `postgres:5432` |

所有端口只绑定 `127.0.0.1`，默认不对局域网或公网开放。

## 5. 默认第一阶段：无 RAG

1. 打开 OpenMAIC，生成一个无媒体或低媒体的短课程。
2. 记录生成任务 ID、课程 ID 和 `/classroom/{courseId}` URL。
3. 打开 DeepTutor，在模型设置中只配置 LLM；无 RAG 问答不要求 Embedding。
4. 用课程标题、当前 scene 正文和选中文字验证 DeepTutor 问答。
5. 不创建或连接 Knowledge Base，不对回答承诺原始资料引用。

此模式适合主题生成、短材料和产品价值验证。OpenMAIC Player、Catalog、课程 URL、Quiz 和普通 DeepTutor Chat 不依赖 RAG。

## 6. 可选 RAG 模式

### 6.1 DeepTutor 本地 LlamaIndex

不增加容器，直接在 DeepTutor 中配置 Embedding 并建立本地 KB。索引进入 `deeptutor-data`，适合单机、小资料集验证。

### 6.2 内置 LightRAG profile

启动 `rag-lightrag` profile 后：

1. 打开 LightRAG，上传一份小型可信材料并完成索引。
2. 在 DeepTutor 模型设置中配置与 `.env` 一致的 LLM/Embedding Provider。
3. 在 DeepTutor Knowledge Center 连接外部 LightRAG Server：
   - Server URL：`http://lightrag:9621`
   - API Key：`.env` 的 `LIGHTRAG_API_KEY`
4. 分别验证 OpenMAIC 课程生成和 DeepTutor RAG 检索。此时二者仍是独立用户流程。

`http://lightrag:9621` 是容器网络地址，只应提交给 DeepTutor 服务端。宿主机浏览器访问 LightRAG 使用 `http://localhost:9621`。

### 6.3 外部或其他 RAG

保持 `rag-lightrag` profile 关闭，把 DeepTutor 或未来 `RagProviderPort` 指向外部服务。不要让业务代码直接连接对方的向量数据库。

## 7. 数据和“共享”的准确含义

| 数据 | 位置 | 是否共享 |
| --- | --- | --- |
| Innate 未来业务数据 | PostgreSQL `innate` DB | 未来 Catalog/Adapter 使用 |
| OpenMAIC RuntimeStore | PostgreSQL `openmaic` DB | 仅 OpenMAIC 使用 |
| OpenMAIC 生成课堂 JSON/媒体 | `openmaic-data` volume | 仅 OpenMAIC 使用 |
| LightRAG KV/Vector/Graph（可选） | PostgreSQL `lightrag` DB | 仅启用 profile 后，通过 HTTP API 共享 |
| DeepTutor 工作区/Memory/KB pointer | `deeptutor-data` volume | 仅 DeepTutor 使用 |

不让两个上游直接读写同一组表。共享发生在 PostgreSQL 实例、网络、Provider 和 RAG HTTP 契约层。

## 8. 当前限制

- OpenMAIC 的 PostgreSQL persistence 使用公开在浏览器 bundle 中的开发 token，只适用于本机/可信网络。
- OpenMAIC 生成任务仍依赖单进程内存状态和本地文件；快速验证阶段保持单实例。
- DeepTutor 不读取根 `.env` 的模型配置，必须通过 UI 或其 `data/user/settings` 配置。
- LightRAG 的 LLM 和 Embedding 参数必须与实际 Provider 匹配，尤其是 `EMBEDDING_DIM`。
- LightRAG 只有一个 `WORKSPACE=innate_shared`；需要多知识域隔离时再设计 workspace/instance 策略。
- 课程生成要使用 RAG，需要 Producer Adapter 先检索 LightRAG，再把 GroundingBundle 送入 OpenMAIC；当前 Compose 不会自动完成。

## 9. 停止与清理

停止但保留数据：

```bash
docker compose down
```

以下命令会删除所有 Compose volumes，包含课程、数据库、RAG 索引和 DeepTutor 工作区，因此不作为日常命令：

```bash
docker compose down -v
```

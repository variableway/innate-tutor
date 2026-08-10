#!/usr/bin/env node
/** T1: 20 scene/selection direct-context Q&A over DeepTutor WS (no RAG). */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUESTIONS = path.join(ROOT, "fixtures/tutor-baseline/questions.json");
const ARTIFACT = path.join(
  ROOT,
  "fixtures/course-artifacts/76267f4f-ed8d-4ebc-b8fc-2d22857082b9/artifact.json",
);
const OUT_JSON = path.join(ROOT, "docs/benchmarks/t1-tutor-standalone-report.json");
const OUT_MD = path.join(ROOT, "docs/benchmarks/t1-tutor-standalone-report.md");
const WS_URL = "ws://127.0.0.1:8001/api/v1/ws";

function sceneText(artifact, sceneId) {
  const scenes = artifact?.content?.scenes || [];
  const scene = scenes.find((s) => s.id === sceneId) || null;
  if (!scene) return { scene: null, text: "" };
  const parts = [];
  for (const action of scene.actions || []) {
    if (action?.type === "speech" && action.text) parts.push(String(action.text));
  }
  if (scene.content && typeof scene.content === "object") {
    parts.push(JSON.stringify(scene.content).slice(0, 2000));
  } else if (typeof scene.content === "string" && scene.content.trim()) {
    parts.push(scene.content.slice(0, 2000));
  }
  return { scene, text: parts.join("\n") };
}

function buildPrompt(artifact, item, rules) {
  const stage = artifact?.content?.stage || {};
  const { scene, text } = sceneText(artifact, item.sceneId);
  return `你是课堂助教。请严格遵守：
${rules.map((r) => `- ${r}`).join("\n")}

课程: ${stage.name || ""}
场景ID: ${item.sceneId}
场景标题: ${scene?.title || ""}
场景类型: ${scene?.type || ""}

场景正文:
${text || "(无文本)"}

选中内容:
${item.selection || "(无)"}

学生问题:
${item.question}
`;
}

function oneTurn(prompt, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const chunks = [];
    const eventTypes = [];
    let error = null;
    let settled = false;
    let ws;
    const finish = (extra = {}) => {
      if (settled) return;
      settled = true;
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      const answer = chunks.join("").trim() || (chunks.at(-1) || "").trim();
      const latency_s = Number(((Date.now() - started) / 1000).toFixed(2));
      const citationLike = /doi:|页码|sourceRef|https?:\/\/|参考文献/i.test(answer);
      resolve({
        ok: Boolean(answer) && !error,
        latency_s,
        error,
        answerChars: answer.length,
        answerPreview: answer.slice(0, 400),
        eventTypes: eventTypes.slice(0, 40),
        citationLike,
        usedRagHint: eventTypes.join(",").toLowerCase().includes("rag"),
        ...extra,
      });
    };

    const timer = setTimeout(() => {
      error = error || "timeout_no_done";
      finish();
    }, timeoutMs);

    try {
      ws = new WebSocket(WS_URL);
    } catch (e) {
      clearTimeout(timer);
      error = String(e);
      finish();
      return;
    }

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          type: "start_turn",
          capability: "chat",
          content: prompt,
          knowledge_bases: [],
          tools: [],
          language: "zh",
        }),
      );
    });

    ws.addEventListener("message", (ev) => {
      let msg;
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      const et = String(msg.type || "");
      eventTypes.push(et);
      if (et === "content" && typeof msg.content === "string" && msg.content) {
        chunks.push(msg.content);
      }
      if (et === "error") {
        error = String(msg.content || msg.error || "error_event");
        clearTimeout(timer);
        finish();
        return;
      }
      if (et === "done") {
        clearTimeout(timer);
        finish();
      }
    });

    ws.addEventListener("error", () => {
      error = error || "ws_error";
      clearTimeout(timer);
      finish();
    });

    ws.addEventListener("close", () => {
      if (!settled) {
        error = error || (chunks.length ? null : "ws_closed");
        clearTimeout(timer);
        finish();
      }
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const artifact = JSON.parse(await readFile(ARTIFACT, "utf8"));
  const qfile = JSON.parse(await readFile(QUESTIONS, "utf8"));
  const results = [];
  for (const item of qfile.questions) {
    const prompt = buildPrompt(artifact, item, qfile.rules || []);
    process.stdout.write(`run ${item.id} kind=${item.kind} ... `);
    const outcome = await oneTurn(prompt);
    results.push({ ...item, ...outcome });
    console.log(
      `ok=${outcome.ok} latency=${outcome.latency_s} err=${outcome.error || "-"} chars=${outcome.answerChars}`,
    );
    await sleep(1000);
  }

  const passed = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const meta = {
    generatedAt: new Date().toISOString(),
    wsUrl: WS_URL,
    fixture: "fixtures/course-artifacts/76267f4f-ed8d-4ebc-b8fc-2d22857082b9/artifact.json",
    questionCount: results.length,
    mode: "direct-context no-RAG",
  };
  const report = {
    meta,
    summary: {
      total: results.length,
      passed: passed.length,
      failed: failed.length,
      passRate: results.length ? passed.length / results.length : 0,
      citationLikeCount: results.filter((r) => r.citationLike).length,
      ragHintCount: results.filter((r) => r.usedRagHint).length,
    },
    results,
  };
  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  const lines = [
    "# T1 Tutor Standalone (no-RAG) Report",
    "",
    `- Generated: ${meta.generatedAt}`,
    `- DeepTutor: \`${meta.wsUrl}\``,
    `- Fixture: \`${meta.fixture}\``,
    `- Passed: ${passed.length} / ${results.length} (${(report.summary.passRate * 100).toFixed(0)}%)`,
    `- citation-like answers: ${report.summary.citationLikeCount}`,
    `- rag event hints: ${report.summary.ragHintCount}`,
    "",
    "## Notes",
    "",
    "- All turns sent with `knowledge_bases: []` and `tools: []`.",
    "- Prompts inject CourseArtifact scene/selection text (direct context).",
    "- OOS/boundary items should refuse fake citations / unknown facts.",
    "",
    "## Samples",
    "",
    "| ID | Kind | OK | Latency | Err | Preview |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of results) {
    const prev = String(r.answerPreview || "")
      .replaceAll("|", "/")
      .replaceAll("\n", " ")
      .slice(0, 80);
    lines.push(
      `| ${r.id} | ${r.kind} | ${r.ok ? "Y" : "N"} | ${r.latency_s} | ${r.error || "-"} | ${prev} |`,
    );
  }
  lines.push("");
  await writeFile(OUT_MD, lines.join("\n"), "utf8");
  console.log("wrote", OUT_JSON);
  console.log("wrote", OUT_MD);
  console.log("passed", passed.length, "/", results.length);
  process.exit(passed.length >= 16 ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

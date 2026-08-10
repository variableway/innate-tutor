#!/usr/bin/env python3
"""T1: 20 scene/selection direct-context Q&A turns over DeepTutor /api/v1/ws (no RAG)."""

from __future__ import annotations

import asyncio
import json
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUESTIONS = ROOT / "fixtures" / "tutor-baseline" / "questions.json"
ARTIFACT = (
    ROOT
    / "fixtures"
    / "course-artifacts"
    / "76267f4f-ed8d-4ebc-b8fc-2d22857082b9"
    / "artifact.json"
)
OUT_JSON = ROOT / "docs" / "benchmarks" / "t1-tutor-standalone-report.json"
OUT_MD = ROOT / "docs" / "benchmarks" / "t1-tutor-standalone-report.md"
WS_URL = "ws://127.0.0.1:8001/api/v1/ws"


def scene_text(artifact: dict, scene_id: str) -> tuple[dict | None, str]:
    scenes = artifact.get("content", {}).get("scenes") or []
    scene = next((s for s in scenes if s.get("id") == scene_id), None)
    if not scene:
        return None, ""
    parts: list[str] = []
    for action in scene.get("actions") or []:
        if isinstance(action, dict) and action.get("type") == "speech" and action.get("text"):
            parts.append(str(action["text"]))
    content = scene.get("content")
    if isinstance(content, dict):
        # quiz / slide structured content
        parts.append(json.dumps(content, ensure_ascii=False)[:2000])
    elif isinstance(content, str) and content.strip():
        parts.append(content[:2000])
    return scene, "\n".join(parts)


def build_prompt(artifact: dict, item: dict) -> str:
    stage = artifact.get("content", {}).get("stage") or {}
    scene, text = scene_text(artifact, item["sceneId"])
    selection = item.get("selection")
    rules = "\n".join(f"- {r}" for r in (QUESTIONS and json.loads(QUESTIONS.read_text(encoding="utf-8")).get("rules") or []))
    return f"""你是课堂助教。请严格遵守：
{rules}

课程: {stage.get("name")}
场景ID: {item["sceneId"]}
场景标题: {(scene or {}).get("title")}
场景类型: {(scene or {}).get("type")}

场景正文:
{text or "(无文本)"}

选中内容:
{selection or "(无)"}

学生问题:
{item["question"]}
"""


async def one_turn(ws_module, prompt: str, timeout_s: float = 120.0) -> dict:
    import websockets

    started = time.time()
    chunks: list[str] = []
    events: list[str] = []
    error = None
    done = False
    try:
        async with websockets.connect(WS_URL, open_timeout=30, max_size=8_000_000) as ws:
            await ws.send(
                json.dumps(
                    {
                        "type": "start_turn",
                        "capability": "chat",
                        "content": prompt,
                        "knowledge_bases": [],
                        "tools": [],
                        "language": "zh",
                    },
                    ensure_ascii=False,
                )
            )
            while time.time() - started < timeout_s:
                try:
                    raw = await asyncio.wait_for(ws.recv(), timeout=timeout_s)
                except asyncio.TimeoutError:
                    error = "recv_timeout"
                    break
                msg = json.loads(raw)
                et = str(msg.get("type") or "")
                events.append(et)
                if et in {"content", "CONTENT", "assistant_content", "delta"}:
                    content = msg.get("content")
                    if isinstance(content, str) and content:
                        chunks.append(content)
                # DeepTutor StreamEvent uses lowercase/enum values
                if et.lower() in {"content"} and isinstance(msg.get("content"), str):
                    if msg["content"] and (not chunks or chunks[-1] != msg["content"]):
                        # already appended above for content
                        pass
                if et.lower() in {"done", "turn_done", "complete", "error"}:
                    if et.lower() == "error":
                        error = str(msg.get("content") or msg.get("error") or "error_event")
                    done = True
                    # collect any final content
                    if isinstance(msg.get("content"), str) and msg["content"]:
                        chunks.append(msg["content"])
                    break
                # Also treat nested event envelopes
                if msg.get("event") == "done" or msg.get("status") == "succeeded":
                    done = True
                    break
            if not done and error is None:
                error = "timeout_no_done"
    except Exception as exc:  # noqa: BLE001
        error = f"{type(exc).__name__}: {exc}"

    answer = "".join(chunks).strip()
    # Deduplicate if server streams cumulative snapshots
    if not answer and chunks:
        answer = chunks[-1].strip()
    latency = round(time.time() - started, 2)
    ok = bool(answer) and error is None
    citationish = any(
        x in answer.lower()
        for x in ("doi:", "第", "页码", "sourceRef", "http://", "https://", "参考文献")
    )
    return {
        "ok": ok,
        "latency_s": latency,
        "error": error,
        "answerChars": len(answer),
        "answerPreview": answer[:400],
        "eventTypes": events[:40],
        "citationLike": citationish,
        "usedRagHint": "rag" in ",".join(events).lower(),
    }


async def run_all(items: list[dict], artifact: dict) -> list[dict]:
    results = []
    for item in items:
        prompt = build_prompt(artifact, item)
        print(f"run {item['id']} kind={item['kind']} ...", flush=True)
        outcome = await one_turn(None, prompt)
        row = {**item, **outcome}
        results.append(row)
        print(
            f"  -> ok={row['ok']} latency={row['latency_s']} err={row['error']} chars={row['answerChars']}",
            flush=True,
        )
        # gentle pacing for MiniMax
        await asyncio.sleep(1.0)
    return results


def write_report(results: list[dict], meta: dict) -> None:
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    passed = [r for r in results if r.get("ok")]
    failed = [r for r in results if not r.get("ok")]
    report = {
        "meta": meta,
        "summary": {
            "total": len(results),
            "passed": len(passed),
            "failed": len(failed),
            "passRate": (len(passed) / len(results)) if results else 0,
            "citationLikeCount": sum(1 for r in results if r.get("citationLike")),
            "ragHintCount": sum(1 for r in results if r.get("usedRagHint")),
        },
        "results": results,
    }
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# T1 Tutor Standalone (no-RAG) Report",
        "",
        f"- Generated: {meta.get('generatedAt')}",
        f"- DeepTutor: `{meta.get('wsUrl')}`",
        f"- Fixture: `{meta.get('fixture')}`",
        f"- Passed: {len(passed)} / {len(results)} ({report['summary']['passRate']:.0%})",
        f"- citation-like answers: {report['summary']['citationLikeCount']}",
        f"- rag event hints: {report['summary']['ragHintCount']}",
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
    ]
    for r in results:
        prev = (r.get("answerPreview") or "").replace("|", "/").replace("\n", " ")[:80]
        lines.append(
            f"| {r.get('id')} | {r.get('kind')} | {'Y' if r.get('ok') else 'N'} | {r.get('latency_s')} | {r.get('error') or '-'} | {prev} |"
        )
    lines.append("")
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print("wrote", OUT_JSON)
    print("wrote", OUT_MD)


def main() -> int:
    try:
        import websockets  # noqa: F401
    except ImportError:
        import subprocess
        import sys

        subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])

    artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    payload = json.loads(QUESTIONS.read_text(encoding="utf-8"))
    items = payload["questions"]
    meta = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "wsUrl": WS_URL,
        "fixture": str(ARTIFACT.relative_to(ROOT)).replace("\\", "/"),
        "questionCount": len(items),
        "mode": "direct-context no-RAG",
    }
    results = asyncio.run(run_all(items, artifact))
    write_report(results, meta)
    passed = sum(1 for r in results if r.get("ok"))
    print("passed", passed, "/", len(results))
    return 0 if passed >= 16 else 2  # allow some flaky provider failures


if __name__ == "__main__":
    raise SystemExit(main())

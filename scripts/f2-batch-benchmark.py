#!/usr/bin/env python3
"""F2 batch benchmark: 10 Catalog samples + heuristic rubric + Go/No-Go report."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "benchmarks"
OUT_JSON = OUT_DIR / "f2-batch-report.json"
OUT_MD = OUT_DIR / "f2-batch-report.md"

BASE = "http://127.0.0.1:3100"
OPENMAIC = "http://127.0.0.1:3000"

# Short topics to reduce provider timeout risk. Mix of knowledge / quiz / material.
SAMPLES = [
    {
        "id": "b01",
        "kind": "knowledge",
        "title": "F2 b01 fractions",
        "requirement": "用 2 页中文幻灯片讲解分数的意义，初中难度，无图片视频TTS无Quiz。",
    },
    {
        "id": "b02",
        "kind": "quiz",
        "title": "F2 b02 percent quiz",
        "requirement": "2 场景中文短课：百分比概念讲解 + 1 道三选一 Quiz。关闭媒体。",
    },
    {
        "id": "b03",
        "kind": "material",
        "title": "F2 b03 water cycle",
        "requirement": "基于材料生成 2 页中文课（无媒体无Quiz）：水循环包括蒸发、凝结、降水。",
    },
    {
        "id": "b04",
        "kind": "knowledge",
        "title": "F2 b04 newton1",
        "requirement": "用 2 页中文讲解牛顿第一定律，面向高一，无媒体无Quiz。",
    },
    {
        "id": "b05",
        "kind": "quiz",
        "title": "F2 b05 cell quiz",
        "requirement": "2 场景：细胞结构简述 + 1 道选择题（线粒体功能）。中文，无媒体。",
    },
    {
        "id": "b06",
        "kind": "material",
        "title": "F2 b06 supply demand",
        "requirement": "基于材料生成 2 页中文课：供给增加通常使均衡价格下降，需求增加通常使均衡价格上升。无媒体。",
    },
    {
        "id": "b07",
        "kind": "knowledge",
        "title": "F2 b07 binary",
        "requirement": "用 2 页中文讲解二进制与十进制互转入门，无媒体无Quiz。",
    },
    {
        "id": "b08",
        "kind": "quiz",
        "title": "F2 b08 pythagoras",
        "requirement": "2 场景中文：勾股定理公式讲解 + 1 道简单计算选择题。无媒体。",
    },
    {
        "id": "b09",
        "kind": "material",
        "title": "F2 b09 photosynthesis",
        "requirement": "基于材料生成 2 页中文课：光合作用在叶绿体中把二氧化碳和水转化为有机物并释放氧气。无媒体。",
    },
    {
        "id": "b10",
        "kind": "knowledge",
        "title": "F2 b10 thesis",
        "requirement": "用 2 页中文讲解议论文三要素（论点、论据、论证），无媒体无Quiz。",
    },
]


def http_json(method: str, url: str, body=None, timeout: float = 60):
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw) if raw else {}
        except Exception:
            payload = {"error": raw}
        return e.code, payload
    except Exception as e:
        return 0, {"error": str(e)}


def classify_failure(error_message: str | None, status: str | None) -> str | None:
    if status == "succeeded":
        return None
    msg = (error_message or "").lower()
    if any(
        x in msg
        for x in (
            "api key",
            "unauthorized",
            "401",
            "403",
            "timeout",
            "cannot connect",
            "headers timeout",
            "econnreset",
            "tls",
            "rate limit",
            "429",
        )
    ):
        return "provider"
    if any(x in msg for x in ("json", "parse", "schema", "validation", "zod")):
        return "schema"
    if any(x in msg for x in ("image", "video", "tts", "media", "asset")):
        return "media"
    if any(x in msg for x in ("persist", "disk", "volume", "eacces", "enospc", "database")):
        return "persist"
    if status in ("failed", "cancelled", None) or msg:
        return "gen"
    return "gen"


def score_classroom(kind: str, classroom: dict | None, openable: bool) -> dict:
    """Heuristic rubric (0-2 each). Human review can override later."""
    scenes = []
    if isinstance(classroom, dict):
        scenes = (
            classroom.get("scenes")
            or classroom.get("stage", {}).get("scenes")
            or classroom.get("data", {}).get("scenes")
            or []
        )
        if not isinstance(scenes, list):
            scenes = []

    scene_count = len(scenes)
    text_blob = json.dumps(classroom or {}, ensure_ascii=False)
    has_cn = any("\u4e00" <= ch <= "\u9fff" for ch in text_blob[:8000])
    quizish = any(
        k in text_blob.lower()
        for k in ("quiz", "选择题", "选项", '"type":"quiz"', "question")
    )

    scores = {
        "openable": 2 if openable else 0,
        "scene_count": 2 if scene_count >= 2 else (1 if scene_count == 1 else 0),
        "chinese": 2 if has_cn else 0,
        "kind_fit": 2
        if (kind != "quiz" and True) or (kind == "quiz" and quizish)
        else (1 if kind == "quiz" else 2),
    }
    if kind == "quiz" and not quizish:
        scores["kind_fit"] = 0
    total = sum(scores.values())
    max_total = 8
    return {
        "dimensions": scores,
        "total": total,
        "max": max_total,
        "pass": openable and total >= 5,
        "sceneCount": scene_count,
        "quizDetected": quizish,
        "chineseDetected": has_cn,
    }


def poll_course(course_id: str, title: str, max_iters: int = 720):
    for i in range(max_iters):
        st, payload = http_json(
            "GET", f"{BASE}/api/catalog/courses/{course_id}", timeout=60
        )
        if st == 0 or st >= 500:
            print(f"  poll {title} i={i} transient {st}", flush=True)
            time.sleep(5)
            continue
        course = payload.get("course") or {}
        status = course.get("status")
        print(
            f"  poll {title} i={i} status={status} step={course.get('step')} "
            f"progress={course.get('progress')} "
            f"err={(course.get('errorMessage') or '')[:120]}",
            flush=True,
        )
        if status in ("succeeded", "failed", "cancelled"):
            return course
        time.sleep(5)
    return None


def run_sample(sample: dict) -> dict:
    t0 = time.time()
    st, payload = http_json(
        "POST",
        f"{BASE}/api/catalog/generate",
        {"title": sample["title"], "requirement": sample["requirement"]},
        timeout=120,
    )
    print(f"submit {sample['id']} {sample['title']} -> {st}", flush=True)
    if st not in (200, 202) or "course" not in payload:
        latency = round(time.time() - t0, 1)
        return {
            **sample,
            "ok": False,
            "latency_s": latency,
            "submitStatus": st,
            "errorMessage": str(payload)[:500],
            "failureClass": classify_failure(str(payload), "failed"),
            "rubric": score_classroom(sample["kind"], None, False),
        }

    course_id = payload["course"]["id"]
    final = poll_course(course_id, sample["title"])
    latency = round(time.time() - t0, 1)
    if not final:
        return {
            **sample,
            "ok": False,
            "courseId": course_id,
            "latency_s": latency,
            "errorMessage": "timeout",
            "failureClass": "provider",
            "rubric": score_classroom(sample["kind"], None, False),
        }

    classroom_id = final.get("openmaicCourseId")
    classroom = None
    api_ok = False
    if classroom_id:
        st2, body2 = http_json(
            "GET", f"{OPENMAIC}/api/classroom?id={classroom_id}", timeout=30
        )
        api_ok = st2 < 400 and isinstance(body2, dict) and bool(body2)
        classroom = body2 if api_ok else None

    rubric = score_classroom(sample["kind"], classroom, api_ok)
    failure = classify_failure(final.get("errorMessage"), final.get("status"))
    ok = final.get("status") == "succeeded" and rubric["pass"]
    return {
        **sample,
        "ok": ok,
        "courseId": course_id,
        "status": final.get("status"),
        "classroomUrl": final.get("classroomUrl"),
        "openmaicCourseId": classroom_id,
        "openmaicJobId": final.get("openmaicJobId"),
        "model": final.get("model"),
        "latency_s": latency,
        "errorCode": final.get("errorCode"),
        "errorMessage": final.get("errorMessage"),
        "failureClass": failure,
        "rubric": rubric,
        "apiOk": api_ok,
    }


def write_report(results: list[dict], meta: dict) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    success = [r for r in results if r.get("ok")]
    failed = [r for r in results if not r.get("ok")]
    by_class: dict[str, int] = {}
    for r in failed:
        cls = r.get("failureClass") or "unknown"
        by_class[cls] = by_class.get(cls, 0) + 1

    pass_rate = len(success) / len(results) if results else 0.0
    # Go if >=70% openable+rubric pass and provider failures <50% of total
    provider_fail_rate = by_class.get("provider", 0) / len(results) if results else 1.0
    decision = "Go" if pass_rate >= 0.7 and provider_fail_rate < 0.5 else (
        "Narrow" if pass_rate >= 0.4 else "No-Go"
    )
    rationale = []
    if pass_rate >= 0.7:
        rationale.append(f"pass_rate={pass_rate:.0%} meets >=70% bar")
    else:
        rationale.append(f"pass_rate={pass_rate:.0%} below 70% bar")
    if provider_fail_rate >= 0.5:
        rationale.append(f"provider_fail_rate={provider_fail_rate:.0%} indicates unstable LLM path")
    if by_class.get("schema"):
        rationale.append("schema failures present — inspect generation JSON robustness")
    if by_class.get("persist"):
        rationale.append("persist failures present — check volumes/DB")

    report = {
        "meta": meta,
        "summary": {
            "total": len(results),
            "passed": len(success),
            "failed": len(failed),
            "passRate": pass_rate,
            "failureClasses": by_class,
            "decision": decision,
            "rationale": rationale,
        },
        "results": results,
    }
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# F2 Batch Benchmark Report",
        "",
        f"- Generated: {meta.get('generatedAt')}",
        f"- Model/path: `{meta.get('defaultModelHint')}`",
        f"- Samples: {len(results)}",
        f"- Passed: {len(success)} / {len(results)} ({pass_rate:.0%})",
        f"- Decision: **{decision}**",
        "",
        "## Rationale",
        "",
    ]
    for r in rationale:
        lines.append(f"- {r}")
    lines.extend(["", "## Failure classes", ""])
    if by_class:
        for k, v in sorted(by_class.items()):
            lines.append(f"- `{k}`: {v}")
    else:
        lines.append("- (none)")
    lines.extend(["", "## Samples", ""])
    lines.append("| ID | Kind | OK | Latency(s) | Class | Rubric | Classroom |")
    lines.append("| --- | --- | --- | --- | --- | --- | --- |")
    for r in results:
        lines.append(
            "| {id} | {kind} | {ok} | {lat} | {cls} | {rub}/{mx} | {cid} |".format(
                id=r.get("id"),
                kind=r.get("kind"),
                ok="Y" if r.get("ok") else "N",
                lat=r.get("latency_s"),
                cls=r.get("failureClass") or "-",
                rub=(r.get("rubric") or {}).get("total"),
                mx=(r.get("rubric") or {}).get("max"),
                cid=r.get("openmaicCourseId") or "-",
            )
        )
    lines.extend(
        [
            "",
            "## Rubric notes",
            "",
            "Heuristic automated rubric (openable / scene_count / chinese / kind_fit).",
            "Quiz detection is string-based; human spot-check recommended for Go decisions near threshold.",
            "",
            f"JSON: `{OUT_JSON.relative_to(ROOT).as_posix()}`",
            "",
        ]
    )
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print("wrote", OUT_JSON, flush=True)
    print("wrote", OUT_MD, flush=True)
    print("decision", decision, "pass_rate", f"{pass_rate:.0%}", flush=True)


def main() -> int:
    st, health = http_json("GET", f"{BASE}/api/health")
    print("health", st, health, flush=True)
    if st != 200:
        return 1

    meta = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "defaultModelHint": "openai:MiniMax-M3 (minimax-codex via LLM_*; Volcengine Unauthorized / Xiaomi anthropic 404 during probe)",
        "catalogBase": BASE,
        "openmaicBase": OPENMAIC,
    }
    results = []
    for sample in SAMPLES:
        result = run_sample(sample)
        results.append(result)
        # incremental save
        write_report(results, meta)

    write_report(results, meta)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

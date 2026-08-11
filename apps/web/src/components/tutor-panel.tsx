"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { TutorStreamEventV0 } from "@innate/contracts";

/** Player must never be gated on Tutor health (INN-8.5 / INN-9). */
function openPlayerIndependently(classroomUrl: string | null, tutorOk: boolean) {
  const url = classroomUrl?.trim() ?? "";
  return {
    opened: Boolean(url),
    classroomUrl: url,
    note: url
      ? `Player may open regardless of Tutor (tutorOk=${tutorOk}).`
      : "No classroom URL; Player unavailable. Tutor status is irrelevant.",
  };
}

interface SceneOption {
  sceneId: string;
  type: string;
  title: string;
  order: number;
}

interface ContextMeta {
  courseVersionId: string;
  sceneIndex: SceneOption[];
  stageName: string;
  checksum: string;
}

export function TutorPanel({
  courseId,
  courseVersionId,
  classroomUrl,
}: {
  courseId: string;
  courseVersionId: string | null;
  classroomUrl: string | null;
}) {
  const [meta, setMeta] = useState<ContextMeta | null>(null);
  const [sceneId, setSceneId] = useState("");
  const [selection, setSelection] = useState("");
  const [question, setQuestion] = useState("请根据当前场景解释关键概念。");
  const [answer, setAnswer] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [tutorOk, setTutorOk] = useState<boolean | null>(null);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [playerNote, setPlayerNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refreshHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/tutor/health", { cache: "no-store" });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      setTutorOk(Boolean(body.ok));
      if (!body.ok) setTutorError(body.error ?? "Tutor unavailable");
      else setTutorError(null);
    } catch (error) {
      setTutorOk(false);
      setTutorError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  const loadContext = useCallback(async () => {
    const qs = new URLSearchParams();
    if (courseVersionId) qs.set("courseVersionId", courseVersionId);
    else qs.set("courseId", courseId);
    const res = await fetch(`/api/tutor/context?${qs}`, { cache: "no-store" });
    const body = (await res.json()) as ContextMeta & { error?: string };
    if (!res.ok) {
      throw new Error(body.error ?? "Failed to load tutor context");
    }
    setMeta(body);
    setSceneId((prev) => prev || body.sceneIndex[0]?.sceneId || "");
  }, [courseId, courseVersionId]);

  useEffect(() => {
    void refreshHealth();
    void loadContext().catch((err: unknown) => {
      setTutorError(err instanceof Error ? err.message : String(err));
    });
  }, [loadContext, refreshHealth]);

  function openPlayer() {
    const result = openPlayerIndependently(classroomUrl, tutorOk ?? false);
    setPlayerNote(result.note);
    if (result.opened) {
      window.open(result.classroomUrl, "_blank", "noopener,noreferrer");
    }
  }

  function ask() {
    if (!meta || !sceneId || !question.trim()) return;
    setAnswer("");
    setEvents([]);
    setTutorError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/tutor/turn", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            courseVersionId: meta.courseVersionId,
            sceneId,
            selection,
            question,
            // Intentionally send a forged body — server must discard it.
            forgedSceneBody: "CLIENT_FORGED_SCENE_BODY_MUST_BE_IGNORED",
            tools: ["shell", "mcp", "subagent"],
          }),
        });
        if (!res.ok || !res.body) {
          const errBody = (await res.json().catch(() => ({}))) as {
            message?: string;
            error?: string;
          };
          throw new Error(errBody.message ?? errBody.error ?? `HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as TutorStreamEventV0;
            setEvents((prev) => [...prev.slice(-20), event.type]);
            if (event.type === "content" && event.content) {
              text += event.content;
              setAnswer(text);
            }
            if (event.type === "error") {
              setTutorOk(event.tutorUnavailable ? false : tutorOk);
              setTutorError(event.errorMessage ?? "Tutor error");
            }
          }
        }
        await refreshHealth();
      } catch (error) {
        setTutorError(error instanceof Error ? error.message : String(error));
      }
    });
  }

  return (
    <section className="panel stack tutor-panel">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Tutor Panel</h2>
        <span className={`status-badge ${tutorOk ? "ok" : "warn"}`}>
          Tutor {tutorOk == null ? "…" : tutorOk ? "online" : "degraded"}
        </span>
      </div>
      <p className="meta">
        播放与 Tutor 解耦：Player 不依赖 Tutor。上下文仅从 CourseArtifact 服务端组装；
        客户端伪造正文会被丢弃。
      </p>
      <div className="actions">
        <button type="button" className="button" disabled={!classroomUrl} onClick={openPlayer}>
          打开 Player（不依赖 Tutor）
        </button>
        <button type="button" className="button secondary" onClick={() => void refreshHealth()}>
          检查 Tutor
        </button>
      </div>
      {playerNote ? <div className="meta">{playerNote}</div> : null}
      {tutorError ? <div className="error-box">{tutorError}</div> : null}

      {meta ? (
        <>
          <div className="meta">
            courseVersionId: {meta.courseVersionId}
            <br />
            checksum: {meta.checksum.slice(0, 16)}…
            <br />
            stage: {meta.stageName || "—"}
          </div>
          <label>
            场景
            <select value={sceneId} onChange={(e) => setSceneId(e.target.value)}>
              {meta.sceneIndex.map((s) => (
                <option key={s.sceneId} value={s.sceneId}>
                  #{s.order} {s.title || s.sceneId} ({s.type})
                </option>
              ))}
            </select>
          </label>
          <label>
            选中内容（可选）
            <input
              type="text"
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              placeholder="学生高亮的文本"
            />
          </label>
          <label>
            问题
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
          </label>
          <button
            type="button"
            className="button"
            disabled={pending || !sceneId || !question.trim()}
            onClick={ask}
          >
            {pending ? "回答中…" : "提问（服务端可信上下文）"}
          </button>
          {events.length ? <div className="meta">events: {events.join(" → ")}</div> : null}
          {answer ? (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                margin: 0,
                lineHeight: 1.5,
                fontFamily: "var(--font-body)",
              }}
            >
              {answer}
            </pre>
          ) : null}
        </>
      ) : (
        <div className="meta">加载可信场景索引…</div>
      )}
    </section>
  );
}

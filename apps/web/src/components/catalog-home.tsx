"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { CatalogCourse } from "@innate/contracts";
import { CourseList } from "./course-list";

const SMOKE_TOPICS = [
  {
    title: "Smoke · 知识讲解",
    requirement:
      "用 3-4 页幻灯片讲解“什么是光合作用”，面向初中生，中文，不要生成图片、视频或 TTS。",
  },
  {
    title: "Smoke · 带 Quiz",
    requirement:
      "生成一门关于“勾股定理”的短课，包含讲解页和至少一道选择题 Quiz，中文，关闭所有媒体生成。",
  },
  {
    title: "Smoke · 短材料",
    requirement:
      "基于以下短材料生成一门 3 页课程（中文，无媒体）：\n材料：光合作用是植物利用光能将二氧化碳和水转化为有机物并释放氧气的过程。叶绿体是主要场所。",
  },
];

export function CatalogHome({ initialCourses }: { initialCourses: CatalogCourse[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [requirement, setRequirement] = useState(SMOKE_TOPICS[0]!.requirement);
  const [title, setTitle] = useState(SMOKE_TOPICS[0]!.title);
  const [error, setError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const res = await fetch("/api/catalog/courses", { cache: "no-store" });
    const body = (await res.json()) as { courses?: CatalogCourse[]; error?: string };
    if (!res.ok) {
      throw new Error(body.error ?? "Failed to refresh courses");
    }
    setCourses(body.courses ?? []);
  }, []);

  useEffect(() => {
    const hasActive = courses.some((c) => c.status === "queued" || c.status === "running");
    if (!hasActive) return;
    const timer = window.setInterval(() => {
      void refresh().catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [courses, refresh]);

  function openPlayer(course: CatalogCourse) {
    setPlayerError(null);
    if (!course.classroomUrl) {
      setPlayerError("该课程还没有 classroom URL，无法打开 Player。");
      return;
    }
    const popup = window.open(course.classroomUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      setPlayerError(
        "浏览器拦截了弹窗，或 OpenMAIC Player 无法打开。Catalog 仍可继续浏览列表。",
      );
    }
  }

  async function createCourse(nextTitle: string, nextRequirement: string) {
    const res = await fetch("/api/catalog/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: nextTitle,
        requirement: nextRequirement,
      }),
    });
    const body = (await res.json()) as {
      course?: CatalogCourse;
      error?: string;
      details?: string;
    };
    if (!res.ok && !body.course) {
      throw new Error(body.details ?? body.error ?? "Generate failed");
    }
    if (body.course) {
      setCourses((prev) => [body.course!, ...prev.filter((c) => c.id !== body.course!.id)]);
    }
  }

  function submit(nextTitle: string, nextRequirement: string) {
    setError(null);
    setPlayerError(null);
    startTransition(async () => {
      try {
        await createCourse(nextTitle, nextRequirement);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function submitSmokeBatch() {
    setError(null);
    setPlayerError(null);
    startTransition(async () => {
      try {
        for (const topic of SMOKE_TOPICS) {
          await createCourse(topic.title, topic.requirement);
        }
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="shell">
      <header className="hero">
        <div className="brand">InnateTutor</div>
        <p className="lede">
          薄 Catalog：提交主题到 OpenMAIC 生成课堂，轮询状态，并在独立窗口打开 Player。
          Catalog 只保存元数据，不复制上游状态机。
        </p>
      </header>

      <div className="grid">
        <section className="panel stack">
          <h2>新建生成</h2>
          <label>
            标题（可选）
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="课程标题"
            />
          </label>
          <label>
            主题 / 材料
            <textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder="输入课程主题或短材料"
            />
          </label>
          <div className="actions">
            <button
              type="button"
              className="button"
              disabled={pending || !requirement.trim()}
              onClick={() => submit(title, requirement)}
            >
              {pending ? "提交中…" : "生成课程"}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={pending}
              onClick={submitSmokeBatch}
            >
              提交 3 个 Smoke
            </button>
          </div>
          {error ? <div className="error-box">{error}</div> : null}
          {playerError ? <div className="error-box">{playerError}</div> : null}
        </section>

        <section className="panel stack">
          <h2>课程列表</h2>
          <CourseList courses={courses} onOpenPlayer={openPlayer} />
        </section>
      </div>
    </div>
  );
}

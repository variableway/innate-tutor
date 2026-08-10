"use client";

import Link from "next/link";
import type { CatalogCourse } from "@innate/contracts";
import { StatusBadge } from "./status-badge";

function formatLatency(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function CourseList({
  courses,
  onOpenPlayer,
}: {
  courses: CatalogCourse[];
  onOpenPlayer: (course: CatalogCourse) => void;
}) {
  if (courses.length === 0) {
    return <p className="empty">还没有课程。先在左侧提交一个主题。</p>;
  }

  return (
    <div className="course-list">
      {courses.map((course) => (
        <article key={course.id} className="course-card">
          <header>
            <div>
              <h3>{course.title}</h3>
              <div className="meta">
                {course.message || "No status message"}
                {course.progress != null ? ` · ${course.progress}%` : ""}
              </div>
            </div>
            <StatusBadge status={course.status} />
          </header>
          <div className="meta">
            job: {course.openmaicJobId ?? "—"} · course: {course.openmaicCourseId ?? "—"} ·
            latency: {formatLatency(course.latencyMs)}
          </div>
          {course.errorMessage ? <div className="error-box">{course.errorMessage}</div> : null}
          <div className="actions">
            <Link className="detail-link" href={`/courses/${course.id}`}>
              详情
            </Link>
            <button
              type="button"
              className="button secondary"
              disabled={!course.classroomUrl}
              onClick={() => onOpenPlayer(course)}
            >
              打开 Player
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { TutorPanel } from "@/components/tutor-panel";
import { getCourse } from "@/lib/db";
import { syncCourseFromOpenMaic } from "@/lib/sync-job";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let course = await getCourse(id);
  if (!course) notFound();

  if (course.openmaicJobId && (course.status === "queued" || course.status === "running")) {
    try {
      course = await syncCourseFromOpenMaic(id);
    } catch {
      // Keep last known metadata if OpenMAIC is down.
    }
  } else if (
    course.status === "succeeded" &&
    course.openmaicCourseId &&
    !course.courseVersionId
  ) {
    try {
      course = await syncCourseFromOpenMaic(id);
    } catch {
      /* soft-fail artifact backfill */
    }
  }

  return (
    <div className="shell">
      <header className="hero">
        <Link className="detail-link" href="/">
          ← 返回 Catalog
        </Link>
        <div className="brand">{course.title}</div>
        <p className="lede">
          课程详情、CourseArtifact 快照与 Tutor Panel。Player 故障或 Tutor 不可用都不会让
          Catalog 不可用；两者互相不阻塞。
        </p>
      </header>

      <div className="grid">
        <section className="panel stack">
          <div className="actions">
            <StatusBadge status={course.status} />
            {course.classroomUrl ? (
              <a className="button" href={course.classroomUrl} target="_blank" rel="noreferrer">
                打开 Player
              </a>
            ) : (
              <button type="button" className="button" disabled>
                Player 不可用
              </button>
            )}
          </div>

          <div className="meta">
            <div>Catalog ID: {course.id}</div>
            <div>OpenMAIC job: {course.openmaicJobId ?? "—"}</div>
            <div>OpenMAIC course: {course.openmaicCourseId ?? "—"}</div>
            <div>Classroom URL: {course.classroomUrl ?? "—"}</div>
            <div>courseVersionId: {course.courseVersionId ?? "—"}</div>
            <div>artifactId: {course.artifactId ?? "—"}</div>
            <div>
              artifactChecksum:{" "}
              {course.artifactChecksum ? `${course.artifactChecksum.slice(0, 16)}…` : "—"}
            </div>
            <div>artifactPath: {course.artifactPath ?? "—"}</div>
            <div>Model: {course.model ?? "—"}</div>
            <div>
              Step: {course.step ?? "—"} · Progress: {course.progress ?? "—"}%
            </div>
            <div>Latency: {course.latencyMs != null ? `${course.latencyMs} ms` : "—"}</div>
            <div>Started: {course.startedAt ?? "—"}</div>
            <div>Finished: {course.finishedAt ?? "—"}</div>
          </div>

          <div>
            <h2>Requirement</h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                margin: 0,
                fontFamily: "var(--font-body)",
                lineHeight: 1.5,
              }}
            >
              {course.requirement}
            </pre>
          </div>

          {course.errorMessage ? (
            <div className="error-box">
              <strong>{course.errorCode ?? "ERROR"}</strong>
              <div>{course.errorMessage}</div>
            </div>
          ) : null}

          {course.message ? <div className="meta">Message: {course.message}</div> : null}
        </section>

        <TutorPanel
          courseId={course.id}
          courseVersionId={course.courseVersionId}
          classroomUrl={course.classroomUrl}
        />
      </div>
    </div>
  );
}

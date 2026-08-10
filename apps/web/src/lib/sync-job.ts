import type { CatalogCourse } from "@innate/contracts";
import { OpenMaicAdapterError } from "@innate/openmaic-adapter";
import { appendGenerationEvent, getCourse, updateCourse } from "./db";
import { getOpenMaicAdapter } from "./openmaic";

function deriveTitle(requirement: string, fallback?: string): string {
  if (fallback?.trim()) return fallback.trim();
  const firstLine = requirement.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
  if (!firstLine) return "Untitled course";
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
}

export { deriveTitle };

export async function syncCourseFromOpenMaic(courseId: string): Promise<CatalogCourse> {
  const course = await getCourse(courseId);
  if (!course) {
    throw new Error(`course not found: ${courseId}`);
  }
  if (!course.openmaicJobId) {
    return course;
  }
  if (course.status === "succeeded" || course.status === "failed") {
    return course;
  }

  const adapter = getOpenMaicAdapter();

  try {
    const job = await adapter.getClassroomJob(course.openmaicJobId);
    const startedAt = course.startedAt ? new Date(course.startedAt) : new Date();
    const finishedAt =
      job.status === "succeeded" || job.status === "failed" ? new Date() : null;
    const latencyMs = finishedAt ? finishedAt.getTime() - startedAt.getTime() : null;

    const classroomUrl =
      job.result?.classroomId != null
        ? adapter.buildClassroomUrl(job.result.classroomId)
        : (job.result?.url ?? null);

    const updated = await updateCourse(courseId, {
      status: job.status,
      openmaicCourseId: job.result?.classroomId ?? null,
      classroomUrl,
      progress: job.progress,
      step: job.step,
      message: job.message,
      errorCode: job.status === "failed" ? "OPENMAIC_GENERATION_FAILED" : null,
      errorMessage: job.error ?? null,
      finishedAt,
      latencyMs,
    });

    await appendGenerationEvent({
      courseId,
      status: updated.status,
      step: updated.step,
      progress: updated.progress,
      message: updated.message,
      rawError: updated.errorMessage,
    });

    return updated;
  } catch (error) {
    if (error instanceof OpenMaicAdapterError) {
      const updated = await updateCourse(courseId, {
        status: "failed",
        errorCode: error.code,
        errorMessage: error.details ? `${error.message}: ${error.details}` : error.message,
        finishedAt: new Date(),
        latencyMs: course.startedAt
          ? Date.now() - new Date(course.startedAt).getTime()
          : null,
        message: "OpenMAIC unavailable or returned an error",
      });
      await appendGenerationEvent({
        courseId,
        status: updated.status,
        step: updated.step,
        progress: updated.progress,
        message: updated.message,
        rawError: updated.errorMessage,
      });
      return updated;
    }
    throw error;
  }
}

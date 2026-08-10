import { NextResponse } from "next/server";
import { OpenMaicAdapterError } from "@innate/openmaic-adapter";
import { appendGenerationEvent, insertCourse, updateCourse } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { getOpenMaicAdapter } from "@/lib/openmaic";
import { deriveTitle } from "@/lib/sync-job";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      requirement?: string;
      title?: string;
      pdfContent?: string;
    };
    const requirement = body.requirement?.trim() ?? "";
    if (!requirement) {
      return NextResponse.json(
        { errorCode: "MISSING_REQUIRED_FIELD", error: "requirement is required" },
        { status: 400 },
      );
    }

    const env = getServerEnv();
    const course = await insertCourse({
      title: deriveTitle(requirement, body.title),
      requirement,
      model: env.defaultModel,
    });

    await appendGenerationEvent({
      courseId: course.id,
      status: course.status,
      step: course.step,
      progress: course.progress,
      message: course.message,
      rawError: null,
    });

    const adapter = getOpenMaicAdapter();
    try {
      const job = await adapter.createClassroomJob({
        requirement,
        ...(body.pdfContent ? { pdfContent: body.pdfContent } : {}),
        enableWebSearch: false,
        enableImageGeneration: false,
        enableVideoGeneration: false,
        enableTTS: false,
      });

      const updated = await updateCourse(course.id, {
        status: job.status === "queued" ? "queued" : "running",
        openmaicJobId: job.jobId,
        step: job.step,
        message: job.message,
        progress: 0,
        startedAt: new Date(),
        errorCode: null,
        errorMessage: null,
      });

      await appendGenerationEvent({
        courseId: updated.id,
        status: updated.status,
        step: updated.step,
        progress: updated.progress,
        message: updated.message,
        rawError: null,
      });

      return NextResponse.json({ course: updated }, { status: 202 });
    } catch (error) {
      if (error instanceof OpenMaicAdapterError) {
        const failed = await updateCourse(course.id, {
          status: "failed",
          errorCode: error.code,
          errorMessage: error.details ? `${error.message}: ${error.details}` : error.message,
          finishedAt: new Date(),
          message: "Failed to submit generation to OpenMAIC",
        });
        await appendGenerationEvent({
          courseId: failed.id,
          status: failed.status,
          step: failed.step,
          progress: failed.progress,
          message: failed.message,
          rawError: failed.errorMessage,
        });
        return NextResponse.json({ course: failed }, { status: 202 });
      }
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        errorCode: "INTERNAL_ERROR",
        error: "Failed to create catalog generation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

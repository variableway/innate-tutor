import { NextResponse } from "next/server";
import type { TutorTurnClientRequestV0 } from "@innate/contracts";
import {
  assembleTrustedContext,
  TutorContextError,
} from "@innate/deeptutor-adapter";
import { loadArtifactByVersionId } from "@/lib/artifact-store";
import { getCourse } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Resolve scenes for Tutor Panel UI (trusted artifact metadata only). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const courseId = url.searchParams.get("courseId");
  const courseVersionIdParam = url.searchParams.get("courseVersionId");

  let courseVersionId = courseVersionIdParam;
  if (!courseVersionId && courseId) {
    const course = await getCourse(courseId);
    courseVersionId = course?.courseVersionId ?? null;
  }
  if (!courseVersionId) {
    // F4 golden fixture for Track B demos
    courseVersionId = "76267f4f-ed8d-4ebc-b8fc-2d22857082b9";
  }

  const artifact = await loadArtifactByVersionId(courseVersionId);
  if (!artifact) {
    return NextResponse.json(
      { error: "ARTIFACT_NOT_FOUND", courseVersionId },
      { status: 404 },
    );
  }

  return NextResponse.json({
    courseVersionId: artifact.courseVersionId,
    courseId: artifact.courseId,
    openmaicClassroomId: artifact.openmaicClassroomId,
    checksum: artifact.checksum,
    sceneIndex: artifact.sceneIndex,
    stageName:
      artifact.content?.stage &&
      typeof artifact.content.stage === "object" &&
      "name" in artifact.content.stage
        ? String((artifact.content.stage as { name?: unknown }).name ?? "")
        : "",
  });
}

/** Dry-run assembly: proves forged body is discarded (debug / contract). */
export async function POST(request: Request) {
  const body = (await request.json()) as TutorTurnClientRequestV0;
  const artifact = await loadArtifactByVersionId(body.courseVersionId);
  if (!artifact) {
    return NextResponse.json({ error: "ARTIFACT_NOT_FOUND" }, { status: 404 });
  }
  try {
    const ctx = assembleTrustedContext(artifact, body);
    return NextResponse.json({
      ok: true,
      trustedSceneTextChars: ctx.trustedSceneText.length,
      tools: ctx.tools,
      discardedForged:
        Boolean(body.forgedSceneBody || body.forgedCourseText) &&
        !ctx.trustedSceneText.includes(String(body.forgedSceneBody ?? "")) &&
        !ctx.trustedSceneText.includes(String(body.forgedCourseText ?? "")),
      sceneId: ctx.sceneId,
      courseVersionId: ctx.courseVersionId,
    });
  } catch (error) {
    if (error instanceof TutorContextError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}

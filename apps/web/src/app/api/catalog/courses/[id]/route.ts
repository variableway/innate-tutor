import { NextResponse } from "next/server";
import { getCourse } from "@/lib/db";
import { syncCourseFromOpenMaic } from "@/lib/sync-job";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const existing = await getCourse(id);
    if (!existing) {
      return NextResponse.json(
        { errorCode: "NOT_FOUND", error: "Course not found" },
        { status: 404 },
      );
    }

    if (
      existing.openmaicJobId &&
      (existing.status === "queued" || existing.status === "running")
    ) {
      const course = await syncCourseFromOpenMaic(id);
      return NextResponse.json({ course });
    }

    return NextResponse.json({ course: existing });
  } catch (error) {
    return NextResponse.json(
      {
        errorCode: "INTERNAL_ERROR",
        error: "Failed to load catalog course",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

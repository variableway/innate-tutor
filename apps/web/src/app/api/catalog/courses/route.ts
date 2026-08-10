import { NextResponse } from "next/server";
import { listCourses } from "@/lib/db";
import { syncCourseFromOpenMaic } from "@/lib/sync-job";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const courses = await listCourses();
    const synced = await Promise.all(
      courses.map(async (course) => {
        if (
          course.openmaicJobId &&
          (course.status === "queued" || course.status === "running")
        ) {
          try {
            return await syncCourseFromOpenMaic(course.id);
          } catch {
            return course;
          }
        }
        return course;
      }),
    );
    return NextResponse.json({ courses: synced });
  } catch (error) {
    return NextResponse.json(
      {
        errorCode: "INTERNAL_ERROR",
        error: "Failed to list catalog courses",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

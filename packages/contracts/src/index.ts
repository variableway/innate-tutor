export * from "./course-artifact.js";
export * from "./tutor-context.js";

export type CatalogCourseStatus = "queued" | "running" | "succeeded" | "failed";

export interface CatalogCourse {
  id: string;
  title: string;
  requirement: string;
  status: CatalogCourseStatus;
  openmaicJobId: string | null;
  openmaicCourseId: string | null;
  classroomUrl: string | null;
  model: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  progress: number | null;
  step: string | null;
  message: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  latencyMs: number | null;
  /** Immutable CourseArtifact courseVersionId when snapshotted. */
  courseVersionId: string | null;
  artifactId: string | null;
  artifactChecksum: string | null;
  artifactPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogGenerateRequest {
  requirement: string;
  title?: string;
  pdfContent?: string;
}

export interface CatalogGenerateResponse {
  course: CatalogCourse;
}

export interface CatalogListResponse {
  courses: CatalogCourse[];
}

export interface CatalogCourseResponse {
  course: CatalogCourse;
}

export interface CatalogGenerationEvent {
  id: string;
  courseId: string;
  status: CatalogCourseStatus;
  step: string | null;
  progress: number | null;
  message: string | null;
  rawError: string | null;
  createdAt: string;
}

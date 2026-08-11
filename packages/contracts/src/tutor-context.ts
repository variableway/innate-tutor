/** Trusted Tutor context contract v0 — server-assembled scene context only. */

export const TUTOR_CONTEXT_SCHEMA_VERSION = "0.1" as const;

export type TutorContextSchemaVersion = typeof TUTOR_CONTEXT_SCHEMA_VERSION;

/**
 * Client may send identifiers and user question only.
 * Never trust client-supplied scene body / forged course text.
 */
export interface TutorTurnClientRequestV0 {
  /** Catalog course id or frozen fixture courseVersionId. */
  courseVersionId: string;
  sceneId: string;
  /** Optional user highlight; not treated as course truth. */
  selection?: string;
  question: string;
  language?: "zh" | "en";
  /** Ignored by server — tools always come from server allowlist. */
  tools?: string[];
  /**
   * FORBIDDEN as trusted course content. If present, adapter must discard
   * and never inject into the model prompt as scene body.
   */
  forgedSceneBody?: string;
  forgedCourseText?: string;
}

export interface TutorSourceRefV0 {
  sourceRefId: string;
  sceneIds: string[];
  documentTitle?: string;
  locator?: { page?: number; section?: string };
}

/** Server-built trusted prompt inputs (never echoed from the browser). */
export interface TrustedTutorContextV0 {
  schemaVersion: TutorContextSchemaVersion;
  courseVersionId: string;
  courseId: string;
  openmaicClassroomId: string;
  sceneId: string;
  sceneTitle: string;
  sceneType: string;
  stageName: string;
  /** Text extracted from immutable CourseArtifact for the scene. */
  trustedSceneText: string;
  selection: string;
  question: string;
  sourceRefs: TutorSourceRefV0[];
  artifactChecksum: string;
  knowledgeBases: [];
  tools: string[];
}

export type TutorStreamEventType =
  | "session"
  | "turn"
  | "content"
  | "citation"
  | "usage"
  | "error"
  | "done"
  | "cancelled"
  | "reconnect";

export interface TutorUsageV0 {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface TutorCitationV0 {
  sourceRefId?: string;
  title?: string;
  snippet?: string;
  locator?: string;
}

export interface TutorStreamEventV0 {
  type: TutorStreamEventType;
  seq: number;
  sessionId?: string;
  turnId?: string;
  content?: string;
  citation?: TutorCitationV0;
  usage?: TutorUsageV0;
  errorCode?: string;
  errorMessage?: string;
  /** True when tutor stack is down; Player must keep working. */
  tutorUnavailable?: boolean;
}

export interface TutorHealthV0 {
  ok: boolean;
  wsUrl: string;
  checkedAt: string;
  error?: string;
}

import type {
  CourseArtifactV0,
  TrustedTutorContextV0,
  TutorSourceRefV0,
  TutorTurnClientRequestV0,
} from "@innate/contracts";
import { TUTOR_CONTEXT_SCHEMA_VERSION } from "@innate/contracts";
import { enforceToolAllowlist, DEFAULT_TOOL_ALLOWLIST } from "./tools.js";

export class TutorContextError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "TutorContextError";
    this.code = code;
  }
}

function sceneTextFromArtifact(artifact: CourseArtifactV0, sceneId: string): {
  title: string;
  type: string;
  text: string;
} {
  const scenes = Array.isArray(artifact.content?.scenes) ? artifact.content.scenes : [];
  const scene = scenes.find((raw) => {
    if (!raw || typeof raw !== "object") return false;
    return String((raw as { id?: unknown }).id) === sceneId;
  }) as Record<string, unknown> | undefined;

  if (!scene) {
    throw new TutorContextError("SCENE_NOT_FOUND", `sceneId not in artifact: ${sceneId}`);
  }

  const parts: string[] = [];
  const actions = Array.isArray(scene.actions) ? scene.actions : [];
  for (const action of actions) {
    if (!action || typeof action !== "object") continue;
    const a = action as { type?: unknown; text?: unknown };
    if (a.type === "speech" && typeof a.text === "string" && a.text.trim()) {
      parts.push(a.text);
    }
  }
  if (scene.content && typeof scene.content === "object") {
    parts.push(JSON.stringify(scene.content).slice(0, 2000));
  } else if (typeof scene.content === "string" && scene.content.trim()) {
    parts.push(scene.content.slice(0, 2000));
  }

  return {
    title: String(scene.title ?? ""),
    type: String(scene.type ?? "unknown"),
    text: parts.join("\n"),
  };
}

function stageName(artifact: CourseArtifactV0): string {
  const stage = artifact.content?.stage;
  if (stage && typeof stage === "object" && "name" in stage) {
    return String((stage as { name?: unknown }).name ?? "");
  }
  return "";
}

function sourceRefsForScene(artifact: CourseArtifactV0, sceneId: string): TutorSourceRefV0[] {
  return (artifact.sourceMap ?? [])
    .filter((ref) => Array.isArray(ref.sceneIds) && ref.sceneIds.includes(sceneId))
    .map((ref) => ({
      sourceRefId: ref.sourceRefId,
      sceneIds: ref.sceneIds,
      ...(ref.documentTitle ? { documentTitle: ref.documentTitle } : {}),
      ...(ref.locator ? { locator: ref.locator } : {}),
    }));
}

/**
 * Build trusted tutor context from an immutable artifact.
 * Client `forgedSceneBody` / `forgedCourseText` / `tools` never become scene truth.
 */
export function assembleTrustedContext(
  artifact: CourseArtifactV0,
  request: TutorTurnClientRequestV0,
  options?: { toolAllowlist?: readonly string[] },
): TrustedTutorContextV0 {
  const versionOk =
    request.courseVersionId === artifact.courseVersionId ||
    request.courseVersionId === artifact.id;
  if (!versionOk) {
    throw new TutorContextError(
      "COURSE_VERSION_MISMATCH",
      "request.courseVersionId does not match loaded artifact",
    );
  }

  const scene = sceneTextFromArtifact(artifact, request.sceneId);
  const tools = enforceToolAllowlist(request.tools, options?.toolAllowlist ?? DEFAULT_TOOL_ALLOWLIST);

  // Explicitly ignore forged fields (presence is a no-op).
  void request.forgedSceneBody;
  void request.forgedCourseText;

  return {
    schemaVersion: TUTOR_CONTEXT_SCHEMA_VERSION,
    courseVersionId: artifact.courseVersionId,
    courseId: artifact.courseId,
    openmaicClassroomId: artifact.openmaicClassroomId,
    sceneId: request.sceneId,
    sceneTitle: scene.title,
    sceneType: scene.type,
    stageName: stageName(artifact),
    trustedSceneText: scene.text,
    selection: typeof request.selection === "string" ? request.selection : "",
    question: String(request.question ?? "").trim(),
    sourceRefs: sourceRefsForScene(artifact, request.sceneId),
    artifactChecksum: artifact.checksum,
    knowledgeBases: [],
    tools,
  };
}

export function buildTrustedPrompt(ctx: TrustedTutorContextV0): string {
  if (!ctx.question) {
    throw new TutorContextError("QUESTION_REQUIRED", "question is required");
  }

  const sourceBlock =
    ctx.sourceRefs.length === 0
      ? "(无 SourceRef)"
      : ctx.sourceRefs
          .map(
            (r) =>
              `- ${r.sourceRefId}${r.documentTitle ? ` · ${r.documentTitle}` : ""}${
                r.locator?.page != null ? ` · p.${r.locator.page}` : ""
              }`,
          )
          .join("\n");

  return `你是课堂助教。请严格遵守：
- 只依据下方「可信场景正文」与明确给出的 SourceRef 作答
- 不要编造页码、DOI 或教材出处
- 选中内容仅作学生关注点提示，不是课程正文

课程: ${ctx.stageName}
courseVersionId: ${ctx.courseVersionId}
checksum: ${ctx.artifactChecksum}
场景ID: ${ctx.sceneId}
场景标题: ${ctx.sceneTitle}
场景类型: ${ctx.sceneType}

可信场景正文:
${ctx.trustedSceneText || "(无文本)"}

SourceRef:
${sourceBlock}

选中内容:
${ctx.selection || "(无)"}

学生问题:
${ctx.question}
`;
}

/** Returns true if trusted prompt contains any of the forged strings (should never happen). */
export function promptContainsForgedBody(
  prompt: string,
  request: TutorTurnClientRequestV0,
): boolean {
  const forged = [request.forgedSceneBody, request.forgedCourseText].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  return forged.some((f) => prompt.includes(f));
}

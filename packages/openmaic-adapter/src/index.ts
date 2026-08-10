export { collectAssetRefs } from "./assets.js";
export { canonicalJson, sortKeysDeep } from "./canonical-json.js";
export {
  checksumClassroomContent,
  packageCourseArtifact,
  sha256Hex,
  type OpenMaicClassroomSnapshot,
  type PackageArtifactInput,
} from "./package-artifact.js";
export { validateCourseArtifact } from "./validate-artifact.js";
import type { OpenMaicClassroomSnapshot } from "./package-artifact.js";

export type OpenMaicJobStatus = "queued" | "running" | "succeeded" | "failed";

export interface CreateClassroomJobInput {
  requirement: string;
  pdfContent?: string;
  enableWebSearch?: boolean;
  enableImageGeneration?: boolean;
  enableVideoGeneration?: boolean;
  enableTTS?: boolean;
}

export interface CreateClassroomJobResult {
  jobId: string;
  status: OpenMaicJobStatus;
  step: string;
  message: string;
  pollUrl: string;
  pollIntervalMs: number;
}

export interface ClassroomJobResult {
  classroomId: string;
  url: string;
  scenesCount: number;
}

export interface ClassroomJobSnapshot {
  jobId: string;
  status: OpenMaicJobStatus;
  step: string;
  progress: number;
  message: string;
  pollUrl: string;
  pollIntervalMs: number;
  scenesGenerated: number;
  totalScenes?: number;
  result?: ClassroomJobResult;
  error?: string;
  done: boolean;
}

export class OpenMaicAdapterError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: string;

  constructor(code: string, message: string, status = 502, details?: string) {
    super(message);
    this.name = "OpenMaicAdapterError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface OpenMaicAdapterOptions {
  /** Server-side base URL, e.g. http://openmaic:3000 */
  baseUrl: string;
  /** Browser-facing base URL for classroom links, e.g. http://localhost:3000 */
  publicBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function buildClassroomUrl(publicBaseUrl: string, courseId: string): string {
  return `${trimSlash(publicBaseUrl)}/classroom/${encodeURIComponent(courseId)}`;
}

export function createOpenMaicAdapter(options: OpenMaicAdapterOptions) {
  const baseUrl = trimSlash(options.baseUrl);
  const publicBaseUrl = trimSlash(options.publicBaseUrl ?? options.baseUrl);
  const fetchImpl = options.fetchImpl ?? fetch;

  async function parseJson(res: Response): Promise<Record<string, unknown>> {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new OpenMaicAdapterError(
        "OPENMAIC_INVALID_JSON",
        `OpenMAIC returned non-JSON (HTTP ${res.status})`,
        res.status || 502,
      );
    }
    if (!body || typeof body !== "object") {
      throw new OpenMaicAdapterError(
        "OPENMAIC_INVALID_JSON",
        `OpenMAIC returned unexpected payload (HTTP ${res.status})`,
        res.status || 502,
      );
    }
    return body as Record<string, unknown>;
  }

  async function createClassroomJob(
    input: CreateClassroomJobInput,
  ): Promise<CreateClassroomJobResult> {
    let res: Response;
    try {
      res = await fetchImpl(`${baseUrl}/api/generate-classroom`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requirement: input.requirement,
          ...(input.pdfContent ? { pdfContent: input.pdfContent } : {}),
          enableWebSearch: input.enableWebSearch ?? false,
          enableImageGeneration: input.enableImageGeneration ?? false,
          enableVideoGeneration: input.enableVideoGeneration ?? false,
          enableTTS: input.enableTTS ?? false,
        }),
      });
    } catch (error) {
      throw new OpenMaicAdapterError(
        "OPENMAIC_UNAVAILABLE",
        "Failed to reach OpenMAIC generate-classroom",
        503,
        error instanceof Error ? error.message : String(error),
      );
    }

    const body = await parseJson(res);
    if (!res.ok || body.success === false) {
      throw new OpenMaicAdapterError(
        String(body.errorCode ?? "OPENMAIC_GENERATE_FAILED"),
        String(body.error ?? `OpenMAIC generate failed (HTTP ${res.status})`),
        res.status || 502,
        typeof body.details === "string" ? body.details : undefined,
      );
    }

    return {
      jobId: String(body.jobId),
      status: body.status as OpenMaicJobStatus,
      step: String(body.step ?? "queued"),
      message: String(body.message ?? ""),
      pollUrl: String(body.pollUrl ?? `${baseUrl}/api/generate-classroom/${body.jobId}`),
      pollIntervalMs: Number(body.pollIntervalMs ?? 5000),
    };
  }

  async function getClassroom(classroomId: string): Promise<OpenMaicClassroomSnapshot> {
    let res: Response;
    try {
      res = await fetchImpl(
        `${baseUrl}/api/classroom?id=${encodeURIComponent(classroomId)}`,
        {
          method: "GET",
          headers: { accept: "application/json" },
        },
      );
    } catch (error) {
      throw new OpenMaicAdapterError(
        "OPENMAIC_UNAVAILABLE",
        "Failed to reach OpenMAIC classroom API",
        503,
        error instanceof Error ? error.message : String(error),
      );
    }

    const body = await parseJson(res);
    if (!res.ok || body.success === false) {
      throw new OpenMaicAdapterError(
        String(body.errorCode ?? "OPENMAIC_CLASSROOM_FAILED"),
        String(body.error ?? `OpenMAIC classroom fetch failed (HTTP ${res.status})`),
        res.status || 502,
        typeof body.details === "string" ? body.details : undefined,
      );
    }

    const classroom = body.classroom as Record<string, unknown> | undefined;
    if (!classroom || typeof classroom !== "object") {
      throw new OpenMaicAdapterError(
        "OPENMAIC_CLASSROOM_INVALID",
        "OpenMAIC classroom payload missing classroom object",
        502,
      );
    }
    if (!Array.isArray(classroom.scenes)) {
      throw new OpenMaicAdapterError(
        "OPENMAIC_CLASSROOM_INVALID",
        "OpenMAIC classroom payload missing scenes[]",
        502,
      );
    }

    return {
      id: String(classroom.id ?? classroomId),
      stage: classroom.stage,
      scenes: classroom.scenes,
      createdAt: typeof classroom.createdAt === "string" ? classroom.createdAt : undefined,
    };
  }

  async function getClassroomJob(jobId: string): Promise<ClassroomJobSnapshot> {
    let res: Response;
    try {
      res = await fetchImpl(`${baseUrl}/api/generate-classroom/${encodeURIComponent(jobId)}`, {
        method: "GET",
        headers: { accept: "application/json" },
      });
    } catch (error) {
      throw new OpenMaicAdapterError(
        "OPENMAIC_UNAVAILABLE",
        "Failed to reach OpenMAIC job status",
        503,
        error instanceof Error ? error.message : String(error),
      );
    }

    const body = await parseJson(res);
    if (!res.ok || body.success === false) {
      throw new OpenMaicAdapterError(
        String(body.errorCode ?? "OPENMAIC_POLL_FAILED"),
        String(body.error ?? `OpenMAIC poll failed (HTTP ${res.status})`),
        res.status || 502,
        typeof body.details === "string" ? body.details : undefined,
      );
    }

    const resultRaw = body.result as ClassroomJobResult | undefined;
    const result =
      resultRaw && typeof resultRaw.classroomId === "string"
        ? {
            classroomId: resultRaw.classroomId,
            url: resultRaw.url || buildClassroomUrl(publicBaseUrl, resultRaw.classroomId),
            scenesCount: Number(resultRaw.scenesCount ?? 0),
          }
        : undefined;

    return {
      jobId: String(body.jobId ?? jobId),
      status: body.status as OpenMaicJobStatus,
      step: String(body.step ?? ""),
      progress: Number(body.progress ?? 0),
      message: String(body.message ?? ""),
      pollUrl: String(body.pollUrl ?? `${baseUrl}/api/generate-classroom/${jobId}`),
      pollIntervalMs: Number(body.pollIntervalMs ?? 5000),
      scenesGenerated: Number(body.scenesGenerated ?? 0),
      totalScenes:
        body.totalScenes === undefined || body.totalScenes === null
          ? undefined
          : Number(body.totalScenes),
      result,
      error: typeof body.error === "string" ? body.error : undefined,
      done: Boolean(
        body.done ?? (body.status === "succeeded" || body.status === "failed"),
      ),
    };
  }

  return {
    baseUrl,
    publicBaseUrl,
    createClassroomJob,
    getClassroom,
    getClassroomJob,
    buildClassroomUrl: (courseId: string) => buildClassroomUrl(publicBaseUrl, courseId),
  };
}

export type OpenMaicAdapter = ReturnType<typeof createOpenMaicAdapter>;

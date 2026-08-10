import { createHash, randomUUID } from "node:crypto";
import type {
  CourseArtifactSceneIndexEntryV0,
  CourseArtifactV0,
} from "@innate/contracts";
import { COURSE_ARTIFACT_SCHEMA_VERSION } from "@innate/contracts";
import { collectAssetRefs } from "./assets.js";
import { canonicalJson } from "./canonical-json.js";

export interface OpenMaicClassroomSnapshot {
  id: string;
  stage: unknown;
  scenes: unknown[];
  createdAt?: string;
}

export interface PackageArtifactInput {
  classroom: OpenMaicClassroomSnapshot;
  catalogCourseId: string;
  openmaicJobId?: string | null;
  model?: string | null;
  requirement?: string | null;
  generatedAt?: string | null;
  /** Destination relative path under repo, e.g. fixtures/course-artifacts/<id> */
  packageRelativePath: string;
  openmaicAppVersion?: string;
  upstreamCommit?: string;
  adapterVersion?: string;
  artifactId?: string;
  courseVersionId?: string;
  snapshottedAt?: string;
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function checksumClassroomContent(stage: unknown, scenes: unknown[]): string {
  return sha256Hex(canonicalJson({ stage, scenes }));
}

function buildSceneIndex(scenes: unknown[]): CourseArtifactSceneIndexEntryV0[] {
  return scenes.map((raw, index) => {
    const scene = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      sceneId: String(scene.id ?? `scene_${index}`),
      type: String(scene.type ?? "unknown"),
      title: String(scene.title ?? ""),
      order: typeof scene.order === "number" ? scene.order : index,
    };
  });
}

export function packageCourseArtifact(input: PackageArtifactInput): CourseArtifactV0 {
  const artifactId = input.artifactId ?? randomUUID();
  const courseVersionId = input.courseVersionId ?? artifactId;
  const snapshottedAt = input.snapshottedAt ?? new Date().toISOString();
  const stage = input.classroom.stage;
  const scenes = Array.isArray(input.classroom.scenes) ? input.classroom.scenes : [];
  const checksum = checksumClassroomContent(stage, scenes);
  const requirementHash = input.requirement
    ? sha256Hex(input.requirement)
    : undefined;

  return {
    artifactSchemaVersion: COURSE_ARTIFACT_SCHEMA_VERSION,
    id: artifactId,
    courseId: input.catalogCourseId,
    courseVersionId,
    openmaicClassroomId: input.classroom.id,
    renderer: {
      kind: "openmaic",
      appVersion: input.openmaicAppVersion ?? "0.3.1",
      ...(input.upstreamCommit ? { upstreamCommit: input.upstreamCommit } : {}),
      classroomZipFormatVersion: 1,
      adapterVersion: input.adapterVersion ?? "0.0.1",
    },
    content: { stage, scenes },
    sceneIndex: buildSceneIndex(scenes),
    assetManifest: collectAssetRefs({ stage, scenes }),
    sourceMap: [],
    generationManifest: {
      catalogCourseId: input.catalogCourseId,
      openmaicJobId: input.openmaicJobId ?? null,
      model: input.model ?? null,
      ...(requirementHash ? { requirementHash } : {}),
      generatedAt: input.generatedAt ?? input.classroom.createdAt ?? null,
      snapshottedAt,
    },
    package: {
      kind: "classroom-json+media",
      relativePath: input.packageRelativePath.replace(/\\/g, "/"),
      formatVersion: 1,
    },
    checksum,
  };
}

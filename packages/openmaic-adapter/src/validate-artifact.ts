import type {
  ArtifactValidationIssue,
  ArtifactValidationReport,
  CourseArtifactV0,
} from "@innate/contracts";
import { COURSE_ARTIFACT_SCHEMA_VERSION } from "@innate/contracts";
import { checksumClassroomContent } from "./package-artifact.js";

function issue(
  code: string,
  severity: ArtifactValidationIssue["severity"],
  message: string,
  path?: string,
): ArtifactValidationIssue {
  return { code, severity, message, ...(path ? { path } : {}) };
}

/** Validate CourseArtifact v0 envelope + content/asset rules. */
export function validateCourseArtifact(artifact: CourseArtifactV0): ArtifactValidationReport {
  const issues: ArtifactValidationIssue[] = [];
  const checkedAt = new Date().toISOString();

  if (artifact.artifactSchemaVersion !== COURSE_ARTIFACT_SCHEMA_VERSION) {
    issues.push(
      issue(
        "SCHEMA_VERSION",
        "error",
        `Expected artifactSchemaVersion ${COURSE_ARTIFACT_SCHEMA_VERSION}, got ${artifact.artifactSchemaVersion}`,
      ),
    );
  }

  if (!artifact.openmaicClassroomId) {
    issues.push(issue("MISSING_CLASSROOM_ID", "error", "openmaicClassroomId is required"));
  }
  if (!artifact.courseId) {
    issues.push(issue("MISSING_COURSE_ID", "error", "courseId is required"));
  }
  if (!artifact.courseVersionId) {
    issues.push(issue("MISSING_COURSE_VERSION_ID", "error", "courseVersionId is required"));
  }

  const stage = artifact.content?.stage;
  const scenes = artifact.content?.scenes;
  if (!stage || typeof stage !== "object") {
    issues.push(issue("MISSING_STAGE", "error", "content.stage is required", "content.stage"));
  }
  if (!Array.isArray(scenes) || scenes.length === 0) {
    issues.push(
      issue("MISSING_SCENES", "error", "content.scenes must be a non-empty array", "content.scenes"),
    );
  } else {
    scenes.forEach((raw, index) => {
      const scene = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      if (!scene.id) {
        issues.push(
          issue("SCENE_MISSING_ID", "error", "scene.id is required", `content.scenes[${index}]`),
        );
      }
      if (!scene.type) {
        issues.push(
          issue(
            "SCENE_MISSING_TYPE",
            "error",
            "scene.type is required",
            `content.scenes[${index}]`,
          ),
        );
      }
      if (typeof scene.title !== "string" || !scene.title.trim()) {
        issues.push(
          issue(
            "SCENE_MISSING_TITLE",
            "error",
            "scene.title is required",
            `content.scenes[${index}]`,
          ),
        );
      }
    });
  }

  if (Array.isArray(scenes) && stage) {
    const expected = checksumClassroomContent(stage, scenes);
    if (artifact.checksum !== expected) {
      issues.push(
        issue(
          "CHECKSUM_MISMATCH",
          "error",
          `checksum mismatch (expected ${expected}, got ${artifact.checksum})`,
          "checksum",
        ),
      );
    }
  }

  for (const asset of artifact.assetManifest ?? []) {
    if (asset.missing) {
      issues.push(
        issue("ASSET_MISSING", "warning", `Asset marked missing: ${asset.path}`, asset.path),
      );
    }
    if (asset.kind === "remote" || asset.path.startsWith("http://") || asset.path.startsWith("https://")) {
      issues.push(
        issue(
          "REMOTE_ASSET",
          "warning",
          `Remote asset URL not archived: ${asset.path}`,
          asset.path,
        ),
      );
    }
    if (/<script[\s>]/i.test(asset.path) || /javascript:/i.test(asset.path)) {
      issues.push(
        issue(
          "INTERACTIVE_EXTERNAL",
          "warning",
          "Interactive/script-like asset ref detected",
          asset.path,
        ),
      );
    }
  }

  if (!artifact.sceneIndex?.length && Array.isArray(scenes) && scenes.length > 0) {
    issues.push(
      issue("EMPTY_SCENE_INDEX", "warning", "sceneIndex is empty while scenes exist", "sceneIndex"),
    );
  }

  const ok = !issues.some((i) => i.severity === "error");
  return {
    ok,
    artifactId: artifact.id,
    courseVersionId: artifact.courseVersionId,
    checkedAt,
    issues,
  };
}

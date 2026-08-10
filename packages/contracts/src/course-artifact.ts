/** CourseArtifact v0 — slim immutable envelope for Track A F4 / Track B fixtures. */

export const COURSE_ARTIFACT_SCHEMA_VERSION = "0.1" as const;

export type CourseArtifactSchemaVersion = typeof COURSE_ARTIFACT_SCHEMA_VERSION;

export type CourseArtifactPackageKind =
  | "classroom-json+media"
  | "maic.zip"
  | "directory";

export type CourseArtifactAssetKind =
  | "audio"
  | "image"
  | "generated"
  | "remote"
  | "interactive-inline"
  | "unknown";

export interface CourseArtifactRendererV0 {
  kind: "openmaic";
  appVersion: string;
  upstreamCommit?: string;
  /** Mirrors OpenMAIC CLASSROOM_ZIP_FORMAT_VERSION when packaging as zip. */
  classroomZipFormatVersion: number;
  adapterVersion: string;
}

export interface CourseArtifactSceneIndexEntryV0 {
  sceneId: string;
  type: string;
  title: string;
  order: number;
}

export interface CourseArtifactAssetRefV0 {
  path: string;
  kind: CourseArtifactAssetKind;
  mimeType?: string;
  size?: number;
  missing?: boolean;
  checksum?: string;
}

export interface CourseArtifactSourceRefV0 {
  sourceRefId: string;
  sceneIds: string[];
  documentTitle?: string;
  locator?: { page?: number; section?: string };
}

export interface CourseArtifactGenerationManifestV0 {
  catalogCourseId: string;
  openmaicJobId?: string | null;
  model?: string | null;
  requirementHash?: string;
  generatedAt?: string | null;
  snapshottedAt: string;
}

export interface CourseArtifactPackageV0 {
  kind: CourseArtifactPackageKind;
  /** Repo- or storage-relative path to the package root / zip. */
  relativePath: string;
  formatVersion: number;
}

export interface CourseArtifactContentV0 {
  stage: unknown;
  scenes: unknown[];
}

/**
 * Immutable CourseArtifact v0 envelope.
 * `checksum` covers canonical classroom content (`stage` + `scenes` only).
 */
export interface CourseArtifactV0 {
  artifactSchemaVersion: CourseArtifactSchemaVersion;
  id: string;
  courseId: string;
  courseVersionId: string;
  openmaicClassroomId: string;
  renderer: CourseArtifactRendererV0;
  content: CourseArtifactContentV0;
  sceneIndex: CourseArtifactSceneIndexEntryV0[];
  assetManifest: CourseArtifactAssetRefV0[];
  sourceMap: CourseArtifactSourceRefV0[];
  generationManifest: CourseArtifactGenerationManifestV0;
  package: CourseArtifactPackageV0;
  checksum: string;
}

export type ArtifactValidationSeverity = "error" | "warning" | "info";

export interface ArtifactValidationIssue {
  code: string;
  severity: ArtifactValidationSeverity;
  message: string;
  path?: string;
}

export interface ArtifactValidationReport {
  ok: boolean;
  artifactId: string;
  courseVersionId: string;
  checkedAt: string;
  issues: ArtifactValidationIssue[];
}

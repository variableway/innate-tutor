import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CourseArtifactV0 } from "@innate/contracts";
import {
  packageCourseArtifact,
  validateCourseArtifact,
  type OpenMaicClassroomSnapshot,
} from "@innate/openmaic-adapter";

export function getArtifactStoreDir(): string {
  return (
    process.env.ARTIFACT_STORE_DIR?.trim() ||
    path.resolve(process.cwd(), "data", "course-artifacts")
  );
}

export async function persistCourseArtifact(input: {
  classroom: OpenMaicClassroomSnapshot;
  catalogCourseId: string;
  openmaicJobId?: string | null;
  model?: string | null;
  requirement?: string | null;
  generatedAt?: string | null;
}): Promise<{
  artifact: CourseArtifactV0;
  absoluteDir: string;
  relativePath: string;
}> {
  const storeDir = getArtifactStoreDir();
  // Temporary id folder; rewrite after packaging with artifact id.
  const tmpId = input.catalogCourseId;
  const relativePath = path.join("data", "course-artifacts", tmpId).replace(/\\/g, "/");

  const artifact = packageCourseArtifact({
    classroom: input.classroom,
    catalogCourseId: input.catalogCourseId,
    openmaicJobId: input.openmaicJobId,
    model: input.model,
    requirement: input.requirement,
    generatedAt: input.generatedAt,
    packageRelativePath: relativePath,
  });

  const absoluteDir = path.join(storeDir, artifact.id);
  await mkdir(absoluteDir, { recursive: true });
  const finalRelative = path.join("data", "course-artifacts", artifact.id).replace(/\\/g, "/");
  const finalized: CourseArtifactV0 = {
    ...artifact,
    package: { ...artifact.package, relativePath: finalRelative },
  };

  const report = validateCourseArtifact(finalized);
  await writeFile(
    path.join(absoluteDir, "artifact.json"),
    JSON.stringify(finalized, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(absoluteDir, "validation.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(absoluteDir, "classroom.json"),
    JSON.stringify(
      {
        id: input.classroom.id,
        stage: input.classroom.stage,
        scenes: input.classroom.scenes,
        createdAt: input.classroom.createdAt,
      },
      null,
      2,
    ),
    "utf8",
  );

  return { artifact: finalized, absoluteDir, relativePath: finalRelative };
}

export async function loadArtifactByVersionId(
  courseVersionId: string,
): Promise<CourseArtifactV0 | null> {
  const { readFile } = await import("node:fs/promises");
  const candidates = [
    path.join(getArtifactStoreDir(), courseVersionId, "artifact.json"),
    path.resolve(process.cwd(), "fixtures", "course-artifacts", courseVersionId, "artifact.json"),
    // Monorepo root when cwd is apps/web
    path.resolve(
      process.cwd(),
      "..",
      "..",
      "fixtures",
      "course-artifacts",
      courseVersionId,
      "artifact.json",
    ),
    // Docker runner copies fixtures to /app/fixtures
    path.resolve("/app/fixtures/course-artifacts", courseVersionId, "artifact.json"),
  ];
  for (const candidate of candidates) {
    try {
      const raw = await readFile(candidate, "utf8");
      return JSON.parse(raw) as CourseArtifactV0;
    } catch {
      /* try next */
    }
  }
  return null;
}

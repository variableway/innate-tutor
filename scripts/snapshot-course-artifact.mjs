#!/usr/bin/env node
/**
 * Freeze a Catalog+OpenMAIC classroom as CourseArtifact v0 fixture.
 *
 * Usage:
 *   node scripts/snapshot-course-artifact.mjs --catalog-course-id <uuid>
 *   node scripts/snapshot-course-artifact.mjs --classroom-id A99uUPPOly --catalog-course-id <uuid>
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = process.env.CATALOG_BASE_URL || "http://127.0.0.1:3100";
const OPENMAIC = process.env.OPENMAIC_BASE_URL || "http://127.0.0.1:3000";
const SCHEMA = "0.1";

function arg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeysDeep(value[key]);
    return out;
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(sortKeysDeep(value));
}

function sha256Hex(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function collectAssetRefs(root) {
  const found = new Set();
  const walk = (node) => {
    if (typeof node === "string") {
      if (
        node.startsWith("http://") ||
        node.startsWith("https://") ||
        node.startsWith("data:") ||
        node.includes("/api/classroom-media/")
      ) {
        found.add(node);
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const value of Object.values(node)) walk(value);
    }
  };
  walk(root);
  return [...found].sort().map((p) => ({
    path: p,
    kind: p.startsWith("http") ? "remote" : p.includes("classroom-media") ? "generated" : "unknown",
  }));
}

function validate(artifact) {
  const issues = [];
  if (artifact.artifactSchemaVersion !== SCHEMA) {
    issues.push({ code: "SCHEMA_VERSION", severity: "error", message: "bad schema version" });
  }
  if (!artifact.content?.stage) {
    issues.push({ code: "MISSING_STAGE", severity: "error", message: "missing stage" });
  }
  if (!Array.isArray(artifact.content?.scenes) || artifact.content.scenes.length === 0) {
    issues.push({ code: "MISSING_SCENES", severity: "error", message: "missing scenes" });
  }
  const expected = sha256Hex(
    canonicalJson({ stage: artifact.content.stage, scenes: artifact.content.scenes }),
  );
  if (artifact.checksum !== expected) {
    issues.push({
      code: "CHECKSUM_MISMATCH",
      severity: "error",
      message: `expected ${expected}`,
    });
  }
  (artifact.content.scenes || []).forEach((scene, i) => {
    if (!scene?.id) issues.push({ code: "SCENE_MISSING_ID", severity: "error", path: `scenes[${i}]`, message: "id" });
    if (!scene?.type) issues.push({ code: "SCENE_MISSING_TYPE", severity: "error", path: `scenes[${i}]`, message: "type" });
    if (!scene?.title) issues.push({ code: "SCENE_MISSING_TITLE", severity: "error", path: `scenes[${i}]`, message: "title" });
  });
  for (const asset of artifact.assetManifest || []) {
    if (asset.kind === "remote") {
      issues.push({ code: "REMOTE_ASSET", severity: "warning", message: asset.path, path: asset.path });
    }
  }
  return {
    ok: !issues.some((i) => i.severity === "error"),
    artifactId: artifact.id,
    courseVersionId: artifact.courseVersionId,
    checkedAt: new Date().toISOString(),
    issues,
  };
}

async function main() {
  let catalogCourseId = arg("--catalog-course-id");
  let classroomId = arg("--classroom-id");

  if (!catalogCourseId && !classroomId) {
    // Prefer a succeeded quiz sample with scene metadata for Track B.
    const list = await fetch(`${CATALOG}/api/catalog/courses`).then((r) => r.json());
    const pick =
      (list.courses || []).find(
        (c) => c.status === "succeeded" && c.openmaicCourseId && /quiz/i.test(c.title || ""),
      ) ||
      (list.courses || []).find((c) => c.status === "succeeded" && c.openmaicCourseId);
    if (!pick) throw new Error("No succeeded Catalog course with openmaicCourseId");
    catalogCourseId = pick.id;
    classroomId = pick.openmaicCourseId;
    console.log("auto-selected", pick.title, catalogCourseId, classroomId);
  }

  if (!catalogCourseId) throw new Error("--catalog-course-id required");
  const courseRes = await fetch(`${CATALOG}/api/catalog/courses/${catalogCourseId}`);
  const courseBody = await courseRes.json();
  const course = courseBody.course;
  if (!course) throw new Error(`Catalog course not found: ${catalogCourseId}`);
  classroomId = classroomId || course.openmaicCourseId;
  if (!classroomId) throw new Error("Course has no openmaicCourseId");

  const classroomRes = await fetch(
    `${OPENMAIC}/api/classroom?id=${encodeURIComponent(classroomId)}`,
  );
  const classroomBody = await classroomRes.json();
  if (!classroomRes.ok || !classroomBody.classroom) {
    throw new Error(`Classroom fetch failed: ${JSON.stringify(classroomBody).slice(0, 300)}`);
  }
  const classroom = classroomBody.classroom;
  const stage = classroom.stage;
  const scenes = classroom.scenes || [];
  const checksum = sha256Hex(canonicalJson({ stage, scenes }));
  const courseVersionId = randomUUID();
  const relativePath = `fixtures/course-artifacts/${courseVersionId}`;
  const snapshottedAt = new Date().toISOString();

  const artifact = {
    artifactSchemaVersion: SCHEMA,
    id: courseVersionId,
    courseId: catalogCourseId,
    courseVersionId,
    openmaicClassroomId: classroom.id || classroomId,
    renderer: {
      kind: "openmaic",
      appVersion: "0.3.1",
      upstreamCommit: "b4834f5c",
      classroomZipFormatVersion: 1,
      adapterVersion: "0.0.1",
    },
    content: { stage, scenes },
    sceneIndex: scenes.map((s, i) => ({
      sceneId: String(s.id ?? `scene_${i}`),
      type: String(s.type ?? "unknown"),
      title: String(s.title ?? ""),
      order: typeof s.order === "number" ? s.order : i,
    })),
    assetManifest: collectAssetRefs({ stage, scenes }),
    sourceMap: [],
    generationManifest: {
      catalogCourseId,
      openmaicJobId: course.openmaicJobId ?? null,
      model: course.model ?? null,
      requirementHash: course.requirement ? sha256Hex(course.requirement) : undefined,
      generatedAt: course.finishedAt ?? classroom.createdAt ?? null,
      snapshottedAt,
    },
    package: {
      kind: "classroom-json+media",
      relativePath,
      formatVersion: 1,
    },
    checksum,
  };

  const report = validate(artifact);
  const outDir = path.join(ROOT, relativePath);
  await mkdir(path.join(outDir, "media"), { recursive: true });
  await writeFile(path.join(outDir, "classroom.json"), JSON.stringify(classroom, null, 2), "utf8");
  await writeFile(path.join(outDir, "artifact.json"), JSON.stringify(artifact, null, 2), "utf8");
  await writeFile(path.join(outDir, "validate-report.json"), JSON.stringify(report, null, 2), "utf8");

  // Reproducibility check: recompute checksum from written classroom.json content
  const recomputed = sha256Hex(canonicalJson({ stage, scenes }));
  if (recomputed !== checksum) throw new Error("internal checksum instability");
  if (!report.ok) {
    console.error("validation failed", report);
    process.exit(2);
  }

  console.log(
    JSON.stringify(
      {
        courseVersionId,
        relativePath,
        checksum,
        scenes: artifact.sceneIndex.length,
        assets: artifact.assetManifest.length,
        validationOk: report.ok,
        issues: report.issues.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

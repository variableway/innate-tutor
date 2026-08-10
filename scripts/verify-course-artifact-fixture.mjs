import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const id = process.argv[2] || "76267f4f-ed8d-4ebc-b8fc-2d22857082b9";
const dir = path.join(ROOT, "fixtures/course-artifacts", id);

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeysDeep(value[key]);
    return out;
  }
  return value;
}

const art = JSON.parse(await readFile(path.join(dir, "artifact.json"), "utf8"));
const cls = JSON.parse(await readFile(path.join(dir, "classroom.json"), "utf8"));
const report = JSON.parse(await readFile(path.join(dir, "validate-report.json"), "utf8"));
const checksum = createHash("sha256")
  .update(JSON.stringify(sortKeysDeep({ stage: cls.stage, scenes: cls.scenes })), "utf8")
  .digest("hex");

const summary = {
  courseVersionId: art.courseVersionId,
  checksumMatch: checksum === art.checksum,
  reportOk: report.ok,
  scenes: art.sceneIndex.length,
  sceneTypes: art.sceneIndex.map((s) => s.type),
};
console.log(JSON.stringify(summary, null, 2));
if (!summary.checksumMatch || !summary.reportOk) process.exit(2);

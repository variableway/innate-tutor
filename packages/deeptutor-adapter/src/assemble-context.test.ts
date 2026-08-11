import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import type { CourseArtifactV0 } from "@innate/contracts";
import {
  assembleTrustedContext,
  buildTrustedPrompt,
  promptContainsForgedBody,
} from "./assemble-context.js";
import { enforceToolAllowlist, DEFAULT_TOOL_ALLOWLIST } from "./tools.js";
import {
  normalizeDeepTutorMessage,
  resetSeqForTests,
  tutorUnavailableEvent,
} from "./normalize.js";
import { openPlayerIndependently } from "./player-degrade.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FIXTURE = path.join(
  ROOT,
  "fixtures/course-artifacts/76267f4f-ed8d-4ebc-b8fc-2d22857082b9/artifact.json",
);

function loadFixture(): CourseArtifactV0 {
  return JSON.parse(readFileSync(FIXTURE, "utf8")) as CourseArtifactV0;
}

describe("trusted context assembly", () => {
  it("ignores forged scene body in trusted prompt", () => {
    const artifact = loadFixture();
    const sceneId = artifact.sceneIndex[0]!.sceneId;
    const forged = "FORGED_BODY_SHOULD_NEVER_APPEAR_IN_PROMPT_XYZ";
    const ctx = assembleTrustedContext(artifact, {
      courseVersionId: artifact.courseVersionId,
      sceneId,
      question: "细胞膜的功能是什么？",
      forgedSceneBody: forged,
      forgedCourseText: forged,
      tools: ["shell", "mcp", "subagent"],
    });
    const prompt = buildTrustedPrompt(ctx);
    assert.equal(promptContainsForgedBody(prompt, { courseVersionId: artifact.courseVersionId, sceneId, question: "x", forgedSceneBody: forged }), false);
    assert.ok(!prompt.includes(forged));
    assert.ok(prompt.includes("可信场景正文"));
    assert.deepEqual(ctx.tools, []);
    assert.deepEqual(ctx.knowledgeBases, []);
  });

  it("rejects unknown sceneId", () => {
    const artifact = loadFixture();
    assert.throws(
      () =>
        assembleTrustedContext(artifact, {
          courseVersionId: artifact.courseVersionId,
          sceneId: "missing-scene",
          question: "hi",
        }),
      (err: unknown) =>
        err instanceof Error &&
        "code" in err &&
        (err as { code: string }).code === "SCENE_NOT_FOUND",
    );
  });
});

describe("tool allowlist", () => {
  it("strips high-risk and non-allowlisted tools", () => {
    assert.deepEqual(DEFAULT_TOOL_ALLOWLIST, []);
    assert.deepEqual(enforceToolAllowlist(["shell", "mcp", "search"]), []);
    assert.deepEqual(enforceToolAllowlist(["search"], ["search"]), ["search"]);
    assert.deepEqual(enforceToolAllowlist(["shell"], ["shell"]), []);
  });
});

describe("stream normalization", () => {
  it("maps content/done/usage/citation/cancel/reconnect", () => {
    resetSeqForTests();
    assert.equal(normalizeDeepTutorMessage({ type: "content", content: "hi" })?.type, "content");
    assert.equal(normalizeDeepTutorMessage({ type: "done" })?.type, "done");
    assert.equal(
      normalizeDeepTutorMessage({ type: "usage", usage: { total_tokens: 3 } })?.usage
        ?.totalTokens,
      3,
    );
    assert.equal(
      normalizeDeepTutorMessage({ type: "citation", metadata: { sourceRefId: "s1" } })
        ?.citation?.sourceRefId,
      "s1",
    );
    assert.equal(normalizeDeepTutorMessage({ type: "cancelled" })?.type, "cancelled");
    assert.equal(normalizeDeepTutorMessage({ type: "reconnect" })?.type, "reconnect");
    const unavailable = tutorUnavailableEvent("down");
    assert.equal(unavailable.tutorUnavailable, true);
  });
});

describe("player degradation", () => {
  it("opens player even when tutor is down", () => {
    const result = openPlayerIndependently({
      classroomUrl: "http://localhost:3000/classroom/abc",
      tutorOk: false,
    });
    assert.equal(result.opened, true);
    assert.equal(result.requiredTutor, false);
  });

  it("does not require tutor when classroom URL missing", () => {
    const result = openPlayerIndependently({ classroomUrl: null, tutorOk: true });
    assert.equal(result.opened, false);
    assert.equal(result.requiredTutor, false);
  });
});

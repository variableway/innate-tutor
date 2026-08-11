# Tutor Context Contract v0

Schema version: `0.1` (`TUTOR_CONTEXT_SCHEMA_VERSION`)

Types live in `@innate/contracts` (`tutor-context.ts`).

## Purpose

Define the **trusted** inputs for scene-aware Tutor turns so browser-forged course text never enters the model prompt.

## Client → BFF (untrusted)

`TutorTurnClientRequestV0` may include:

| Field | Trusted? | Notes |
| --- | --- | --- |
| `courseVersionId` | id only | Resolved server-side to an immutable `CourseArtifact` |
| `sceneId` | id only | Must exist in artifact `sceneIndex` / `content.scenes` |
| `selection` | untrusted highlight | Injected as “选中内容”, never as scene truth |
| `question` | user question | Required |
| `language` | preference | Default `zh` |
| `tools` | **ignored** | Server applies allowlist only |
| `forgedSceneBody` / `forgedCourseText` | **discarded** | Presence must not affect trusted scene text |

## Server assembly (trusted)

`TrustedTutorContextV0` is built only from:

1. Immutable `CourseArtifactV0` loaded by `courseVersionId` (fixture store or Catalog snapshot path)
2. Scene text extracted from artifact `content.scenes[]` (speech actions + bounded content JSON)
3. Optional `sourceMap` entries matching the scene (`TutorSourceRefV0`)
4. Empty `knowledgeBases: []` and server `tools` allowlist (default: none)

The assembled prompt uses `trustedSceneText` exclusively for course body. Any client body fields are stripped before assembly.

## Stream events

Normalized `TutorStreamEventV0` types: `session`, `turn`, `content`, `citation`, `usage`, `error`, `done`, `cancelled`, `reconnect`.

When DeepTutor is unreachable, the adapter emits `error` with `tutorUnavailable: true`. Catalog/Player must continue without Tutor.

## Boundary

Adapter talks to DeepTutor only via HTTP health / WebSocket `/api/v1/ws`. No imports from DeepTutor Python internals.

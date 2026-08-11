import type { TutorStreamEventV0, TutorUsageV0 } from "@innate/contracts";

let seqCounter = 0;

export function resetSeqForTests(): void {
  seqCounter = 0;
}

function nextSeq(explicit?: number): number {
  if (typeof explicit === "number" && Number.isFinite(explicit)) return explicit;
  seqCounter += 1;
  return seqCounter;
}

function asUsage(raw: unknown): TutorUsageV0 | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  const usage: TutorUsageV0 = {};
  if (typeof u.promptTokens === "number") usage.promptTokens = u.promptTokens;
  if (typeof u.prompt_tokens === "number") usage.promptTokens = u.prompt_tokens;
  if (typeof u.completionTokens === "number") usage.completionTokens = u.completionTokens;
  if (typeof u.completion_tokens === "number") usage.completionTokens = u.completion_tokens;
  if (typeof u.totalTokens === "number") usage.totalTokens = u.totalTokens;
  if (typeof u.total_tokens === "number") usage.totalTokens = u.total_tokens;
  return Object.keys(usage).length ? usage : undefined;
}

/**
 * Map DeepTutor unified WS / StreamEvent payloads into TutorStreamEventV0.
 */
export function normalizeDeepTutorMessage(raw: unknown): TutorStreamEventV0 | null {
  if (!raw || typeof raw !== "object") return null;
  const msg = raw as Record<string, unknown>;
  const type = String(msg.type ?? "");
  const sessionId = typeof msg.session_id === "string" ? msg.session_id : undefined;
  const turnId = typeof msg.turn_id === "string" ? msg.turn_id : undefined;
  const seq = nextSeq(typeof msg.seq === "number" ? msg.seq : undefined);

  if (type === "content" || type === "delta" || type === "message_delta") {
    const content =
      typeof msg.content === "string"
        ? msg.content
        : typeof msg.delta === "string"
          ? msg.delta
          : "";
    if (!content) return null;
    return { type: "content", seq, sessionId, turnId, content };
  }

  if (type === "citation" || type === "source") {
    const meta = (msg.metadata && typeof msg.metadata === "object"
      ? msg.metadata
      : msg) as Record<string, unknown>;
    return {
      type: "citation",
      seq,
      sessionId,
      turnId,
      citation: {
        sourceRefId:
          typeof meta.sourceRefId === "string"
            ? meta.sourceRefId
            : typeof meta.source_ref_id === "string"
              ? meta.source_ref_id
              : undefined,
        title: typeof meta.title === "string" ? meta.title : undefined,
        snippet:
          typeof msg.content === "string"
            ? msg.content
            : typeof meta.snippet === "string"
              ? meta.snippet
              : undefined,
        locator: typeof meta.locator === "string" ? meta.locator : undefined,
      },
    };
  }

  if (type === "usage") {
    return {
      type: "usage",
      seq,
      sessionId,
      turnId,
      usage: asUsage(msg.usage ?? msg.metadata ?? msg),
    };
  }

  if (type === "error") {
    return {
      type: "error",
      seq,
      sessionId,
      turnId,
      errorCode: typeof msg.code === "string" ? msg.code : "DEEPTUTOR_ERROR",
      errorMessage: String(msg.content ?? msg.error ?? msg.message ?? "error"),
      tutorUnavailable: Boolean(
        (msg.metadata as { tutorUnavailable?: boolean } | undefined)?.tutorUnavailable,
      ),
    };
  }

  if (type === "done" || type === "turn_done" || type === "end") {
    return { type: "done", seq, sessionId, turnId, usage: asUsage(msg.usage ?? msg.metadata) };
  }

  if (type === "cancelled" || type === "canceled" || type === "turn_cancelled") {
    return { type: "cancelled", seq, sessionId, turnId };
  }

  if (type === "session" || type === "session_started") {
    return { type: "session", seq, sessionId, turnId };
  }

  if (type === "turn" || type === "turn_started" || type === "start_turn_ack") {
    return { type: "turn", seq, sessionId, turnId };
  }

  if (type === "reconnect" || type === "resubscribed") {
    return { type: "reconnect", seq, sessionId, turnId };
  }

  return null;
}

export function tutorUnavailableEvent(message: string): TutorStreamEventV0 {
  return {
    type: "error",
    seq: nextSeq(),
    errorCode: "TUTOR_UNAVAILABLE",
    errorMessage: message,
    tutorUnavailable: true,
  };
}

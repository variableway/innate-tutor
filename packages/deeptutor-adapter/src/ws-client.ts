import type { TrustedTutorContextV0, TutorStreamEventV0 } from "@innate/contracts";
import { buildTrustedPrompt } from "./assemble-context.js";
import { normalizeDeepTutorMessage, tutorUnavailableEvent } from "./normalize.js";

export interface DeepTutorWsOptions {
  /** e.g. ws://127.0.0.1:8001/api/v1/ws */
  wsUrl: string;
  /** Node 22+ / browsers provide WebSocket. Inject for tests. */
  WebSocketImpl?: typeof WebSocket;
  timeoutMs?: number;
}

export interface TutorTurnHandle {
  cancel: () => void;
  done: Promise<TutorStreamEventV0[]>;
}

function toHttpHealthUrl(wsUrl: string): string {
  const u = new URL(wsUrl);
  u.protocol = u.protocol === "wss:" ? "https:" : "http:";
  u.pathname = "/api/health";
  u.search = "";
  u.hash = "";
  return u.toString();
}

export async function checkDeepTutorHealth(wsUrl: string): Promise<{
  ok: boolean;
  wsUrl: string;
  checkedAt: string;
  error?: string;
}> {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(toHttpHealthUrl(wsUrl), { method: "GET" });
    if (!res.ok) {
      return { ok: false, wsUrl, checkedAt, error: `HTTP ${res.status}` };
    }
    return { ok: true, wsUrl, checkedAt };
  } catch (error) {
    return {
      ok: false,
      wsUrl,
      checkedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Start one chat turn over DeepTutor unified WS.
 * Always sends knowledge_bases=[] and tools from trusted context (allowlist).
 */
export function startTrustedTutorTurn(
  ctx: TrustedTutorContextV0,
  options: DeepTutorWsOptions,
  onEvent?: (event: TutorStreamEventV0) => void,
): TutorTurnHandle {
  const prompt = buildTrustedPrompt(ctx);
  const WS = options.WebSocketImpl ?? WebSocket;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const events: TutorStreamEventV0[] = [];
  let settled = false;
  let ws: WebSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sessionId = "";
  let turnId = "";
  let resolveDone!: (value: TutorStreamEventV0[]) => void;

  const done = new Promise<TutorStreamEventV0[]>((resolve) => {
    resolveDone = resolve;
  });

  const emit = (event: TutorStreamEventV0) => {
    if (event.sessionId) sessionId = event.sessionId;
    if (event.turnId) turnId = event.turnId;
    events.push(event);
    onEvent?.(event);
  };

  const finish = () => {
    if (settled) return;
    settled = true;
    if (timer) clearTimeout(timer);
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
    resolveDone(events);
  };

  const cancel = () => {
    if (settled) return;
    try {
      if (ws && ws.readyState === WS.OPEN) {
        ws.send(
          JSON.stringify({
            type: "cancel_turn",
            session_id: sessionId,
            turn_id: turnId,
          }),
        );
      }
    } catch {
      /* ignore */
    }
    emit({ type: "cancelled", seq: events.length + 1, sessionId, turnId });
    finish();
  };

  timer = setTimeout(() => {
    emit({
      type: "error",
      seq: events.length + 1,
      errorCode: "TIMEOUT",
      errorMessage: "tutor turn timed out",
      tutorUnavailable: true,
    });
    finish();
  }, timeoutMs);

  try {
    ws = new WS(options.wsUrl);
  } catch (error) {
    emit(
      tutorUnavailableEvent(error instanceof Error ? error.message : String(error)),
    );
    finish();
    return { cancel, done };
  }

  ws.addEventListener("open", () => {
    ws?.send(
      JSON.stringify({
        type: "start_turn",
        capability: "chat",
        content: prompt,
        knowledge_bases: ctx.knowledgeBases,
        tools: ctx.tools,
        language: "zh",
      }),
    );
  });

  ws.addEventListener("message", (ev) => {
    let raw: unknown;
    try {
      raw = JSON.parse(String((ev as MessageEvent).data));
    } catch {
      return;
    }
    const event = normalizeDeepTutorMessage(raw);
    if (!event) return;
    emit(event);
    if (event.type === "done" || event.type === "error" || event.type === "cancelled") {
      finish();
    }
  });

  ws.addEventListener("error", () => {
    if (!settled) {
      emit(tutorUnavailableEvent("WebSocket error"));
      finish();
    }
  });

  ws.addEventListener("close", () => {
    if (!settled) {
      if (events.some((e) => e.type === "content")) {
        emit({ type: "done", seq: events.length + 1, sessionId, turnId });
      } else {
        emit(tutorUnavailableEvent("WebSocket closed before completion"));
      }
      finish();
    }
  });

  return { cancel, done };
}

/**
 * Re-subscribe to an in-flight turn after disconnect (reconnect contract).
 */
export function reconnectTutorTurn(options: {
  wsUrl: string;
  turnId: string;
  afterSeq?: number;
  WebSocketImpl?: typeof WebSocket;
  onEvent?: (event: TutorStreamEventV0) => void;
}): TutorTurnHandle {
  const WS = options.WebSocketImpl ?? WebSocket;
  const events: TutorStreamEventV0[] = [];
  let settled = false;
  let ws: WebSocket | undefined;
  let resolveDone!: (value: TutorStreamEventV0[]) => void;
  const done = new Promise<TutorStreamEventV0[]>((resolve) => {
    resolveDone = resolve;
  });

  const finish = () => {
    if (settled) return;
    settled = true;
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
    resolveDone(events);
  };

  const emit = (event: TutorStreamEventV0) => {
    events.push(event);
    options.onEvent?.(event);
  };

  try {
    ws = new WS(options.wsUrl);
  } catch (error) {
    emit(tutorUnavailableEvent(error instanceof Error ? error.message : String(error)));
    finish();
    return { cancel: finish, done };
  }

  ws.addEventListener("open", () => {
    emit({
      type: "reconnect",
      seq: 0,
      turnId: options.turnId,
    });
    ws?.send(
      JSON.stringify({
        type: "subscribe_turn",
        turn_id: options.turnId,
        after_seq: options.afterSeq ?? 0,
      }),
    );
  });

  ws.addEventListener("message", (ev) => {
    let raw: unknown;
    try {
      raw = JSON.parse(String((ev as MessageEvent).data));
    } catch {
      return;
    }
    const event = normalizeDeepTutorMessage(raw);
    if (!event) return;
    emit(event);
    if (event.type === "done" || event.type === "error" || event.type === "cancelled") {
      finish();
    }
  });

  ws.addEventListener("error", () => {
    if (!settled) {
      emit(tutorUnavailableEvent("reconnect WebSocket error"));
      finish();
    }
  });

  return { cancel: finish, done };
}

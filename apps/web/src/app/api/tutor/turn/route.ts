import type { TutorTurnClientRequestV0 } from "@innate/contracts";
import {
  assembleTrustedContext,
  startTrustedTutorTurn,
  TutorContextError,
  tutorUnavailableEvent,
} from "@innate/deeptutor-adapter";
import { loadArtifactByVersionId } from "@/lib/artifact-store";
import { getDeepTutorWsUrl } from "@/lib/deeptutor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * NDJSON stream of TutorStreamEventV0.
 * Server assembles trusted prompt; client forged bodies are ignored.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as TutorTurnClientRequestV0;
  const artifact = await loadArtifactByVersionId(body.courseVersionId);
  if (!artifact) {
    return Response.json({ error: "ARTIFACT_NOT_FOUND" }, { status: 404 });
  }

  let ctx;
  try {
    ctx = assembleTrustedContext(artifact, body);
  } catch (error) {
    if (error instanceof TutorContextError) {
      return Response.json(
        { error: error.code, message: error.message },
        { status: 400 },
      );
    }
    throw error;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const handle = startTrustedTutorTurn(
        ctx,
        { wsUrl: getDeepTutorWsUrl(), timeoutMs: 120_000 },
        (event) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        },
      );

      const abort = () => {
        handle.cancel();
      };
      request.signal.addEventListener("abort", abort);

      void handle.done
        .then((events) => {
          if (events.length === 0) {
            controller.enqueue(
              encoder.encode(`${JSON.stringify(tutorUnavailableEvent("no events"))}\n`),
            );
          }
          controller.close();
        })
        .catch((error: unknown) => {
          controller.enqueue(
            encoder.encode(
              `${JSON.stringify(
                tutorUnavailableEvent(
                  error instanceof Error ? error.message : String(error),
                ),
              )}\n`,
            ),
          );
          controller.close();
        })
        .finally(() => {
          request.signal.removeEventListener("abort", abort);
        });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

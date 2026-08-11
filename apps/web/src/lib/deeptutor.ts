export function getDeepTutorWsUrl(): string {
  return process.env.DEEPTUTOR_WS_URL?.trim() || "ws://127.0.0.1:8001/api/v1/ws";
}

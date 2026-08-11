function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function identityProvider(): "local" | "oidc" {
  const value = (process.env.IDENTITY_PROVIDER ?? "local").trim().toLowerCase();
  if (value === "local" || value === "oidc") return value;
  throw new Error(`Invalid IDENTITY_PROVIDER: ${value} (expected local|oidc)`);
}

export function getServerEnv() {
  return {
    databaseUrl: required(
      "DATABASE_URL",
      "postgresql://innate:innate-local-dev@127.0.0.1:5432/innate",
    ),
    openmaicBaseUrl: required("OPENMAIC_BASE_URL", "http://127.0.0.1:3000"),
    openmaicPublicUrl: required("NEXT_PUBLIC_OPENMAIC_URL", "http://localhost:3000"),
    defaultModel: process.env.LLM_MODEL ?? process.env.OPENAI_MODELS ?? null,
    deeptutorWsUrl:
      process.env.DEEPTUTOR_WS_URL?.trim() || "ws://127.0.0.1:8001/api/v1/ws",
    artifactStoreDir: process.env.ARTIFACT_STORE_DIR?.trim() || null,
    /** local password auth now; oidc reserved for Authentik/OIDC adapter. */
    identityProvider: identityProvider(),
    sessionTtlHours: Number(process.env.SESSION_TTL_HOURS ?? "168") || 168,
  };
}

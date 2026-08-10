function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
  };
}

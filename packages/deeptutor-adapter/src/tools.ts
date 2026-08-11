/** High-risk tools are never forwarded. Default allowlist is empty (chat-only). */

export const HIGH_RISK_TOOLS = [
  "shell",
  "bash",
  "terminal",
  "mcp",
  "subagent",
  "code_execution",
  "file_write",
  "browser",
] as const;

/** Empty = no tools exposed to DeepTutor for Tutor Panel turns. */
export const DEFAULT_TOOL_ALLOWLIST: readonly string[] = [];

export function enforceToolAllowlist(
  requested: string[] | undefined,
  allowlist: readonly string[] = DEFAULT_TOOL_ALLOWLIST,
): string[] {
  const allowed = new Set(allowlist.map((t) => t.toLowerCase()));
  const banned = new Set(HIGH_RISK_TOOLS.map((t) => t.toLowerCase()));
  const out: string[] = [];
  for (const tool of requested ?? []) {
    const key = String(tool).toLowerCase();
    if (banned.has(key)) continue;
    if (!allowed.has(key)) continue;
    out.push(tool);
  }
  // Even if client requests tools, only allowlist survivors pass.
  // Default allowlist is empty → always [].
  return out.filter((t) => allowed.has(t.toLowerCase()));
}

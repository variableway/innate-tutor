import type { CourseArtifactAssetKind, CourseArtifactAssetRefV0 } from "@innate/contracts";

const URL_RE =
  /https?:\/\/[^\s"'\\]+|\/api\/classroom-media\/[^\s"'\\]+|data:[^\s"'\\]+/g;

function classify(path: string): CourseArtifactAssetKind {
  const lower = path.toLowerCase();
  if (lower.startsWith("data:image") || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(lower)) {
    return "image";
  }
  if (lower.startsWith("data:audio") || /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(lower)) {
    return "audio";
  }
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return "remote";
  }
  if (lower.includes("/api/classroom-media/")) {
    return "generated";
  }
  if (lower.startsWith("data:")) {
    return "generated";
  }
  return "unknown";
}

/** Collect unique asset-like string refs from an arbitrary classroom JSON tree. */
export function collectAssetRefs(root: unknown): CourseArtifactAssetRefV0[] {
  const found = new Set<string>();
  const walk = (node: unknown) => {
    if (typeof node === "string") {
      if (
        node.startsWith("http://") ||
        node.startsWith("https://") ||
        node.startsWith("data:") ||
        node.includes("/api/classroom-media/")
      ) {
        found.add(node);
      } else {
        for (const m of node.matchAll(URL_RE)) {
          found.add(m[0]!);
        }
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const value of Object.values(node as Record<string, unknown>)) {
        walk(value);
      }
    }
  };
  walk(root);
  return [...found].sort().map((path) => ({
    path,
    kind: classify(path),
    missing: path.startsWith("http://") || path.startsWith("https://") ? undefined : false,
  }));
}

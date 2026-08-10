import type { CatalogCourseStatus } from "@innate/contracts";

const LABELS: Record<CatalogCourseStatus, string> = {
  queued: "queued",
  running: "running",
  succeeded: "succeeded",
  failed: "failed",
};

export function StatusBadge({ status }: { status: CatalogCourseStatus }) {
  return <span className={`badge ${status}`}>{LABELS[status]}</span>;
}

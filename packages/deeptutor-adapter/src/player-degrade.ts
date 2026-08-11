/**
 * Player playback must never depend on Tutor availability.
 * Catalog open-player helpers call this to document / assert the boundary.
 */
export interface OpenPlayerResult {
  opened: boolean;
  classroomUrl: string;
  /** Always false — Tutor health must not gate Player. */
  requiredTutor: false;
  tutorHealthChecked: boolean;
  note: string;
}

export function openPlayerIndependently(input: {
  classroomUrl: string | null | undefined;
  /** Optional; ignored for gating. */
  tutorOk?: boolean;
}): OpenPlayerResult {
  const classroomUrl = input.classroomUrl?.trim() ?? "";
  if (!classroomUrl) {
    return {
      opened: false,
      classroomUrl: "",
      requiredTutor: false,
      tutorHealthChecked: typeof input.tutorOk === "boolean",
      note: "No classroom URL; Player unavailable. Tutor status is irrelevant.",
    };
  }
  return {
    opened: true,
    classroomUrl,
    requiredTutor: false,
    tutorHealthChecked: typeof input.tutorOk === "boolean",
    note:
      "Player may open regardless of Tutor. Tutor downtime must not block playback.",
  };
}

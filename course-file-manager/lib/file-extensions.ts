import type { SlotDefinition } from "@/lib/slots";

const PRESENTATION_EXTENSIONS = [".pdf", ".pptx"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];
const PROFILE_EXTENSIONS = [".pdf", ".docx"];

function isProfileSlot(slot: SlotDefinition) {
  return (
    slot.category === "theory_teacher_profile" || slot.category === "lab_cv"
  );
}

function isAttendanceSlot(slot: SlotDefinition) {
  return slot.category.endsWith("_attendance_report");
}

function isLabRubricsSlot(slot: SlotDefinition) {
  return [
    "lab_final_rubrics",
    "lab_performance_rubrics",
    "lab_report_rubrics",
  ].includes(slot.category);
}

function getOriginalExtension(filename: string) {
  const trimmed = filename.trim();
  const dotIndex = trimmed.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return null;
  }

  return trimmed.slice(dotIndex).toLowerCase();
}

export function getAcceptedExtensions(slot: SlotDefinition) {
  if (
    slot.category.startsWith("theory_quiz_") &&
    (slot.category.endsWith("_question") ||
      slot.category.endsWith("_question_set_b"))
  ) {
    return [".doc", ".docx"];
  }

  if (slot.category.startsWith("theory_presentation_report_")) {
    return PRESENTATION_EXTENSIONS;
  }

  if (isProfileSlot(slot)) {
    return PROFILE_EXTENSIONS;
  }

  if (
    slot.category === "theory_class_routine" ||
    slot.category === "lab_class_schedule"
  ) {
    return Array.from(
      new Set([slot.expectedExtension, ".pdf", ...IMAGE_EXTENSIONS]),
    );
  }

  return [slot.expectedExtension];
}

export function getUploadExtensionOverride(
  slot: SlotDefinition,
  filename: string,
) {
  const originalExtension = getOriginalExtension(filename);

  if (!originalExtension) {
    return undefined;
  }

  return getAcceptedExtensions(slot).includes(originalExtension)
    ? originalExtension
    : undefined;
}

export function assertUploadExtension(
  slot: SlotDefinition,
  filename: string,
) {
  if (
    !isProfileSlot(slot) &&
    !isAttendanceSlot(slot) &&
    !isLabRubricsSlot(slot)
  ) {
    return;
  }

  if (getAcceptedExtensions(slot).includes(getOriginalExtension(filename) ?? "")) {
    return;
  }

  const extensions = getAcceptedExtensions(slot)
    .map((extension) => extension.slice(1).toUpperCase())
    .join(" or ");

  throw new Error(`${slot.label} files must be ${extensions}.`);
}

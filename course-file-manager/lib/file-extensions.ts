import type { SlotDefinition } from "@/lib/slots";

const PRESENTATION_EXTENSIONS = [".pdf", ".pptx"];

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

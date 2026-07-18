import {
  getSlotsForCourse,
  isRequiredSlot,
  type SlotDefinition,
} from "./slots";
import type { Course, FileEntry, Section } from "./types";

export type CompletionSummary = {
  uploaded: number;
  required: number;
  percentage: number;
};

export function getSlotKey(slot: SlotDefinition) {
  return `${slot.category}:${slot.subCategory ?? ""}:${slot.quizNumber ?? ""}`;
}

export function getFileEntryKey(fileEntry: FileEntry) {
  return `${fileEntry.document_category}:${fileEntry.sub_category ?? ""}:${
    fileEntry.quiz_number ?? ""
  }`;
}

export function hasCourseLevelRequirements(course: Course, sections: Section[]) {
  return (
    Boolean(course.coordinator_initial.trim()) &&
    sections.some(
      (section) => section.role === "Module Leader" || section.role === "Both",
    )
  );
}

export function calculateSlotCompletion(
  slots: SlotDefinition[],
  fileEntries: FileEntry[],
): CompletionSummary {
  const requiredSlots = slots.filter(isRequiredSlot);
  const slotKeys = new Set(requiredSlots.map(getSlotKey));
  const uploaded = new Set(
    fileEntries
      .filter((entry) => slotKeys.has(getFileEntryKey(entry)))
      .map(getFileEntryKey),
  ).size;
  const required = requiredSlots.length;

  return {
    uploaded,
    required,
    percentage: required > 0 ? Math.round((uploaded / required) * 100) : 0,
  };
}

export function calculateCourseCompletion(
  course: Course,
  sections: Section[],
  fileEntries: FileEntry[],
): CompletionSummary {
  const sectionSlots = getSlotsForCourse(course.course_type, "section");
  const courseSlots = hasCourseLevelRequirements(course, sections)
    ? getSlotsForCourse(course.course_type, "course")
    : [];

  let uploaded = 0;
  let required = 0;

  const courseCompletion = calculateSlotCompletion(
    courseSlots,
    fileEntries.filter((entry) => entry.section_id === null),
  );
  uploaded += courseCompletion.uploaded;
  required += courseCompletion.required;

  for (const section of sections) {
    const sectionCompletion = calculateSlotCompletion(
      sectionSlots,
      fileEntries.filter((entry) => entry.section_id === section.id),
    );
    required += sectionCompletion.required;
    uploaded += sectionCompletion.uploaded;
  }

  return {
    uploaded,
    required,
    percentage: required > 0 ? Math.round((uploaded / required) * 100) : 0,
  };
}

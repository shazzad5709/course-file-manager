import { getSlotsForCourse, type SlotDefinition } from "@/lib/slots";
import type { Course, FileEntry, Section } from "@/lib/types";

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
  const slotKeys = new Set(slots.map(getSlotKey));
  const uploaded = new Set(
    fileEntries
      .filter((entry) => slotKeys.has(getFileEntryKey(entry)))
      .map(getFileEntryKey),
  ).size;
  const required = slots.length;

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
  let required = courseSlots.length;

  uploaded += calculateSlotCompletion(
    courseSlots,
    fileEntries.filter((entry) => entry.section_id === null),
  ).uploaded;

  for (const section of sections) {
    required += sectionSlots.length;
    uploaded += calculateSlotCompletion(
      sectionSlots,
      fileEntries.filter((entry) => entry.section_id === section.id),
    ).uploaded;
  }

  return {
    uploaded,
    required,
    percentage: required > 0 ? Math.round((uploaded / required) * 100) : 0,
  };
}

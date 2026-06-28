type CourseZipMeta = {
  course_code: string;
  coordinator_initial: string;
  semester: string;
};

type SectionZipMeta = {
  section_label: string;
  teacher_initial: string;
};

type ZipFileEntryMeta = {
  document_category: string;
  renamed_filename: string;
};

export function safeZipSegment(value: string) {
  return value.trim().replace(/[\\/:\0-\x1f]/g, "_") || "untitled";
}

function zipPath(...segments: string[]) {
  return segments.map(safeZipSegment).join("/");
}

export function getCourseRootFolder(course: CourseZipMeta) {
  return [
    safeZipSegment(course.course_code),
    safeZipSegment(course.coordinator_initial),
    safeZipSegment(course.semester),
  ].join("_");
}

export function getSectionRootFolder(section: SectionZipMeta) {
  return [
    safeZipSegment(section.section_label),
    safeZipSegment(section.teacher_initial),
  ].join("_");
}

export function getSectionEntryRelativePath(entry: ZipFileEntryMeta) {
  const category = entry.document_category;
  const filename = entry.renamed_filename;

  if (category.startsWith("theory_final_script_")) {
    return zipPath("Final", filename);
  }

  if (category.startsWith("theory_mid_script_")) {
    return zipPath("Mid", filename);
  }

  if (category.startsWith("theory_quiz_1_")) {
    return zipPath("Quiz", "Quiz 1", filename);
  }

  if (category.startsWith("theory_quiz_2_")) {
    return zipPath("Quiz", "Quiz 2", filename);
  }

  if (category.startsWith("theory_quiz_3_")) {
    return zipPath("Quiz", "Quiz 3", filename);
  }

  if (category.startsWith("theory_assignment_")) {
    return zipPath("Assignment", filename);
  }

  if (category.startsWith("theory_presentation_")) {
    return zipPath("Presentation", filename);
  }

  if (category.startsWith("lab_final_")) {
    return zipPath("Lab Final", filename);
  }

  if (category.startsWith("lab_performance")) {
    return zipPath("Lab Performance", filename);
  }

  if (category.startsWith("lab_report")) {
    return zipPath("Lab Report", filename);
  }

  if (category.startsWith("project_lab_performance")) {
    return zipPath("Lab Performance", filename);
  }

  if (category.startsWith("project_final_")) {
    return zipPath("Project Final", filename);
  }

  if (category.startsWith("project_report")) {
    return zipPath("Final Project Report", filename);
  }

  return safeZipSegment(filename);
}

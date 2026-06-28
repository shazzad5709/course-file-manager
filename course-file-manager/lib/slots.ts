import type { CourseType } from "@/lib/types";

export type RepresentativeCategory = "Highest" | "Average" | "Marginal";
export type SlotLevel = "section" | "course";

export type SlotDefinition = {
  category: string;
  label: string;
  subCategory: RepresentativeCategory | null;
  quizNumber: 1 | 2 | 3 | null;
  level: SlotLevel;
  expectedExtension: string;
};

const REPRESENTATIVE_CATEGORIES: RepresentativeCategory[] = [
  "Highest",
  "Average",
  "Marginal",
];

function representativeSlots(
  categoryPrefix: string,
  labelPrefix: string,
  expectedExtension: string,
  quizNumber: 1 | 2 | 3 | null = null,
): SlotDefinition[] {
  return REPRESENTATIVE_CATEGORIES.map((subCategory) => ({
    category: `${categoryPrefix}_${subCategory.toLowerCase()}`,
    label: `${labelPrefix} - ${subCategory}`,
    subCategory,
    quizNumber,
    level: "section",
    expectedExtension,
  }));
}

function sectionSlot(
  category: string,
  label: string,
  expectedExtension: string,
  quizNumber: 1 | 2 | 3 | null = null,
): SlotDefinition {
  return {
    category,
    label,
    subCategory: null,
    quizNumber,
    level: "section",
    expectedExtension,
  };
}

function courseSlot(
  category: string,
  label: string,
  expectedExtension: string,
): SlotDefinition {
  return {
    category,
    label,
    subCategory: null,
    quizNumber: null,
    level: "course",
    expectedExtension,
  };
}

export const THEORY_SECTION_SLOTS: SlotDefinition[] = [
  ...representativeSlots("theory_final_script", "Final Exam Script", ".pdf"),
  ...representativeSlots("theory_mid_script", "Mid Exam Script", ".pdf"),
  ...representativeSlots(
    "theory_quiz_1_script",
    "Quiz 1 Script",
    ".pdf",
    1,
  ),
  sectionSlot("theory_quiz_1_question", "Quiz 1 Question", ".pdf", 1),
  ...representativeSlots(
    "theory_quiz_2_script",
    "Quiz 2 Script",
    ".pdf",
    2,
  ),
  sectionSlot("theory_quiz_2_question", "Quiz 2 Question", ".pdf", 2),
  ...representativeSlots(
    "theory_quiz_3_script",
    "Quiz 3 Script",
    ".pdf",
    3,
  ),
  sectionSlot("theory_quiz_3_question", "Quiz 3 Question", ".pdf", 3),
  ...representativeSlots(
    "theory_assignment_report",
    "Assignment Report",
    ".pdf",
  ),
  sectionSlot(
    "theory_assignment_rubrics",
    "Assignment Rubrics",
    ".xlsx",
  ),
  ...representativeSlots(
    "theory_presentation_report",
    "Presentation Slide",
    ".ppt",
  ),
  sectionSlot(
    "theory_presentation_rubrics",
    "Presentation Rubrics",
    ".xlsx",
  ),
  sectionSlot("theory_gradesheet", "Gradesheet", ".xlsx"),
  sectionSlot("theory_attendance_report", "Attendance Report", ".pdf"),
  sectionSlot("theory_class_routine", "Class Routine", ".pdf"),
  sectionSlot("theory_lecture_sample", "Lecture Sample", ".pdf"),
  sectionSlot("theory_teacher_profile", "Teacher's Profile", ".pdf"),
  sectionSlot("theory_cer", "CER File", ".xlsx"),
];

export const THEORY_COURSE_SLOTS: SlotDefinition[] = [
  courseSlot("theory_course_outline", "Course Outline", ".pdf"),
  courseSlot("theory_final_question", "Final Question Paper", ".pdf"),
  courseSlot("theory_mid_question", "Mid Question Paper", ".pdf"),
  courseSlot("theory_mid_qm_form", "Mid Question Moderation Form", ".xlsx"),
  courseSlot(
    "theory_final_qm_form",
    "Final Question Moderation Form",
    ".xlsx",
  ),
  courseSlot("theory_combined_cer", "Combined CER File", ".xlsx"),
  courseSlot("theory_course_report", "Semester End Report", ".pdf"),
];

export const LAB_SECTION_SLOTS: SlotDefinition[] = [
  ...representativeSlots("lab_final_script", "Lab Final Script", ".pdf"),
  sectionSlot(
    "lab_final_rubrics",
    "Lab Final Gradesheet / Rubrics",
    ".pdf",
  ),
  sectionSlot("lab_final_question", "Lab Final Question", ".pdf"),
  ...representativeSlots("lab_report", "Lab Report", ".pdf"),
  sectionSlot(
    "lab_report_rubrics",
    "Lab Report Gradesheet / Rubrics",
    ".pdf",
  ),
  ...representativeSlots("lab_performance", "Lab Performance", ".pdf"),
  sectionSlot("lab_performance_question", "Lab Performance Question", ".pdf"),
  sectionSlot(
    "lab_performance_rubrics",
    "Lab Performance Gradesheet / Rubrics",
    ".pdf",
  ),
  sectionSlot(
    "lab_tabulation_sheet",
    "Final Section-wise Gradesheet / Lab Tabulation Sheet",
    ".pdf",
  ),
  sectionSlot("lab_attendance_report", "Attendance Report", ".xlsx"),
  sectionSlot("lab_cer", "CER File", ".xlsx"),
  sectionSlot("lab_cv", "Teacher's Profile", ".xlsx"),
  sectionSlot("lab_class_schedule", "Class Routine", ".xlsx"),
  sectionSlot("lab_experiment_list", "Lab Experiment List", ".pdf"),
  sectionSlot("lab_assignment_list", "Lab Assignment List", ".pdf"),
  sectionSlot("lab_blc_link_record", "Lecture Sample", ".pdf"),
];

export const LAB_COURSE_SLOTS: SlotDefinition[] = [
  courseSlot("lab_assessment_criteria", "Assessment Criteria", ".pdf"),
  courseSlot("lab_manual", "Lab Manual", ".pdf"),
  courseSlot("lab_combined_cer", "Combined CER File", ".pdf"),
  courseSlot("lab_course_report", "Semester End Report", ".pdf"),
  courseSlot("lab_obe", "OBE Document", ".pdf"),
];

export const PROJECT_SECTION_SLOTS: SlotDefinition[] = [
  ...representativeSlots(
    "project_final_document",
    "Project Final Document",
    ".pdf",
  ),
  sectionSlot(
    "project_final_rubrics",
    "Project Final Gradesheet / Rubrics",
    ".pdf",
  ),
  ...representativeSlots("project_report", "Project Report", ".pdf"),
  sectionSlot(
    "project_report_rubrics",
    "Project Report Gradesheet / Rubrics",
    ".pdf",
  ),
  ...representativeSlots(
    "project_lab_performance_document",
    "Lab Performance Document",
    ".pdf",
  ),
  sectionSlot(
    "project_lab_performance_rubrics",
    "Lab Performance Gradesheet / Rubrics",
    ".pdf",
  ),
  sectionSlot(
    "project_tabulation_sheet",
    "Final Section-wise Gradesheet / Project Tabulation Sheet",
    ".pdf",
  ),
  sectionSlot("project_attendance_report", "Attendance Report", ".xlsx"),
  sectionSlot("project_list", "Project List", ".xlsx"),
  sectionSlot("project_cer", "CER File", ".xlsx"),
];

export const PROJECT_COURSE_SLOTS: SlotDefinition[] = [
  courseSlot("project_combined_cer", "Combined CER File", ".pdf"),
  courseSlot("project_course_report", "Semester End Report", ".pdf"),
];

export function getSlotsForCourse(
  courseType: CourseType,
  level: SlotLevel,
): SlotDefinition[] {
  if (courseType === "Theory") {
    return level === "section" ? THEORY_SECTION_SLOTS : THEORY_COURSE_SLOTS;
  }

  if (courseType === "Lab") {
    return level === "section" ? LAB_SECTION_SLOTS : LAB_COURSE_SLOTS;
  }

  return level === "section" ? PROJECT_SECTION_SLOTS : PROJECT_COURSE_SLOTS;
}

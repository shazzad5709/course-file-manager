import type { SlotDefinition } from "@/lib/slots";

type FilenameParams = {
  courseCode: string;
  sectionLabel?: string;
  teacherInitial?: string;
  coordinatorInitial?: string;
  semester: string;
};

function requireParam(value: string | undefined, name: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${name} is required for this filename.`);
  }

  return normalized;
}

function sectionParts(slot: SlotDefinition, params: FilenameParams) {
  if (slot.level !== "section") {
    throw new Error(`${slot.category} is not a section-level slot.`);
  }

  return {
    courseCode: requireParam(params.courseCode, "Course code"),
    sectionLabel: requireParam(params.sectionLabel, "Section label"),
    teacherInitial: requireParam(params.teacherInitial, "Teacher initial"),
    semester: requireParam(params.semester, "Semester"),
  };
}

function courseParts(slot: SlotDefinition, params: FilenameParams) {
  if (slot.level !== "course") {
    throw new Error(`${slot.category} is not a course-level slot.`);
  }

  return {
    courseCode: requireParam(params.courseCode, "Course code"),
    coordinatorInitial: requireParam(
      params.coordinatorInitial,
      "Coordinator initial",
    ),
    semester: requireParam(params.semester, "Semester"),
  };
}

function requireSubCategory(slot: SlotDefinition): string {
  if (!slot.subCategory) {
    throw new Error(`${slot.category} requires a representative category.`);
  }

  return slot.subCategory;
}

function requireQuizNumber(slot: SlotDefinition): 1 | 2 | 3 {
  if (!slot.quizNumber) {
    throw new Error(`${slot.category} requires a quiz number.`);
  }

  return slot.quizNumber;
}

function withExtension(parts: string[], extension: string): string {
  return `${parts.join("_")}${extension}`;
}

export function generateFilename(
  slot: SlotDefinition,
  params: FilenameParams,
): string {
  const category = slot.category;

  if (category.startsWith("theory_final_script_")) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "Final",
        values.teacherInitial,
        requireSubCategory(slot),
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category.startsWith("theory_mid_script_")) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "Mid",
        values.teacherInitial,
        requireSubCategory(slot),
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category.startsWith("theory_quiz_") && category.includes("_script_")) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        `Quiz${requireQuizNumber(slot)}`,
        values.teacherInitial,
        requireSubCategory(slot),
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category.startsWith("theory_quiz_") && category.endsWith("_question")) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        `Quiz${requireQuizNumber(slot)}`,
        "Question",
        values.teacherInitial,
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category.startsWith("theory_assignment_report_")) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "Assignment",
        values.teacherInitial,
        requireSubCategory(slot),
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category === "theory_assignment_rubrics") {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "Assignment",
        "Rubrics",
        values.teacherInitial,
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category.startsWith("theory_presentation_report_")) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "Presentation",
        values.teacherInitial,
        requireSubCategory(slot),
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category === "theory_presentation_rubrics") {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "Presentation",
        "Rubrics",
        values.teacherInitial,
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category === "theory_gradesheet") {
    return sectionDocumentWithTeacher(slot, params, ["Gradesheet"]);
  }

  if (
    category === "theory_attendance_report" ||
    category === "lab_attendance_report" ||
    category === "project_attendance_report"
  ) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        values.teacherInitial,
        "Attendance",
        "Report",
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (
    category === "theory_cer" ||
    category === "lab_cer" ||
    category === "project_cer"
  ) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        values.teacherInitial,
        "CER",
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category.startsWith("lab_final_script_")) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "LabFinal",
        values.teacherInitial,
        requireSubCategory(slot),
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category === "lab_final_rubrics") {
    return sectionDocumentWithTeacher(slot, params, ["LabFinal", "Rubrics"]);
  }

  if (category === "lab_final_question") {
    return sectionDocumentWithTeacher(slot, params, ["LabFinal", "Question"]);
  }

  if (category === "lab_report_rubrics") {
    return sectionDocumentWithTeacher(slot, params, ["LabReport", "Rubrics"]);
  }

  if (category.startsWith("lab_report_")) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "LabReport",
        values.teacherInitial,
        requireSubCategory(slot),
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category === "lab_performance_question") {
    return sectionDocumentWithTeacher(slot, params, [
      "LabPerformance",
      "Question",
    ]);
  }

  if (
    category.startsWith("lab_performance_") &&
    category !== "lab_performance_rubrics"
  ) {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        values.sectionLabel,
        "LabMid",
        values.teacherInitial,
        requireSubCategory(slot),
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category === "lab_performance_rubrics") {
    return sectionDocumentWithTeacher(slot, params, [
      "LabPerformance",
      "Rubrics",
    ]);
  }

  if (category === "lab_tabulation_sheet") {
    return sectionDocumentWithTeacher(slot, params, ["LabTabulationSheet"]);
  }

  if (category === "lab_cv") {
    return sectionDocumentWithTeacher(slot, params, ["TeacherProfile"]);
  }

  if (
    category === "theory_class_routine" ||
    category === "lab_class_schedule"
  ) {
    return sectionDocumentWithTeacher(slot, params, ["ClassRoutine"]);
  }

  if (
    category === "theory_lecture_sample" ||
    category === "lab_blc_link_record"
  ) {
    return sectionDocumentWithTeacher(slot, params, ["LectureSample"]);
  }

  if (category === "theory_teacher_profile") {
    return sectionDocumentWithTeacher(slot, params, ["TeacherProfile"]);
  }

  if (category === "lab_experiment_list") {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        "LabExperimentList",
        values.sectionLabel,
        values.teacherInitial,
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category === "lab_assignment_list") {
    const values = sectionParts(slot, params);

    return withExtension(
      [
        values.courseCode,
        "LabAssignmentsList",
        values.sectionLabel,
        values.teacherInitial,
        values.semester,
      ],
      slot.expectedExtension,
    );
  }

  if (category.startsWith("project_final_document_")) {
    return representativeSectionDocument(slot, params, ["ProjectFinal"]);
  }

  if (category === "project_final_rubrics") {
    return sectionDocumentWithTeacher(slot, params, ["ProjectFinal", "Rubrics"]);
  }

  if (category === "project_report_rubrics") {
    return sectionDocumentWithTeacher(slot, params, ["ProjectReport", "Rubrics"]);
  }

  if (category.startsWith("project_report_")) {
    return representativeSectionDocument(slot, params, ["ProjectReport"]);
  }

  if (category.startsWith("project_lab_performance_document_")) {
    return representativeSectionDocument(slot, params, ["LabPerformance"]);
  }

  if (category === "project_lab_performance_rubrics") {
    return sectionDocumentWithTeacher(slot, params, [
      "LabPerformance",
      "Rubrics",
    ]);
  }

  if (category === "project_tabulation_sheet") {
    return sectionDocumentWithTeacher(slot, params, ["ProjectTabulationSheet"]);
  }

  if (category === "project_list") {
    return sectionTeacherFirstDocument(slot, params, ["ProjectList"]);
  }

  if (category === "theory_course_outline") {
    const values = courseParts(slot, params);

    return withExtension(
      [values.courseCode, "CourseOutline", values.semester],
      slot.expectedExtension,
    );
  }

  if (category === "theory_final_question") {
    const values = courseParts(slot, params);

    return withExtension(
      [values.courseCode, "FinalQuestion", values.semester],
      slot.expectedExtension,
    );
  }

  if (category === "theory_mid_question") {
    const values = courseParts(slot, params);

    return withExtension(
      [values.courseCode, "MidQuestion", values.semester],
      slot.expectedExtension,
    );
  }

  if (category === "theory_mid_qm_form") {
    const values = courseParts(slot, params);

    return withExtension(
      [values.courseCode, "Mid", "QMForm", values.semester],
      slot.expectedExtension,
    );
  }

  if (category === "theory_final_qm_form") {
    const values = courseParts(slot, params);

    return withExtension(
      [values.courseCode, "Final", "QMForm", values.semester],
      slot.expectedExtension,
    );
  }

  if (
    category === "theory_combined_cer" ||
    category === "lab_combined_cer" ||
    category === "project_combined_cer"
  ) {
    return coordinatorCourseDocument(slot, params, ["CombinedCER"]);
  }

  if (
    category === "theory_course_report" ||
    category === "lab_course_report" ||
    category === "project_course_report"
  ) {
    return coordinatorCourseDocument(slot, params, ["CourseReport"]);
  }

  if (category === "lab_assessment_criteria") {
    return coordinatorCourseDocument(slot, params, ["AssessmentCriteria"]);
  }

  if (category === "lab_manual") {
    return coordinatorCourseDocument(slot, params, ["LabManual"]);
  }

  if (category === "lab_obe") {
    return coordinatorCourseDocument(slot, params, ["OBE"]);
  }

  throw new Error(`No naming rule found for slot category: ${category}.`);
}

function representativeSectionDocument(
  slot: SlotDefinition,
  params: FilenameParams,
  documentParts: string[],
): string {
  const values = sectionParts(slot, params);

  return withExtension(
    [
      values.courseCode,
      values.sectionLabel,
      ...documentParts,
      values.teacherInitial,
      requireSubCategory(slot),
      values.semester,
    ],
    slot.expectedExtension,
  );
}

function sectionDocumentWithTeacher(
  slot: SlotDefinition,
  params: FilenameParams,
  documentParts: string[],
): string {
  const values = sectionParts(slot, params);

  return withExtension(
    [
      values.courseCode,
      values.sectionLabel,
      ...documentParts,
      values.teacherInitial,
      values.semester,
    ],
    slot.expectedExtension,
  );
}

function sectionTeacherFirstDocument(
  slot: SlotDefinition,
  params: FilenameParams,
  documentParts: string[],
): string {
  const values = sectionParts(slot, params);

  return withExtension(
    [
      values.courseCode,
      values.sectionLabel,
      values.teacherInitial,
      ...documentParts,
      values.semester,
    ],
    slot.expectedExtension,
  );
}

function coordinatorCourseDocument(
  slot: SlotDefinition,
  params: FilenameParams,
  documentParts: string[],
): string {
  const values = courseParts(slot, params);

  return withExtension(
    [
      values.courseCode,
      ...documentParts,
      values.coordinatorInitial,
      values.semester,
    ],
    slot.expectedExtension,
  );
}

import assert from "node:assert/strict";
import test from "node:test";

import {
  assertUploadExtension,
  getAcceptedExtensions,
  getUploadExtensionOverride,
} from "./file-extensions";
import {
  generateFilename,
  getAlreadyFormattedQuizQuestionFilename,
} from "./naming";
import {
  LAB_COURSE_SLOTS,
  LAB_SECTION_SLOTS,
  PROJECT_COURSE_SLOTS,
  PROJECT_SECTION_SLOTS,
  THEORY_COURSE_SLOTS,
  THEORY_SECTION_SLOTS,
} from "./slots";

function findSlot(category: string) {
  const slot = [
    ...THEORY_SECTION_SLOTS,
    ...THEORY_COURSE_SLOTS,
    ...LAB_SECTION_SLOTS,
    ...LAB_COURSE_SLOTS,
    ...PROJECT_SECTION_SLOTS,
    ...PROJECT_COURSE_SLOTS,
  ].find((candidate) => candidate.category === category);

  if (!slot) {
    throw new Error(`Missing test slot: ${category}`);
  }

  return slot;
}

test("generates Theory Final Exam Script Highest filename", () => {
  assert.equal(
    generateFilename(findSlot("theory_final_script_highest"), {
      courseCode: "SE232",
      sectionLabel: "43A",
      teacherInitial: "NT",
      semester: "Fall-25",
    }),
    "SE232_43A_Final_NT_Highest_Fall-25.pdf",
  );
});

test("generates Theory Quiz 2 Question filename", () => {
  assert.equal(
    generateFilename(findSlot("theory_quiz_2_question"), {
      courseCode: "SE232",
      sectionLabel: "43B",
      teacherInitial: "RK",
      semester: "Spring-26",
    }),
    "SE232_43B_Quiz2_Question_RK_Spring-26.docx",
  );
});

test("generates Theory Quiz question default and Set B filenames", () => {
  const params = {
    courseCode: "SE216",
    sectionLabel: "43H",
    teacherInitial: "SHN",
    semester: "Spring-26",
  };

  assert.equal(
    generateFilename(findSlot("theory_quiz_1_question"), {
      ...params,
      quizQuestionSet: "A",
    }),
    "SE216_43H_Quiz1_Question_SHN_Spring-26.docx",
  );
  assert.equal(
    generateFilename(findSlot("theory_quiz_1_question_set_b"), params),
    "SE216_43H_Quiz1B_Question_SHN_Spring-26.docx",
  );
});

test("detects already formatted Theory quiz question filenames", () => {
  const params = {
    courseCode: "SE216",
    sectionLabel: "43H",
    teacherInitial: "SHN",
    semester: "Spring-26",
    extensionOverride: ".doc",
  };

  assert.equal(
    getAlreadyFormattedQuizQuestionFilename(
      findSlot("theory_quiz_1_question"),
      {
        ...params,
        originalFilename: "SE216_43H_Quiz1_Question_SHN_Spring-26.doc",
      },
    ),
    "SE216_43H_Quiz1_Question_SHN_Spring-26.doc",
  );
  assert.equal(
    getAlreadyFormattedQuizQuestionFilename(
      findSlot("theory_quiz_1_question"),
      {
        ...params,
        originalFilename: "SE216_43H_Quiz1A_Question_SHN_Spring-26.doc",
      },
    ),
    "SE216_43H_Quiz1A_Question_SHN_Spring-26.doc",
  );
  assert.equal(
    getAlreadyFormattedQuizQuestionFilename(
      findSlot("theory_quiz_1_question_set_b"),
      {
        ...params,
        originalFilename: "SE216_43H_Quiz1B_Question_SHN_Spring-26.doc",
      },
    ),
    "SE216_43H_Quiz1B_Question_SHN_Spring-26.doc",
  );
});

test("rejects quiz question filenames formatted for the wrong slot", () => {
  const params = {
    courseCode: "SE216",
    sectionLabel: "43H",
    teacherInitial: "SHN",
    semester: "Spring-26",
    extensionOverride: ".docx",
  };

  assert.equal(
    getAlreadyFormattedQuizQuestionFilename(
      findSlot("theory_quiz_1_question"),
      {
        ...params,
        originalFilename: "SE216_43H_Quiz1B_Question_SHN_Spring-26.docx",
      },
    ),
    null,
  );
  assert.equal(
    getAlreadyFormattedQuizQuestionFilename(
      findSlot("theory_quiz_1_question_set_b"),
      {
        ...params,
        originalFilename: "SE216_43H_Quiz1_Question_SHN_Spring-26.docx",
      },
    ),
    null,
  );
});

test("generates XLSX filenames for Lab rubric slots", () => {
  const params = {
    courseCode: "CSE110",
    sectionLabel: "44C",
    teacherInitial: "MA",
    semester: "Fall-25",
  };

  for (const [category, filename] of [
    ["lab_final_rubrics", "CSE110_44C_LabFinal_Rubrics_MA_Fall-25.xlsx"],
    [
      "lab_performance_rubrics",
      "CSE110_44C_LabPerformance_Rubrics_MA_Fall-25.xlsx",
    ],
    ["lab_report_rubrics", "CSE110_44C_LabReport_Rubrics_MA_Fall-25.xlsx"],
  ]) {
    assert.equal(generateFilename(findSlot(category), params), filename);
  }
});

test("requires XLSX uploads for Lab rubric slots only", () => {
  for (const category of [
    "lab_final_rubrics",
    "lab_performance_rubrics",
    "lab_report_rubrics",
  ]) {
    const slot = findSlot(category);

    assert.deepEqual(getAcceptedExtensions(slot), [".xlsx"]);
    assert.equal(getUploadExtensionOverride(slot, "rubrics.XLSX"), ".xlsx");
    assert.equal(getUploadExtensionOverride(slot, "rubrics.pdf"), undefined);
    assert.doesNotThrow(() => assertUploadExtension(slot, "rubrics.xlsx"));
    assert.throws(
      () => assertUploadExtension(slot, "rubrics.pdf"),
      /must be XLSX/,
    );
  }

  const projectRubrics = findSlot("project_final_rubrics");
  assert.deepEqual(getAcceptedExtensions(projectRubrics), [".pdf"]);
  assert.doesNotThrow(() => assertUploadExtension(projectRubrics, "rubrics.xlsx"));
});

test("generates Theory section support filenames", () => {
  const params = {
    courseCode: "SE232",
    sectionLabel: "43A",
    teacherInitial: "NT",
    semester: "Fall-25",
  };

  assert.equal(
    generateFilename(findSlot("theory_gradesheet"), params),
    "SE232_43A_Gradesheet_NT_Fall-25.pdf",
  );
  assert.equal(
    generateFilename(findSlot("theory_class_routine"), params),
    "SE232_43A_ClassRoutine_NT_Fall-25.pdf",
  );
  assert.equal(
    generateFilename(findSlot("theory_lecture_sample"), params),
    "SE232_43A_LectureSample_NT_Fall-25.pdf",
  );
  assert.equal(
    generateFilename(findSlot("theory_teacher_profile"), params),
    "SE232_43A_TeacherProfile_NT_Fall-25.pdf",
  );
});

test("generates Class Routine filenames with uploaded image extension", () => {
  assert.equal(
    generateFilename(findSlot("theory_class_routine"), {
      courseCode: "SE232",
      sectionLabel: "43A",
      teacherInitial: "NT",
      semester: "Fall-25",
      extensionOverride: ".jpg",
    }),
    "SE232_43A_ClassRoutine_NT_Fall-25.jpg",
  );
  assert.equal(
    generateFilename(findSlot("lab_class_schedule"), {
      courseCode: "CSE110",
      sectionLabel: "44C",
      teacherInitial: "MA",
      semester: "Fall-25",
      extensionOverride: ".png",
    }),
    "CSE110_44C_ClassRoutine_MA_Fall-25.png",
  );
});

test("accepts PDF and images for Class Routine uploads", () => {
  assert.deepEqual(
    getAcceptedExtensions(findSlot("theory_class_routine")),
    [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic"],
  );
  assert.deepEqual(
    getAcceptedExtensions(findSlot("lab_class_schedule")),
    [".xlsx", ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".heic"],
  );
});

test("accepts PDF and DOCX uploads for CV and Teacher Profile slots", () => {
  for (const category of ["theory_teacher_profile", "lab_cv"]) {
    const slot = findSlot(category);

    assert.deepEqual(getAcceptedExtensions(slot), [".pdf", ".docx"]);
    assert.equal(getUploadExtensionOverride(slot, "profile.DOCX"), ".docx");
    assert.equal(getUploadExtensionOverride(slot, "profile.xlsx"), undefined);
    assert.doesNotThrow(() => assertUploadExtension(slot, "profile.pdf"));
    assert.doesNotThrow(() => assertUploadExtension(slot, "profile.DOCX"));
    assert.throws(
      () => assertUploadExtension(slot, "profile.xlsx"),
      /must be PDF or DOCX/,
    );
  }
});

test("requires PDF attendance uploads for every course type", () => {
  for (const category of [
    "theory_attendance_report",
    "lab_attendance_report",
    "project_attendance_report",
  ]) {
    const slot = findSlot(category);

    assert.deepEqual(getAcceptedExtensions(slot), [".pdf"]);
    assert.equal(getUploadExtensionOverride(slot, "attendance.PDF"), ".pdf");
    assert.equal(getUploadExtensionOverride(slot, "attendance.xlsx"), undefined);
    assert.doesNotThrow(() => assertUploadExtension(slot, "attendance.pdf"));
    assert.throws(
      () => assertUploadExtension(slot, "attendance.xlsx"),
      /Attendance Report files must be PDF/,
    );
  }
});

test("generates Theory presentation filenames with uploaded extension", () => {
  const params = {
    courseCode: "SE232",
    sectionLabel: "43A",
    teacherInitial: "NT",
    semester: "Fall-25",
  };

  assert.equal(
    generateFilename(findSlot("theory_presentation_report_highest"), {
      ...params,
      extensionOverride: ".pdf",
    }),
    "SE232_43A_Presentation_NT_Highest_Fall-25.pdf",
  );
  assert.equal(
    generateFilename(findSlot("theory_presentation_report_average"), {
      ...params,
      extensionOverride: ".pptx",
    }),
    "SE232_43A_Presentation_NT_Average_Fall-25.pptx",
  );
});

test("generates Lab renamed support filenames", () => {
  const params = {
    courseCode: "CSE110",
    sectionLabel: "44C",
    teacherInitial: "MA",
    semester: "Fall-25",
  };

  assert.equal(
    generateFilename(findSlot("lab_class_schedule"), params),
    "CSE110_44C_ClassRoutine_MA_Fall-25.xlsx",
  );
  assert.equal(
    generateFilename(findSlot("lab_blc_link_record"), params),
    "CSE110_44C_LectureSample_MA_Fall-25.pdf",
  );
  assert.equal(
    generateFilename(findSlot("lab_cv"), params),
    "CSE110_44C_TeacherProfile_MA_Fall-25.pdf",
  );
  assert.equal(
    generateFilename(findSlot("lab_cv"), {
      ...params,
      extensionOverride: ".docx",
    }),
    "CSE110_44C_TeacherProfile_MA_Fall-25.docx",
  );
});

test("generates PDF Attendance Report filenames", () => {
  const params = {
    courseCode: "CSE110",
    sectionLabel: "44C",
    teacherInitial: "MA",
    semester: "Fall-25",
  };

  for (const category of [
    "theory_attendance_report",
    "lab_attendance_report",
    "project_attendance_report",
  ]) {
    assert.equal(
      generateFilename(findSlot(category), params),
      "CSE110_44C_MA_Attendance_Report_Fall-25.pdf",
    );
  }
});

test("generates Project Combined CER course-level filename", () => {
  assert.equal(
    generateFilename(findSlot("project_combined_cer"), {
      courseCode: "SE499",
      coordinatorInitial: "NT",
      semester: "Spring-26",
    }),
    "SE499_CombinedCER_NT_Spring-26.pdf",
  );
});

test("throws when section metadata is missing", () => {
  assert.throws(
    () =>
      generateFilename(findSlot("theory_final_script_highest"), {
        courseCode: "SE232",
        teacherInitial: "NT",
        semester: "Fall-25",
      }),
    /Section label is required/,
  );
});

test("every defined slot has a naming rule", () => {
  const sectionSlots = [
    ...THEORY_SECTION_SLOTS,
    ...LAB_SECTION_SLOTS,
    ...PROJECT_SECTION_SLOTS,
  ];
  const courseSlots = [
    ...THEORY_COURSE_SLOTS,
    ...LAB_COURSE_SLOTS,
    ...PROJECT_COURSE_SLOTS,
  ];

  for (const slot of sectionSlots) {
    assert.match(
      generateFilename(slot, {
        courseCode: "SE232",
        sectionLabel: "43A",
        teacherInitial: "NT",
        semester: "Fall-25",
      }),
      /^SE232_.+\.(pdf|docx|xlsx|pptx)$/,
    );
  }

  for (const slot of courseSlots) {
    assert.match(
      generateFilename(slot, {
        courseCode: "SE232",
        coordinatorInitial: "NT",
        semester: "Fall-25",
      }),
      /^SE232_.+\.(pdf|xlsx)$/,
    );
  }
});

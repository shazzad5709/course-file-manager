import assert from "node:assert/strict";
import test from "node:test";

import { generateFilename } from "./naming";
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
    "SE232_43B_Quiz2_Question_RK_Spring-26.pdf",
  );
});

test("generates Lab Performance Rubrics filename", () => {
  assert.equal(
    generateFilename(findSlot("lab_performance_rubrics"), {
      courseCode: "CSE110",
      sectionLabel: "44C",
      teacherInitial: "MA",
      semester: "Fall-25",
    }),
    "CSE110_44C_LabPerformance_Rubrics_MA_Fall-25.pdf",
  );
});

test("generates Lab Performance Question filename", () => {
  assert.equal(
    generateFilename(findSlot("lab_performance_question"), {
      courseCode: "CSE110",
      sectionLabel: "44C",
      teacherInitial: "MA",
      semester: "Fall-25",
    }),
    "CSE110_44C_LabPerformance_Question_MA_Fall-25.pdf",
  );
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
    "SE232_43A_Gradesheet_NT_Fall-25.xlsx",
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
    "CSE110_44C_TeacherProfile_MA_Fall-25.xlsx",
  );
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
      /^SE232_.+\.(pdf|xlsx|ppt)$/,
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

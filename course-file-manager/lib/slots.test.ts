import assert from "node:assert/strict";
import test from "node:test";

import {
  LAB_COURSE_SLOTS,
  LAB_SECTION_SLOTS,
  PROJECT_COURSE_SLOTS,
  PROJECT_SECTION_SLOTS,
  THEORY_COURSE_SLOTS,
  THEORY_SECTION_SLOTS,
  getSlotsForCourse,
  isRequiredSlot,
} from "./slots";

test("slot counts match requirements by course type and level", () => {
  assert.equal(THEORY_SECTION_SLOTS.length, 35);
  assert.equal(THEORY_SECTION_SLOTS.filter(isRequiredSlot).length, 32);
  assert.equal(THEORY_COURSE_SLOTS.length, 7);
  assert.equal(LAB_SECTION_SLOTS.length, 18);
  assert.equal(LAB_COURSE_SLOTS.length, 5);
  assert.equal(PROJECT_SECTION_SLOTS.length, 16);
  assert.equal(PROJECT_COURSE_SLOTS.length, 2);

  assert.equal(getSlotsForCourse("Theory", "section").length, 35);
  assert.equal(
    getSlotsForCourse("Theory", "section").filter(isRequiredSlot).length,
    32,
  );
  assert.equal(getSlotsForCourse("Theory", "course").length, 7);
  assert.equal(getSlotsForCourse("Lab", "section").length, 18);
  assert.equal(getSlotsForCourse("Lab", "course").length, 5);
  assert.equal(getSlotsForCourse("Project", "section").length, 16);
  assert.equal(getSlotsForCourse("Project", "course").length, 2);
});

test("Lab section slots match the required category order", () => {
  assert.deepEqual(
    LAB_SECTION_SLOTS.map(
      (slot) => `${slot.category}:${slot.subCategory ?? ""}`,
    ),
    [
      "lab_final_script_highest:Highest",
      "lab_final_script_average:Average",
      "lab_final_script_marginal:Marginal",
      "lab_final_rubrics:",
      "lab_performance_highest:Highest",
      "lab_performance_average:Average",
      "lab_performance_marginal:Marginal",
      "lab_performance_rubrics:",
      "lab_report_highest:Highest",
      "lab_report_average:Average",
      "lab_report_marginal:Marginal",
      "lab_report_rubrics:",
      "lab_tabulation_sheet:",
      "lab_attendance_report:",
      "lab_cer:",
      "lab_cv:",
      "lab_class_schedule:",
      "lab_blc_link_record:",
    ],
  );
});

test("only Lab rubric slots require XLSX files", () => {
  assert.deepEqual(
    LAB_SECTION_SLOTS.filter((slot) => slot.category.endsWith("_rubrics")).map(
      ({ category, expectedExtension }) => ({ category, expectedExtension }),
    ),
    [
      { category: "lab_final_rubrics", expectedExtension: ".xlsx" },
      { category: "lab_performance_rubrics", expectedExtension: ".xlsx" },
      { category: "lab_report_rubrics", expectedExtension: ".xlsx" },
    ],
  );

  assert.equal(
    PROJECT_SECTION_SLOTS.find((slot) => slot.category === "project_final_rubrics")
      ?.expectedExtension,
    ".pdf",
  );
});

test("theory quiz Set B question slots are optional", () => {
  const setBSlots = THEORY_SECTION_SLOTS.filter((slot) =>
    slot.category.endsWith("_question_set_b"),
  );

  assert.equal(setBSlots.length, 3);
  assert.deepEqual(
    setBSlots.map((slot) => ({
      optional: slot.optional,
      quizSet: slot.quizSet,
    })),
    [
      { optional: true, quizSet: "B" },
      { optional: true, quizSet: "B" },
      { optional: true, quizSet: "B" },
    ],
  );
});

test("slot categories are globally unique", () => {
  const slots = [
    ...THEORY_SECTION_SLOTS,
    ...THEORY_COURSE_SLOTS,
    ...LAB_SECTION_SLOTS,
    ...LAB_COURSE_SLOTS,
    ...PROJECT_SECTION_SLOTS,
    ...PROJECT_COURSE_SLOTS,
  ];
  const categories = slots.map((slot) => slot.category);

  assert.equal(new Set(categories).size, categories.length);
});

test("representative slots use required category labels only", () => {
  const slots = [
    ...THEORY_SECTION_SLOTS,
    ...LAB_SECTION_SLOTS,
    ...PROJECT_SECTION_SLOTS,
  ].filter((slot) => slot.subCategory !== null);

  assert.ok(slots.length > 0);
  assert.deepEqual(
    Array.from(new Set(slots.map((slot) => slot.subCategory))).sort(),
    ["Average", "Highest", "Marginal"],
  );
});

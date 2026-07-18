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
  assert.equal(LAB_SECTION_SLOTS.length, 22);
  assert.equal(LAB_COURSE_SLOTS.length, 5);
  assert.equal(PROJECT_SECTION_SLOTS.length, 16);
  assert.equal(PROJECT_COURSE_SLOTS.length, 2);

  assert.equal(getSlotsForCourse("Theory", "section").length, 35);
  assert.equal(
    getSlotsForCourse("Theory", "section").filter(isRequiredSlot).length,
    32,
  );
  assert.equal(getSlotsForCourse("Theory", "course").length, 7);
  assert.equal(getSlotsForCourse("Lab", "section").length, 22);
  assert.equal(getSlotsForCourse("Lab", "course").length, 5);
  assert.equal(getSlotsForCourse("Project", "section").length, 16);
  assert.equal(getSlotsForCourse("Project", "course").length, 2);
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

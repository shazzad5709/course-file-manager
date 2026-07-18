import assert from "node:assert/strict";
import test from "node:test";

import { calculateSlotCompletion } from "./progress";
import type { FileEntry } from "./types";

test("optional slots do not count against completion", () => {
  const slots = [
    {
      category: "theory_quiz_1_question",
      label: "Quiz 1 Question",
      subCategory: null,
      quizNumber: 1,
      level: "section",
      expectedExtension: ".docx",
    },
    {
      category: "theory_quiz_1_question_set_b",
      label: "Quiz 1 Question - Set B",
      subCategory: null,
      quizNumber: 1,
      level: "section",
      expectedExtension: ".docx",
      optional: true,
      quizSet: "B",
    },
  ] as const;
  const fileEntries: FileEntry[] = [
    {
      id: "entry-1",
      course_id: "course-1",
      section_id: "section-1",
      document_category: "theory_quiz_1_question",
      sub_category: null,
      quiz_number: 1,
      original_filename: "quiz.docx",
      renamed_filename: "SE216_43H_Quiz1_Question_SHN_Spring-26.docx",
      storage_path:
        "course-1/section-1/SE216_43H_Quiz1_Question_SHN_Spring-26.docx",
      storage_url: "https://example.com/quiz.docx",
      uploaded_at: "2026-06-29T00:00:00.000Z",
    },
  ];

  assert.deepEqual(calculateSlotCompletion([...slots], fileEntries), {
    uploaded: 1,
    required: 1,
    percentage: 100,
  });
});

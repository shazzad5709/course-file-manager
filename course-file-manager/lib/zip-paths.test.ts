import assert from "node:assert/strict";
import test from "node:test";

import {
  getCourseRootFolder,
  getSectionEntryRelativePath,
  getSectionRootFolder,
} from "./zip-paths";

test("builds course and section ZIP root folder names", () => {
  assert.equal(
    getCourseRootFolder({
      course_code: "SE232",
      coordinator_initial: "NT",
      semester: "Fall-25",
    }),
    "SE232_NT_Fall-25",
  );

  assert.equal(
    getSectionRootFolder({
      section_label: "43A",
      teacher_initial: "RK",
    }),
    "43A_RK",
  );
});

test("groups theory section files into nested export folders", () => {
  assert.equal(
    getSectionEntryRelativePath({
      document_category: "theory_final_script_highest",
      renamed_filename: "SE232_43A_Final_NT_Highest_Fall-25.pdf",
    }),
    "Final/SE232_43A_Final_NT_Highest_Fall-25.pdf",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "theory_quiz_2_question",
      renamed_filename: "SE232_43A_Quiz2_Question_NT_Fall-25.pdf",
    }),
    "Quiz/Quiz 2/SE232_43A_Quiz2_Question_NT_Fall-25.pdf",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "theory_gradesheet",
      renamed_filename: "SE232_43A_Gradesheet_NT_Fall-25.xlsx",
    }),
    "SE232_43A_Gradesheet_NT_Fall-25.xlsx",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "theory_cer",
      renamed_filename: "SE232_43A_NT_CER_Fall-25.xlsx",
    }),
    "SE232_43A_NT_CER_Fall-25.xlsx",
  );
});

test("groups lab section files into required export folders", () => {
  assert.equal(
    getSectionEntryRelativePath({
      document_category: "lab_final_script_highest",
      renamed_filename: "CSE110_43A_LabFinal_NT_Highest_Fall-25.pdf",
    }),
    "Lab Final/CSE110_43A_LabFinal_NT_Highest_Fall-25.pdf",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "lab_performance_rubrics",
      renamed_filename: "CSE110_43A_LabPerformance_Rubrics_NT_Fall-25.pdf",
    }),
    "Lab Performance/CSE110_43A_LabPerformance_Rubrics_NT_Fall-25.pdf",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "lab_report_average",
      renamed_filename: "CSE110_43A_LabReport_NT_Average_Fall-25.pdf",
    }),
    "Lab Report/CSE110_43A_LabReport_NT_Average_Fall-25.pdf",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "lab_cer",
      renamed_filename: "CSE110_43A_NT_CER_Fall-25.xlsx",
    }),
    "CSE110_43A_NT_CER_Fall-25.xlsx",
  );
});

test("groups project section files into required export folders", () => {
  assert.equal(
    getSectionEntryRelativePath({
      document_category: "project_lab_performance_document_highest",
      renamed_filename: "SE499_43A_LabPerformance_NT_Highest_Fall-25.pdf",
    }),
    "Lab Performance/SE499_43A_LabPerformance_NT_Highest_Fall-25.pdf",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "project_final_rubrics",
      renamed_filename: "SE499_43A_ProjectFinal_Rubrics_NT_Fall-25.pdf",
    }),
    "Project Final/SE499_43A_ProjectFinal_Rubrics_NT_Fall-25.pdf",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "project_report_marginal",
      renamed_filename: "SE499_43A_ProjectReport_NT_Marginal_Fall-25.pdf",
    }),
    "Final Project Report/SE499_43A_ProjectReport_NT_Marginal_Fall-25.pdf",
  );

  assert.equal(
    getSectionEntryRelativePath({
      document_category: "project_cer",
      renamed_filename: "SE499_43A_NT_CER_Fall-25.xlsx",
    }),
    "SE499_43A_NT_CER_Fall-25.xlsx",
  );
});

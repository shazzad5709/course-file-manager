export const COURSE_TYPES = ["Theory", "Lab", "Project"] as const;
export const SECTION_ROLES = ["Section Teacher", "Module Leader", "Both"] as const;

export type CourseType = (typeof COURSE_TYPES)[number];
export type SectionRole = (typeof SECTION_ROLES)[number];

export type Course = {
  id: string;
  course_code: string;
  course_name: string;
  course_type: CourseType;
  semester: string;
  coordinator_initial: string;
  created_at: string;
};

export type CourseInput = {
  course_code: string;
  course_name: string;
  course_type: CourseType;
  semester: string;
  coordinator_initial: string;
};

export type Section = {
  id: string;
  course_id: string;
  section_label: string;
  teacher_initial: string;
  role: SectionRole;
  created_at: string;
};

export type SectionInput = {
  course_id: string;
  section_label: string;
  teacher_initial: string;
  role: SectionRole;
};

export type FileEntry = {
  id: string;
  course_id: string;
  section_id: string | null;
  document_category: string;
  sub_category: "Highest" | "Average" | "Marginal" | null;
  quiz_number: 1 | 2 | 3 | null;
  original_filename: string;
  renamed_filename: string;
  storage_path: string;
  storage_url: string;
  uploaded_at: string;
};

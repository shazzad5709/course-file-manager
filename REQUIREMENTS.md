# Course File Manager — Requirements Document

## 1. Project Overview

A full-stack web application for managing, renaming, and organizing academic course files for accreditation submission. The user is a university lecturer who handles multiple courses, each with multiple sections, across semesters. The app automates the tedious work of renaming files to institution-mandated formats and arranging them into the correct directory structure for ZIP export.

**Stack:**
- Framework: Next.js (App Router)
- Package manager: npm
- Styling: Tailwind CSS + shadcn/ui
- Database: Supabase (PostgreSQL)
- File Storage: Supabase Storage
- Hosting: Vercel (free tier) + Supabase (free tier)
- Auth: None (V1 — single user, URL kept private)
- ZIP generation: Client-side via `jszip`

---

## 2. Core Concepts & Data Model

### 2.1 Course
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `course_code` | text | e.g. `SE232` |
| `course_name` | text | e.g. `Software Engineering` |
| `course_type` | enum | `Theory`, `Lab`, or `Project` — mutually exclusive |
| `semester` | text | e.g. `Fall-25`, `Spring-26` — per course, not global |
| `coordinator_initial` | text | e.g. `NT` — Module Leader's initials |
| `created_at` | timestamp | |

### 2.2 Section
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `course_id` | uuid | Foreign key → Course |
| `section_label` | text | Batch+section label, e.g. `43A`, `43B`, `44C` |
| `teacher_initial` | text | e.g. `NT`, `RK` |
| `role` | enum | `Section Teacher`, `Module Leader`, or `Both` |
| `created_at` | timestamp | |

### 2.3 File Entry
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `course_id` | uuid | Foreign key → Course |
| `section_id` | uuid \| null | Foreign key → Section (null for course-level files) |
| `document_category` | text | Slug identifying the document slot (see Section 5) |
| `sub_category` | text \| null | `Highest`, `Average`, or `Marginal` (for representative examples) |
| `quiz_number` | int \| null | `1`, `2`, or `3` (for quiz-specific slots) |
| `original_filename` | text | Preserved for reference |
| `renamed_filename` | text | Computed by app per naming rules |
| `storage_path` | text | Path in Supabase Storage bucket |
| `storage_url` | text | Public URL |
| `uploaded_at` | timestamp | |

---

## 3. Naming Convention Rules

The app constructs filenames automatically from course/section metadata. All fields are joined with underscores. Semester format is always `Fall-25` or `Spring-26` (Season-YY).

The `Category` field in filenames for representative examples is always one of: `Highest`, `Average`, `Marginal` (never `Excellent`).

### 3.1 Theory Course — Section-Level

| Slot | Naming Pattern |
|---|---|
| Final Exam Script (×3) | `CourseCode_Section_Final_TeacherInitial_Category_Semester.pdf` |
| Mid Exam Script (×3) | `CourseCode_Section_Mid_TeacherInitial_Category_Semester.pdf` |
| Quiz Script Q1/Q2/Q3 (×3 each) | `CourseCode_Section_Quiz[N]_TeacherInitial_Category_Semester.pdf` |
| Quiz Question Q1/Q2/Q3 | `CourseCode_Section_Quiz[N]_Question_TeacherInitial_Semester.pdf` |
| Assignment Report (×3) | `CourseCode_Section_Assignment_TeacherInitial_Category_Semester.pdf` |
| Assignment Gradesheet / Rubrics (Mark Sheet) | `CourseCode_Section_Assignment_Rubrics_TeacherInitial_Semester.xlsx` |
| Presentation Report (×3) | `CourseCode_Section_Presentation_TeacherInitial_Category_Semester.ppt` |
| Presentation Gradesheet / Rubrics (Mark Sheet) | `CourseCode_Section_Presentation_Rubrics_TeacherInitial_Semester.xlsx` |
| Attendance Report | `CourseCode_Section_TeacherInitial_Attendance_Report_Semester.pdf` |
| CER File | `CourseCode_Section_TeacherInitial_CER_Semester.xlsx` |

### 3.2 Theory Course — Course-Level (Module Leader)

| Slot | Naming Pattern |
|---|---|
| Course Outline | `CourseCode_CourseOutline_Semester.pdf` |
| Final Question Paper | `CourseCode_FinalQuestion_Semester.pdf` |
| Mid Question Paper | `CourseCode_MidQuestion_Semester.pdf` |
| Mid Question Moderation Form | `CourseCode_Mid_QMForm_Semester.xlsx` |
| Final Question Moderation Form | `CourseCode_Final_QMForm_Semester.xlsx` |
| Combined CER File | `CourseCode_CombinedCER_CoordinatorInitial_Semester.xlsx` |
| Semester End Report | `CourseCode_CourseReport_CoordinatorInitial_Semester.pdf` |
| Teacher's Profile / List | `CourseCode_TeachersList_CoordinatorInitial_Semester.pdf` |

### 3.3 Lab Course — Section-Level

| Slot | Naming Pattern |
|---|---|
| Lab Final Script (×3) | `CourseCode_Section_LabFinal_TeacherInitial_Category_Semester.pdf` |
| Lab Final Gradesheet / Rubrics | `CourseCode_Section_LabFinal_Rubrics_TeacherInitial_Semester.pdf` |
| Lab Final Question | `CourseCode_Section_LabFinal_Question_TeacherInitial_Semester.pdf` |
| Lab Report (×3) | `CourseCode_Section_LabReport_TeacherInitial_Category_Semester.pdf` |
| Lab Report Gradesheet / Rubrics | `CourseCode_Section_LabReport_Rubrics_TeacherInitial_Semester.pdf` |
| Lab Performance (×3) | `CourseCode_Section_LabMid_TeacherInitial_Category_Semester.pdf` |
| Lab Performance Question | `CourseCode_Section_LabPerformance_Question_TeacherInitial_Semester.pdf` |
| Lab Performance Gradesheet / Rubrics | `CourseCode_Section_LabPerformance_Rubrics_TeacherInitial_Semester.pdf` |
| Final Section-wise Gradesheet / Lab Tabulation Sheet | `CourseCode_Section_LabTabulationSheet_TeacherInitial_Semester.pdf` |
| Attendance Report | `CourseCode_Section_TeacherInitial_Attendance_Report_Semester.xlsx` |
| CER File | `CourseCode_Section_TeacherInitial_CER_Semester.xlsx` |
| Teacher's Profile (CV) | `CourseCode_Section_CV_TeacherInitial_Semester.xlsx` |
| Class Schedule | `CourseCode_Section_TeacherInitial_ClassSchedule_Semester.xlsx` |
| Lab Experiment List | `CourseCode_LabExperimentList_Section_TeacherInitial_Semester.pdf` |
| Lab Assignment List | `CourseCode_LabAssignmentsList_Section_TeacherInitial_Semester.pdf` |
| BLC Link Record | `CourseCode_BLC_Section_TeacherInitial_Semester.pdf` |

### 3.4 Lab Course — Course-Level (Module Leader)

| Slot | Naming Pattern |
|---|---|
| Assessment Criteria | `CourseCode_AssessmentCriteria_CoordinatorInitial_Semester.pdf` |
| Lab Manual | `CourseCode_LabManual_CoordinatorInitial_Semester.pdf` |
| Combined CER File | `CourseCode_CombinedCER_CoordinatorInitial_Semester.pdf` |
| Semester End Report | `CourseCode_CourseReport_CoordinatorInitial_Semester.pdf` |
| OBE Document | `CourseCode_OBE_CoordinatorInitial_Semester.pdf` |

### 3.5 Project Course — Section-Level

| Slot | Naming Pattern |
|---|---|
| Project Final Document (×3) | `CourseCode_Section_ProjectFinal_TeacherInitial_Category_Semester.pdf` |
| Project Final Gradesheet / Rubrics | `CourseCode_Section_ProjectFinal_Rubrics_TeacherInitial_Semester.pdf` |
| Project Report (×3) | `CourseCode_Section_ProjectReport_TeacherInitial_Category_Semester.pdf` |
| Project Report Gradesheet / Rubrics | `CourseCode_Section_ProjectReport_Rubrics_TeacherInitial_Semester.pdf` |
| Lab Performance Document (×3) | `CourseCode_Section_LabPerformance_TeacherInitial_Category_Semester.pdf` |
| Lab Performance Gradesheet / Rubrics | `CourseCode_Section_LabPerformance_Rubrics_TeacherInitial_Semester.pdf` |
| Final Section-wise Gradesheet / Project Tabulation Sheet | `CourseCode_Section_ProjectTabulationSheet_TeacherInitial_Semester.pdf` |
| Attendance Report | `CourseCode_Section_TeacherInitial_Attendance_Report_Semester.xlsx` |
| Project List | `CourseCode_Section_TeacherInitial_ProjectList_Semester.xlsx` |
| CER File | `CourseCode_Section_TeacherInitial_CER_Semester.xlsx` |

### 3.6 Project Course — Course-Level (Module Leader)

| Slot | Naming Pattern |
|---|---|
| Combined CER File | `CourseCode_CombinedCER_CoordinatorInitial_Semester.pdf` |
| Semester End Report | `CourseCode_CourseReport_CoordinatorInitial_Semester.pdf` |

---

## 4. ZIP Export Directory Structure

### If user is Module Leader / Course Coordinator for the course:
```
CourseCode_CoordinatorInitial_Semester/
├── [course-level files]
├── CourseCode_43A_TeacherInitial_Semester/
│   └── [section-level files for Section 43A]
└── CourseCode_43B_TeacherInitial_Semester/
    └── [section-level files for Section 43B]
```

### If user is Section Teacher only:
```
Section_TeacherInitial/
└── [section-level files]
```

### Example (Theory, Module Leader):
```
SE232_NT_Fall-25/
├── SE232_CourseOutline_Fall-25.pdf
├── SE232_FinalQuestion_Fall-25.pdf
├── SE232_MidQuestion_Fall-25.pdf
├── SE232_CombinedCER_NT_Fall-25.xlsx
├── SE232_CourseReport_NT_Fall-25.pdf
├── SE232_43A_NT_Fall-25/
│   ├── SE232_43A_Final_NT_Highest_Fall-25.pdf
│   ├── SE232_43A_Final_NT_Average_Fall-25.pdf
│   ├── SE232_43A_Final_NT_Marginal_Fall-25.pdf
│   └── ...
└── SE232_43B_RK_Fall-25/
    └── ...
```

---

## 5. Application Pages & UI Structure

### 5.1 Dashboard (`/`)
- Lists all courses as cards
- Each card shows: course code, name, type badge, semester, overall completion % progress bar
- Filter bar: by semester, by course type
- "Add Course" button → opens modal/dialog

### 5.2 Course Detail Page (`/courses/[id]`)
- Course metadata header (code, name, type, semester, coordinator initial)
- Edit / Delete course buttons
- Two panels:
  - **Course-level documents** — slots for Module Leader files (visible only if role includes coordinator)
  - **Sections** — list of sections, each as a card with completion progress + "Open Section" link
- "Add Section" button

### 5.3 Section Detail Page (`/courses/[id]/sections/[sectionId]`)
- Section header: course code + section label + teacher initial
- Progress bar: `X of Y required files uploaded`
- All required document slots for this section rendered as a checklist/grid
- Each slot shows:
  - Category label
  - Sub-category if applicable (Highest / Average / Marginal)
  - Drop zone if empty — drag a file here or click to browse
  - If uploaded: renamed filename + download button + delete button
- Missing slots highlighted visually

### 5.4 Course Management (`/settings` or inline modals)
- Add / Edit / Delete courses
- Add / Edit / Delete sections within a course
- Fields: course code, course name, course type, semester, coordinator initial, section label, teacher initial, role

---

## 6. Theme System

Three modes switchable via navbar toggle, persisted in `localStorage`.

Implemented as CSS custom properties on `[data-theme]` attribute of `<html>`, consumed by Tailwind via `var()`.

### Light Mode
shadcn/ui default light theme (clean white/gray).

### Sepia Mode
Warm parchment tones inspired by quran.com sepia palette:
- Background: `#f8ebd5` / Elevated: `#fff7ea`
- Alt background: `#efe2cd`
- Text default: `#010101` / Faded: `#666666`
- Primary accent: `#72603f`
- Border: `#dbccb3`
- Scrollbar thumb: `#f0cd8c`

### Dark Mode
Soft dark (not pure black) inspired by quran.com dark palette:
- Background: `#1f2125` / Elevated: `#1f2125`
- Alt background: `#2a2d31` / Faint: `#343a40`
- Text default: `#e7e9ea` / Faded: `#777777`
- Primary accent: `#2ca4ab`
- Border: `rgb(70, 75, 80)`
- Scrollbar thumb: `#4a4f56`

---

## 7. File Upload & Rename Flow

1. User opens a section or course-level document page
2. Each required document is shown as a labeled slot/drop zone
3. User drags a file into the appropriate slot (or clicks to browse)
4. App computes the renamed filename from metadata
5. File is uploaded to Supabase Storage under the renamed filename
6. Slot updates to ✅ showing renamed filename + download + delete options
7. Delete → hard deletes from Supabase Storage, slot returns to empty

---

## 8. Completion Tracking

- Each section has a required document count derived from course type
- Progress shown as `X of Y files uploaded` with a visual progress bar
- Dashboard aggregates per-course across all sections
- Empty required slots visually distinguished from uploaded ones

---

## 9. Supabase Setup

### Database Tables
- `courses` — stores course metadata
- `sections` — stores section metadata, FK to courses
- `file_entries` — stores file metadata + storage path, FK to courses + sections

### Storage
- Single bucket: `course-files`
- Path convention: `{course_id}/{section_id}/{renamed_filename}` for section files
- Path convention: `{course_id}/course-level/{renamed_filename}` for course files
- Public URLs used for downloads

---

## 10. Out of Scope for V1

- Authentication (add in V2 via Supabase Auth)
- Multi-user / team support
- Semester archiving / browsing past semesters
- Bulk local folder rename without upload
- Submission deadline reminders
- Items 16–18 of Theory checklist (Class Schedule, Lesson Plan, Sample Lecture Notes) — no renaming needed, excluded

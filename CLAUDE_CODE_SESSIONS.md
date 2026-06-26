# Claude Code Session Prompts — Course File Manager

> **How to use:** Run these sessions in order. Start each new Claude Code session by saying "Read REQUIREMENTS.md first" before pasting the session prompt. Each session is designed to be self-contained and end in a working, testable state.

---

## Session 1 — Project Scaffold & Supabase Setup

```
Read REQUIREMENTS.md first.

Set up the Next.js project and Supabase integration from scratch.

Tasks:
1. Initialize a new Next.js project (App Router, TypeScript, Tailwind CSS) using npm. Project name: course-file-manager.
2. Install and initialize shadcn/ui with the default (neutral) theme.
3. Install additional dependencies: @supabase/supabase-js, jszip.
4. Create a Supabase client utility at lib/supabase.ts using environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
5. Create a .env.local.example file showing the required environment variables.
6. Create the following Supabase SQL schema (provide as supabase/schema.sql so I can run it in the Supabase SQL editor):
   - courses table (id uuid PK, course_code text, course_name text, course_type text CHECK IN ('Theory','Lab','Project'), semester text, coordinator_initial text, created_at timestamptz default now())
   - sections table (id uuid PK, course_id uuid FK→courses, section_label text, teacher_initial text, role text CHECK IN ('Section Teacher','Module Leader','Both'), created_at timestamptz default now())
   - file_entries table (id uuid PK, course_id uuid FK→courses, section_id uuid FK→sections nullable, document_category text, sub_category text nullable, quiz_number int nullable, original_filename text, renamed_filename text, storage_path text, storage_url text, uploaded_at timestamptz default now())
7. Add instructions in a README.md for: creating the Supabase project, running the schema, creating the storage bucket named course-files with public access, and setting up .env.local.

Do not build any UI yet. End with a working npm run dev with no errors.
```

---

## Session 2 — Theme System & Layout Shell

```
Read REQUIREMENTS.md first.

Build the global theme system and the app shell layout. Do not touch any data or Supabase logic yet.

Tasks:
1. In globals.css, define three CSS theme layers using [data-theme] attribute:
   - [data-theme="light"]: shadcn default light (white/gray)
   - [data-theme="sepia"]: warm parchment palette from REQUIREMENTS.md Section 6
   - [data-theme="dark"]: soft dark palette from REQUIREMENTS.md Section 6
   Map these to Tailwind CSS custom properties so components can use bg-[var(--background)], text-[var(--text-default)], etc.
2. Create a ThemeProvider context (components/theme-provider.tsx) that:
   - Reads theme from localStorage on mount (default: light)
   - Sets data-theme on <html>
   - Exposes useTheme() hook returning { theme, setTheme }
3. Create a ThemeToggle component (components/theme-toggle.tsx) that cycles between light → sepia → dark with a single icon button using shadcn Button + a sun/moon/book icon from lucide-react.
4. Create the root layout (app/layout.tsx) with:
   - ThemeProvider wrapping everything
   - A top navbar with: app name "Course File Manager" on the left, ThemeToggle on the right
   - A main content area below
5. Create a minimal homepage (app/page.tsx) that just renders a placeholder heading "Dashboard" so we can verify the theme toggle works.
6. Make sure the navbar and body backgrounds respond correctly to all three themes.

End with a working, themed app shell where switching modes visually changes the color scheme.
```

---

## Session 3 — Course Management (CRUD)

```
Read REQUIREMENTS.md first.

Build the full course management feature. This session covers creating, editing, and deleting courses, and listing them on the dashboard.

Tasks:
1. Create a server action or API route layer at lib/actions/courses.ts with functions: getCourses(), createCourse(data), updateCourse(id, data), deleteCourse(id). Use the Supabase client from lib/supabase.ts.
2. Build the Dashboard page (app/page.tsx):
   - Fetch and display all courses as cards using shadcn Card
   - Each card shows: course code (bold), course name, a Badge for course type (Theory/Lab/Project with distinct colors), semester, and a completion progress bar (placeholder 0% for now)
   - A filter bar at the top to filter by semester and course type
   - An "Add Course" button that opens a Dialog/Sheet
3. Build the Add/Edit Course Dialog (components/course-dialog.tsx):
   - Fields: Course Code, Course Name, Course Type (select: Theory/Lab/Project), Semester (text, e.g. Fall-25), Coordinator Initial
   - Validates all fields are non-empty before submitting
   - On submit: calls createCourse or updateCourse, closes dialog, refreshes list
4. Add Edit and Delete actions to each course card (dropdown menu via shadcn DropdownMenu):
   - Edit → opens pre-filled dialog
   - Delete → confirms with an AlertDialog before deleting
5. Clicking a course card navigates to /courses/[id] (just a placeholder page for now).

End with a fully working course CRUD on the dashboard.
```

---

## Session 4 — Section Management (CRUD)

```
Read REQUIREMENTS.md first.

Build section management inside the Course Detail page.

Tasks:
1. Create lib/actions/sections.ts with: getSectionsByCourse(courseId), createSection(data), updateSection(id, data), deleteSection(id).
2. Build the Course Detail page (app/courses/[id]/page.tsx):
   - Header showing course code, course name, type badge, semester, coordinator initial
   - Edit Course and Delete Course buttons (reuse dialog from Session 3)
   - A "Course-level Documents" panel (placeholder card — will be built in Session 6)
   - A "Sections" panel listing sections as cards with: section label, teacher initial, role badge, placeholder completion progress (0%)
   - "Add Section" button that opens a dialog
3. Build the Add/Edit Section Dialog (components/section-dialog.tsx):
   - Fields: Section Label (text, e.g. A, B), Teacher Initial, Role (select: Section Teacher / Module Leader / Both)
   - Validates all fields before submit
   - On submit: creates/updates section, refreshes list
4. Each section card has Edit and Delete actions (dropdown, with AlertDialog confirm for delete).
5. Clicking a section card navigates to /courses/[id]/sections/[sectionId] (placeholder for now).

End with full section CRUD inside the course detail page.
```

---

## Session 5 — Document Slot Engine

```
Read REQUIREMENTS.md first.

This is the core logic session. Build the document slot definition system — the engine that knows which files are required for each course type and generates correct filenames.

Tasks:
1. Create lib/slots.ts — a pure TypeScript module (no Supabase, no UI) that exports:

   a. A type SlotDefinition:
      {
        category: string,         // unique slug, e.g. "final_script_highest"
        label: string,            // human-readable, e.g. "Final Exam Script — Highest"
        subCategory: string|null, // "Highest" | "Average" | "Marginal" | null
        quizNumber: number|null,  // 1 | 2 | 3 | null
        level: "section" | "course",
        expectedExtension: string // e.g. ".pdf", ".xlsx", ".ppt"
      }

   b. THEORY_SECTION_SLOTS: SlotDefinition[] — all 10 section-level slot groups from REQUIREMENTS.md Section 3.1 (note: quiz has 3×4 = 12 slots, representative examples have 3 slots each)
   
   c. THEORY_COURSE_SLOTS: SlotDefinition[] — all 8 course-level slots from Section 3.2
   
   d. LAB_SECTION_SLOTS: SlotDefinition[] — all 15 section-level slots from Section 3.3
   
   e. LAB_COURSE_SLOTS: SlotDefinition[] — all 5 course-level slots from Section 3.4
   
   f. PROJECT_SECTION_SLOTS: SlotDefinition[] — all 10 section-level slots from Section 3.5
   
   g. PROJECT_COURSE_SLOTS: SlotDefinition[] — all 2 course-level slots from Section 3.6
   
   h. getSlotsForCourse(courseType, level): SlotDefinition[] — returns the right slot list

2. Create lib/naming.ts — exports a pure function:
   generateFilename(slot: SlotDefinition, params: {
     courseCode: string,
     sectionLabel?: string,
     teacherInitial?: string,
     coordinatorInitial?: string,
     semester: string
   }): string
   
   This function implements ALL naming rules from REQUIREMENTS.md Section 3 exactly.
   Write unit-testable logic — no side effects.

3. Write tests in lib/slots.test.ts and lib/naming.test.ts using Node's built-in test runner or Jest (whichever is already configured). Test at least:
   - Correct filename for Final Exam Script Highest, Theory course
   - Correct filename for Quiz 2 Question, Theory course
   - Correct filename for Lab Performance Rubrics, Lab course
   - Correct filename for Combined CER, Project course (coordinator level)
   - Correct total slot counts per course type

End with passing tests and no UI changes.
```

---

## Session 6 — Section File Upload UI

```
Read REQUIREMENTS.md first.

Build the Section Detail page where the user uploads files into labeled slots.

Tasks:
1. Create lib/actions/files.ts with:
   - getFileEntriesBySection(sectionId): returns all uploaded file_entries for a section
   - uploadFile(file: File, slot: SlotDefinition, courseId, sectionId, course, section): 
     * generates the renamed filename using generateFilename() from lib/naming.ts
     * uploads to Supabase Storage at path: {courseId}/{sectionId}/{renamedFilename}
     * inserts a file_entry record
     * returns the created entry
   - deleteFile(fileEntryId, storagePath): deletes from Storage + deletes DB record

2. Build the Section Detail page (app/courses/[id]/sections/[sectionId]/page.tsx):
   - Header: "CourseCode — Section X" with teacher initial and role badge
   - Progress bar: "X of Y required files uploaded" using shadcn Progress
   - Render all required slots for this section (from getSlotsForCourse, level "section")
   - Group slots visually by category (e.g. "Final Exam Scripts", "Mid Exam Scripts", etc.)
   - Each slot rendered as a SlotCard component

3. Build components/slot-card.tsx:
   - If empty: shows category label, expected file type badge, and a drop zone (drag-and-drop + click-to-browse via <input type="file">)
   - If uploaded: shows ✅ icon, the renamed filename, a Download button (links to storage_url), and a Delete button (with confirm)
   - Drop zone accepts the expected file extension only (warn but don't hard-block other types)
   - Shows a loading spinner during upload

4. On file drop/select:
   - Call uploadFile() action
   - Optimistically update the slot to uploaded state
   - Show error toast (shadcn Sonner/Toast) on failure

End with a fully working section upload page where files can be added and deleted per slot.
```

---

## Session 7 — Course-Level Documents UI

```
Read REQUIREMENTS.md first.

Build the course-level document slots panel inside the Course Detail page (for Module Leader files).

Tasks:
1. Create lib/actions/files.ts additions (or a separate uploadCourseFile function):
   - uploadCourseFile(file, slot, courseId, course): uploads to {courseId}/course-level/{renamedFilename}, inserts file_entry with section_id = null
   - getFileEntriesByCourse(courseId, sectionId = null): fetch course-level entries (where section_id IS NULL)

2. In the Course Detail page (app/courses/[id]/page.tsx):
   - Show the "Course-level Documents" panel only if the course has a coordinator_initial set AND at least one section has role "Module Leader" or "Both"
   - Render course-level slots (from getSlotsForCourse, level "course") using the same SlotCard component from Session 6
   - Show a course-level progress indicator: "X of Y course-level files uploaded"

3. Ensure the overall course completion % on the Dashboard card now reflects both section-level AND course-level file progress combined.

End with course-level file upload working and dashboard progress accurate.
```

---

## Session 8 — ZIP Export

```
Read REQUIREMENTS.md first.

Build the ZIP export feature using jszip, client-side.

Tasks:
1. Create lib/zip.ts — a client-side utility using jszip that:
   - Accepts: course metadata, sections metadata, all file_entries (with storage_url and renamed_filename)
   - Builds the correct directory structure per REQUIREMENTS.md Section 4:
     * If role includes coordinator: root folder = CourseCode_CoordinatorInitial_Semester, with course-level files at root and one subfolder per section named CourseCode_SectionLabel_TeacherInitial_Semester
     * If section teacher only: root folder = SectionLabel_TeacherInitial
   - Fetches each file from its storage_url (fetch → blob)
   - Adds to ZIP at the correct path with the renamed_filename
   - Returns the ZIP as a downloadable Blob

2. Add an "Export ZIP" button to the Course Detail page (app/courses/[id]/page.tsx):
   - Shows a loading state while building ZIP (fetching files can take a moment)
   - Triggers browser download of the ZIP file named CourseCode_CoordinatorInitial_Semester.zip
   - Shows a toast on success or failure

3. Add individual file download buttons on each SlotCard (already linked to storage_url — verify these work correctly as direct downloads with the correct renamed filename, not a UUID path).

4. Add an "Export Section ZIP" button on the Section Detail page for downloading just one section's files.

End with working ZIP export at both course and section level.
```

---

## Session 9 — Polish, Empty States & UX Refinements

```
Read REQUIREMENTS.md first.

This is the final polish session. Improve UX, add empty states, and make the app production-ready.

Tasks:
1. Empty states:
   - Dashboard with no courses: friendly illustration-free empty state with "Add your first course" CTA
   - Course detail with no sections: "Add your first section" prompt
   - Section detail with all slots empty: a brief instructional note explaining the drag-and-drop workflow

2. Completion indicators:
   - Dashboard course cards: color-code the progress bar (red <33%, yellow 33–66%, green >66%)
   - Section page: show which specific slots are still missing in a collapsible "Missing files" summary at the top

3. Navigation:
   - Add breadcrumb navigation (shadcn Breadcrumb) on Course Detail and Section Detail pages: Dashboard → Course Name → Section Label
   - Back buttons where appropriate

4. Responsive layout:
   - Ensure dashboard card grid is responsive (1 col mobile, 2 col tablet, 3 col desktop)
   - Section slot grid responsive (1 col mobile, 2 col desktop)

5. Error handling:
   - Wrap all Supabase calls in try/catch with user-facing toast errors
   - Handle Supabase Storage upload errors gracefully (show which slot failed)

6. Filter persistence:
   - Remember last selected filter (semester/type) in the dashboard using localStorage or URL search params

7. Final check:
   - Verify all three themes (light/sepia/dark) look correct on all pages
   - Verify ZIP export produces correctly named files and folders
   - Verify all naming patterns match REQUIREMENTS.md Section 3 exactly

End with a polished, fully functional app ready for daily use.
```

---

## Quick Reference — Key Decisions

| Decision | Choice |
|---|---|
| Router | App Router |
| Package manager | npm |
| Component library | shadcn/ui |
| Database | Supabase PostgreSQL |
| File storage | Supabase Storage (bucket: `course-files`) |
| ZIP library | jszip (client-side) |
| Theme toggle | light → sepia → dark, persisted in localStorage |
| Auth | None (V1) |
| Hosting | Vercel + Supabase free tier |

## Quick Reference — Naming Pattern Summary

All filenames use underscores as separators. Semester format: `Fall-25` / `Spring-26`.

- **Section-level pattern:** `CourseCode_Section_DocumentType_TeacherInitial[_Category][_QuizN]_Semester.ext`
- **Course-level pattern:** `CourseCode_DocumentType[_CoordinatorInitial]_Semester.ext`
- **Category values:** `Highest`, `Average`, `Marginal` (never `Excellent`)
- **Quiz values:** `Quiz1`, `Quiz2`, `Quiz3`

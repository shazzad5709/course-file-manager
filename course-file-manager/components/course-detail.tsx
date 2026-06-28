"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileArchive, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteCourse } from "@/lib/actions/courses";
import { deleteFile, uploadCourseFile } from "@/lib/actions/files";
import { deleteSection } from "@/lib/actions/sections";
import { generateFilename } from "@/lib/naming";
import {
  calculateSlotCompletion,
  getFileEntryKey,
  getSlotKey,
  hasCourseLevelRequirements,
} from "@/lib/progress";
import { getSlotsForCourse, type SlotDefinition } from "@/lib/slots";
import type {
  Course,
  CourseType,
  FileEntry,
  Section,
  SectionRole,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  buildCourseZip,
  downloadBlob,
  getCourseZipFilename,
} from "@/lib/zip";
import { CourseDialog } from "@/components/course-dialog";
import { SectionDialog } from "@/components/section-dialog";
import { SlotCard } from "@/components/slot-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

type CourseDetailProps = {
  course: Course;
  sections: Section[];
  courseLevelSlots: SlotDefinition[];
  courseLevelFileEntries: FileEntry[];
  allFileEntries: FileEntry[];
};

const COURSE_TYPE_STYLES: Record<CourseType, string> = {
  Theory:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  Lab:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  Project:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

const ROLE_STYLES: Record<SectionRole, string> = {
  "Section Teacher":
    "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200",
  "Module Leader":
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
  Both:
    "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200",
};

export function CourseDetail({
  course,
  sections,
  courseLevelSlots,
  courseLevelFileEntries,
  allFileEntries,
}: CourseDetailProps) {
  const router = useRouter();
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [courseEntries, setCourseEntries] = useState(courseLevelFileEntries);
  const sectionSlots = useMemo(
    () => getSlotsForCourse(course.course_type, "section"),
    [course.course_type],
  );
  const courseEntryBySlotKey = useMemo(() => {
    const map = new Map<string, FileEntry>();

    for (const entry of courseEntries) {
      map.set(getFileEntryKey(entry), entry);
    }

    return map;
  }, [courseEntries]);
  const showCourseLevelDocuments = hasCourseLevelRequirements(course, sections);
  const isProjectCourse = course.course_type === "Project";
  const courseLevelCompletion = calculateSlotCompletion(
    courseLevelSlots,
    courseEntries,
  );

  function getSectionCompletion(section: Section) {
    return calculateSlotCompletion(
      sectionSlots,
      allFileEntries.filter((entry) => entry.section_id === section.id),
    );
  }

  function openCreateSectionDialog() {
    setEditingSection(null);
    setSectionDialogOpen(true);
  }

  function openEditSectionDialog(section: Section) {
    setEditingSection(section);
    setSectionDialogOpen(true);
  }

  async function confirmDeleteCourse() {
    try {
      await deleteCourse(course.id);
      setDeleteCourseOpen(false);
      toast.success("Course deleted.");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete course.",
      );
    }
  }

  async function confirmDeleteSection() {
    if (!deletingSection) {
      return;
    }

    try {
      await deleteSection(deletingSection.id, course.id);
      setDeletingSection(null);
      toast.success("Section deleted.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete section.",
      );
    }
  }

  async function handleCourseFileUpload(slot: SlotDefinition, file: File) {
    const slotKey = getSlotKey(slot);
    const optimisticEntry: FileEntry = {
      id: `optimistic:${slotKey}`,
      course_id: course.id,
      section_id: null,
      document_category: slot.category,
      sub_category: slot.subCategory,
      quiz_number: slot.quizNumber,
      original_filename: file.name,
      renamed_filename: generateFilename(slot, {
        courseCode: course.course_code,
        coordinatorInitial: course.coordinator_initial,
        semester: course.semester,
      }),
      storage_path: "",
      storage_url: "",
      uploaded_at: new Date().toISOString(),
    };

    setCourseEntries((current) => [
      optimisticEntry,
      ...current.filter((entry) => getFileEntryKey(entry) !== slotKey),
    ]);

    try {
      const uploadedEntry = await uploadCourseFile(
        file,
        slot,
        course.id,
        course,
      );

      toast.success("File uploaded.");
      setCourseEntries((current) => [
        uploadedEntry,
        ...current.filter((entry) => getFileEntryKey(entry) !== slotKey),
      ]);

      return uploadedEntry;
    } catch (error) {
      setCourseEntries((current) =>
        current.filter((entry) => entry.id !== optimisticEntry.id),
      );
      throw error;
    }
  }

  async function handleCourseFileDelete(fileEntry: FileEntry) {
    await deleteFile(fileEntry.id, fileEntry.storage_path);
    setCourseEntries((current) =>
      current.filter((entry) => entry.id !== fileEntry.id),
    );
  }

  async function handleExportZip() {
    if (isExportingZip) {
      return;
    }

    const exportEntries = [
      ...courseEntries.filter((entry) => !entry.id.startsWith("optimistic:")),
      ...allFileEntries.filter((entry) => entry.section_id !== null),
    ];

    if (exportEntries.length === 0) {
      toast.error("No uploaded files to export.");
      return;
    }

    setIsExportingZip(true);

    try {
      const blob = await buildCourseZip({
        course,
        sections,
        fileEntries: exportEntries,
      });

      downloadBlob(blob, getCourseZipFilename(course));
      toast.success("Course ZIP exported.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ZIP export failed.");
    } finally {
      setIsExportingZip(false);
    }
  }

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: course.course_name },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="space-y-3">
          <Button
            variant="link"
            className="h-auto px-0"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeft />
            Dashboard
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-normal">
                {course.course_code}
              </h1>
              <Badge
                variant="outline"
                className={cn(COURSE_TYPE_STYLES[course.course_type])}
              >
                {course.course_type}
              </Badge>
            </div>
            <p className="mt-2 text-base text-[var(--text-faded)]">
              {course.course_name}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {!isProjectCourse ? (
              <Button
                variant="outline"
                onClick={handleExportZip}
                disabled={isExportingZip}
              >
                <FileArchive />
                {isExportingZip ? "Exporting..." : "Export ZIP"}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setCourseDialogOpen(true)}>
              Edit Course
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteCourseOpen(true)}
            >
              Delete Course
            </Button>
          </div>

          <dl className="grid w-full gap-3 rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-3 text-sm sm:grid-cols-3 lg:w-[360px]">
            <div>
              <dt className="text-[var(--text-faded)]">Semester</dt>
              <dd className="font-medium">{course.semester}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-faded)]">Coordinator</dt>
              <dd className="font-medium">{course.coordinator_initial}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-faded)]">Sections</dt>
              <dd className="font-medium">{sections.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      {isProjectCourse ? (
        <Card className="rounded-lg">
          <CardContent className="py-10">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-[var(--text-faded)]">
                Project course workflow
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Coming soon...</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-faded)]">
                Project course uploads and exports are paused while the folder
                structure and file distribution are finalized. You can still
                edit or delete this course for now.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isProjectCourse && showCourseLevelDocuments ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Course-level Documents
              </h2>
              <p className="mt-1 text-sm text-[var(--text-faded)]">
                Module Leader files stored under this course.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-4">
            <Progress value={courseLevelCompletion.percentage}>
              <ProgressLabel>
                {courseLevelCompletion.uploaded} of{" "}
                {courseLevelCompletion.required} course-level files uploaded
              </ProgressLabel>
              <ProgressValue />
            </Progress>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {courseLevelSlots.map((slot) => (
              <SlotCard
                key={getSlotKey(slot)}
                slot={slot}
                fileEntry={courseEntryBySlotKey.get(getSlotKey(slot)) ?? null}
                onUpload={handleCourseFileUpload}
                onDelete={handleCourseFileDelete}
              />
            ))}
          </div>
        </section>
      ) : null}

      {!isProjectCourse ? (
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Sections</h2>
            <p className="mt-1 text-sm text-[var(--text-faded)]">
              Manage section teachers and section-level progress.
            </p>
          </div>
          <Button onClick={openCreateSectionDialog}>
            <Plus />
            Add Section
          </Button>
        </div>

        {sections.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => {
              const sectionCompletion = getSectionCompletion(section);

              return (
                  <Card
                    key={section.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer rounded-lg transition hover:border-[var(--primary)] hover:ring-[var(--primary)]/30"
                    onClick={() =>
                      router.push(
                        `/courses/${course.id}/sections/${section.id}`,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(
                          `/courses/${course.id}/sections/${section.id}`,
                        );
                      }
                    }}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Section {section.section_label}
                      </CardTitle>
                      <CardDescription>
                        Teacher: {section.teacher_initial}
                      </CardDescription>
                      <CardAction onClick={(event) => event.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                aria-label={`Open actions for section ${section.section_label}`}
                                variant="ghost"
                                size="icon"
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem
                              onClick={() => openEditSectionDialog(section)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeletingSection(section)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Badge
                        variant="outline"
                        className={cn(ROLE_STYLES[section.role])}
                      >
                        {section.role}
                      </Badge>
                      <Progress value={sectionCompletion.percentage}>
                        <ProgressLabel>
                          {sectionCompletion.uploaded} of{" "}
                          {sectionCompletion.required} files uploaded
                        </ProgressLabel>
                        <ProgressValue />
                      </Progress>
                    </CardContent>
                  </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-lg">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div>
                <h3 className="text-lg font-semibold">No sections yet</h3>
                <p className="mt-2 max-w-md text-sm text-[var(--text-faded)]">
                  Add the first section to start uploading section-level course
                  files.
                </p>
              </div>
              <Button onClick={openCreateSectionDialog}>
                <Plus />
                Add your first section
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
      ) : null}

      {courseDialogOpen ? (
        <CourseDialog
          key={course.id}
          course={course}
          open={courseDialogOpen}
          onOpenChange={setCourseDialogOpen}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {sectionDialogOpen ? (
        <SectionDialog
          key={editingSection?.id ?? "new-section"}
          courseId={course.id}
          section={editingSection}
          open={sectionDialogOpen}
          onOpenChange={setSectionDialogOpen}
          onSaved={() => router.refresh()}
        />
      ) : null}

      <AlertDialog open={deleteCourseOpen} onOpenChange={setDeleteCourseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {course.course_code}, its sections, and related
              file records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteCourse}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deletingSection)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSection(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete Section {deletingSection?.section_label} and any
              related file records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDeleteSection}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

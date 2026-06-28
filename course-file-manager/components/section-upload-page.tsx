"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileArchive } from "lucide-react";
import { toast } from "sonner";

import { deleteFile, uploadFile } from "@/lib/actions/files";
import { generateFilename } from "@/lib/naming";
import type { SlotDefinition } from "@/lib/slots";
import type { Course, FileEntry, Section } from "@/lib/types";
import {
  buildSectionZip,
  downloadBlob,
  getSectionZipFilename,
} from "@/lib/zip";
import { SlotCard } from "@/components/slot-card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";

type SectionUploadPageProps = {
  course: Course;
  section: Section;
  slots: SlotDefinition[];
  fileEntries: FileEntry[];
};

type SlotGroup = {
  title: string;
  slots: SlotDefinition[];
};

const GROUP_ORDER = [
  "CER",
  "Mid",
  "Final",
  "Quiz 1",
  "Quiz 2",
  "Quiz 3",
  "Assignment",
  "Presentation",
  "Gradesheet",
  "Attendance report",
  "Class Routine",
  "Lecture Sample",
  "Teacher's Profile",
  "Lab Final",
  "Lab Performance",
  "Lab Reports",
  "Lab Experiment List",
  "Lab Assignment List",
  "Project Final",
  "Project Reports",
  "Project List",
  "Other Documents",
];

const RECORD_GROUP_TITLES = new Set(["Gradesheet", "Attendance report"]);

const DOCUMENT_GROUP_TITLES = new Set([
  "Class Routine",
  "Lecture Sample",
  "Teacher's Profile",
]);

const ROLE_STYLES = {
  "Section Teacher":
    "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200",
  "Module Leader":
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
  Both:
    "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200",
};

function getSlotKey(slot: SlotDefinition) {
  return `${slot.category}:${slot.subCategory ?? ""}:${slot.quizNumber ?? ""}`;
}

function getFileEntryKey(fileEntry: FileEntry) {
  return `${fileEntry.document_category}:${fileEntry.sub_category ?? ""}:${
    fileEntry.quiz_number ?? ""
  }`;
}

function getGroupTitle(slot: SlotDefinition) {
  const category = slot.category;

  if (category.endsWith("_cer")) return "CER";
  if (category.includes("mid_script")) return "Mid";
  if (category.includes("final_script")) return "Final";
  if (category.includes("quiz_1")) return "Quiz 1";
  if (category.includes("quiz_2")) return "Quiz 2";
  if (category.includes("quiz_3")) return "Quiz 3";
  if (category.includes("assignment")) return "Assignment";
  if (category.includes("presentation")) return "Presentation";
  if (category.includes("gradesheet") || category.includes("tabulation")) {
    return "Gradesheet";
  }
  if (category.includes("attendance")) return "Attendance report";
  if (
    category.includes("class_routine") ||
    category.includes("class_schedule")
  ) {
    return "Class Routine";
  }
  if (category.includes("lecture_sample") || category.includes("blc")) {
    return "Lecture Sample";
  }
  if (category.includes("teacher_profile") || category === "lab_cv") {
    return "Teacher's Profile";
  }
  if (category.includes("lab_final")) return "Lab Final";
  if (category.includes("lab_report")) return "Lab Reports";
  if (category.includes("lab_performance")) return "Lab Performance";
  if (category.includes("experiment")) return "Lab Experiment List";
  if (category.includes("assignment_list")) return "Lab Assignment List";
  if (category.includes("project_final")) return "Project Final";
  if (category.includes("project_report")) return "Project Reports";
  if (category.includes("project_list")) return "Project List";

  return "Other Documents";
}

function groupSlots(slots: SlotDefinition[]): SlotGroup[] {
  const groups = new Map<string, SlotDefinition[]>();

  for (const slot of slots) {
    const title = getGroupTitle(slot);
    groups.set(title, [...(groups.get(title) ?? []), slot]);
  }

  return Array.from(groups, ([title, groupedSlots]) => ({
    title,
    slots: groupedSlots,
  })).sort((left, right) => {
    const leftIndex = GROUP_ORDER.indexOf(left.title);
    const rightIndex = GROUP_ORDER.indexOf(right.title);

    return (
      (leftIndex === -1 ? GROUP_ORDER.length : leftIndex) -
      (rightIndex === -1 ? GROUP_ORDER.length : rightIndex)
    );
  });
}

function isGroupComplete(
  group: SlotGroup,
  entryBySlotKey: Map<string, FileEntry>,
) {
  return group.slots.every((slot) => entryBySlotKey.has(getSlotKey(slot)));
}

function isCompactGroup(group: SlotGroup) {
  return DOCUMENT_GROUP_TITLES.has(group.title) && group.slots.length === 1;
}

function isRecordGroup(group: SlotGroup) {
  return RECORD_GROUP_TITLES.has(group.title) && group.slots.length === 1;
}

function getGroupUploadedCount(
  group: SlotGroup,
  entryBySlotKey: Map<string, FileEntry>,
) {
  return group.slots.filter((slot) => entryBySlotKey.has(getSlotKey(slot)))
    .length;
}

function renderGroupSlots(
  group: SlotGroup,
  displayEntryBySlotKey: Map<string, FileEntry>,
  handleUpload: (slot: SlotDefinition, file: File) => Promise<FileEntry>,
  handleDelete: (fileEntry: FileEntry) => Promise<void>,
) {
  return group.slots.map((slot) => (
    <SlotCard
      key={getSlotKey(slot)}
      slot={slot}
      fileEntry={displayEntryBySlotKey.get(getSlotKey(slot)) ?? null}
      onUpload={handleUpload}
      onDelete={handleDelete}
    />
  ));
}

export function SectionUploadPage({
  course,
  section,
  slots,
  fileEntries,
}: SectionUploadPageProps) {
  const [entries, setEntries] = useState(fileEntries);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const displayEntryBySlotKey = useMemo(() => {
    const map = new Map<string, FileEntry>();

    for (const entry of entries) {
      map.set(getFileEntryKey(entry), entry);
    }

    return map;
  }, [entries]);
  const completedEntryBySlotKey = useMemo(() => {
    const map = new Map<string, FileEntry>();

    for (const entry of entries) {
      if (!entry.id.startsWith("optimistic:")) {
        map.set(getFileEntryKey(entry), entry);
      }
    }

    return map;
  }, [entries]);
  const uploadedCount = slots.filter((slot) =>
    completedEntryBySlotKey.has(getSlotKey(slot)),
  ).length;
  const progress = slots.length > 0 ? (uploadedCount / slots.length) * 100 : 0;
  const groupedSlots = useMemo(() => groupSlots(slots), [slots]);
  const isProjectCourse = course.course_type === "Project";
  const incompleteGroups = groupedSlots.filter(
    (group) => !isGroupComplete(group, completedEntryBySlotKey),
  );
  const completedGroups = groupedSlots.filter((group) =>
    isGroupComplete(group, completedEntryBySlotKey),
  );
  const regularIncompleteGroups = incompleteGroups.filter(
    (group) => !isCompactGroup(group) && !isRecordGroup(group),
  );
  const recordIncompleteGroups = incompleteGroups.filter(isRecordGroup);
  const compactIncompleteGroups = incompleteGroups.filter(isCompactGroup);
  const regularCompletedGroups = completedGroups.filter(
    (group) => !isCompactGroup(group) && !isRecordGroup(group),
  );
  const recordCompletedGroups = completedGroups.filter(isRecordGroup);
  const compactCompletedGroups = completedGroups.filter(isCompactGroup);

  if (isProjectCourse) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: course.course_name, href: `/courses/${course.id}` },
              { label: `Section ${section.section_label}` },
            ]}
          />
          <Button
            variant="link"
            className="h-auto px-0"
            nativeButton={false}
            render={<Link href={`/courses/${course.id}`} />}
          >
            <ArrowLeft />
            Course
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-normal">
                {course.course_code} - Section {section.section_label}
              </h1>
              <Badge variant="outline" className={ROLE_STYLES[section.role]}>
                {section.role}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-[var(--text-faded)]">
              Teacher: {section.teacher_initial}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-8">
          <p className="text-sm font-medium text-[var(--text-faded)]">
            Project section workflow
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Coming soon...</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-faded)]">
            Project section uploads are paused while the folder structure and
            file distribution are finalized.
          </p>
        </div>
      </div>
    );
  }

  async function handleUpload(slot: SlotDefinition, file: File) {
    const slotKey = getSlotKey(slot);
    const optimisticEntry: FileEntry = {
      id: `optimistic:${slotKey}`,
      course_id: course.id,
      section_id: section.id,
      document_category: slot.category,
      sub_category: slot.subCategory,
      quiz_number: slot.quizNumber,
      original_filename: file.name,
      renamed_filename: generateFilename(slot, {
        courseCode: course.course_code,
        sectionLabel: section.section_label,
        teacherInitial: section.teacher_initial,
        semester: course.semester,
      }),
      storage_path: "",
      storage_url: "",
      uploaded_at: new Date().toISOString(),
    };

    setEntries((current) => [
      optimisticEntry,
      ...current.filter((entry) => getFileEntryKey(entry) !== slotKey),
    ]);

    try {
      const uploadedEntry = await uploadFile(
        file,
        slot,
        course.id,
        section.id,
        course,
        section,
      );

      toast.success("File uploaded.");
      setEntries((current) => [
        uploadedEntry,
        ...current.filter((entry) => getFileEntryKey(entry) !== slotKey),
      ]);

      return uploadedEntry;
    } catch (error) {
      setEntries((current) =>
        current.filter((entry) => entry.id !== optimisticEntry.id),
      );
      throw error;
    }
  }

  async function handleDelete(fileEntry: FileEntry) {
    await deleteFile(fileEntry.id, fileEntry.storage_path);
    setEntries((current) =>
      current.filter((entry) => entry.id !== fileEntry.id),
    );
  }

  async function handleExportSectionZip() {
    if (isExportingZip) {
      return;
    }

    const exportEntries = entries.filter(
      (entry) => !entry.id.startsWith("optimistic:"),
    );

    if (exportEntries.length === 0) {
      toast.error("No uploaded files to export.");
      return;
    }

    setIsExportingZip(true);

    try {
      const blob = await buildSectionZip({
        section,
        fileEntries: exportEntries,
      });

      downloadBlob(blob, getSectionZipFilename(section));
      toast.success("Section ZIP exported.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ZIP export failed.");
    } finally {
      setIsExportingZip(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/" },
            { label: course.course_name, href: `/courses/${course.id}` },
            { label: `Section ${section.section_label}` },
          ]}
        />
        <Button
          variant="link"
          className="h-auto px-0"
          nativeButton={false}
          render={<Link href={`/courses/${course.id}`} />}
        >
          <ArrowLeft />
          Course
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-normal">
                {course.course_code} - Section {section.section_label}
              </h1>
              <Badge variant="outline" className={ROLE_STYLES[section.role]}>
                {section.role}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-[var(--text-faded)]">
              Teacher: {section.teacher_initial}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExportSectionZip}
            disabled={isExportingZip}
          >
            <FileArchive />
            {isExportingZip ? "Exporting..." : "Export Section ZIP"}
          </Button>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-4">
          <Progress value={progress}>
            <ProgressLabel>
              {uploadedCount} of {slots.length} required files uploaded
            </ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
        {uploadedCount === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-alt)] p-4 text-sm text-[var(--text-faded)]">
            Drag files onto the matching document slots below, or click a slot
            to browse. The app renames each file automatically before uploading.
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
        <div className="space-y-8">
          {regularIncompleteGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {renderGroupSlots(
                  group,
                  displayEntryBySlotKey,
                  handleUpload,
                  handleDelete,
                )}
              </div>
            </section>
          ))}

          {recordIncompleteGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {renderGroupSlots(
                  group,
                  displayEntryBySlotKey,
                  handleUpload,
                  handleDelete,
                )}
              </div>
            </section>
          ))}

          {compactIncompleteGroups.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Section Documents</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {compactIncompleteGroups.flatMap((group) =>
                  renderGroupSlots(
                    group,
                    displayEntryBySlotKey,
                    handleUpload,
                    handleDelete,
                  ),
                )}
              </div>
            </section>
          ) : null}

          {regularCompletedGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{group.title}</h2>
                <Check className="size-5 text-emerald-600" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {renderGroupSlots(
                  group,
                  displayEntryBySlotKey,
                  handleUpload,
                  handleDelete,
                )}
              </div>
            </section>
          ))}

          {recordCompletedGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{group.title}</h2>
                <Check className="size-5 text-emerald-600" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {renderGroupSlots(
                  group,
                  displayEntryBySlotKey,
                  handleUpload,
                  handleDelete,
                )}
              </div>
            </section>
          ))}

          {compactCompletedGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{group.title}</h2>
                <Check className="size-5 text-emerald-600" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {renderGroupSlots(
                  group,
                  displayEntryBySlotKey,
                  handleUpload,
                  handleDelete,
                )}
              </div>
            </section>
          ))}
        </div>

        <aside className="rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-4 xl:sticky xl:top-20">
          <div>
            <h2 className="text-sm font-semibold">Upload checklist</h2>
            <p className="mt-1 text-xs text-[var(--text-faded)]">
              Completed sections move below but remain available on this page.
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {groupedSlots.map((group) => {
              const groupUploadedCount = getGroupUploadedCount(
                group,
                completedEntryBySlotKey,
              );
              const isComplete = groupUploadedCount === group.slots.length;

              return (
                <li key={group.title}>
                  <div className="flex items-start gap-2 rounded-md px-2 py-1.5">
                    <span
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                        isComplete
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-[var(--border)] text-[var(--text-faded)]"
                      }`}
                    >
                      {isComplete ? <Check className="size-3" /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium ${
                          isComplete
                            ? "text-[var(--text-faded)]"
                            : "text-[var(--text-default)]"
                        }`}
                      >
                        {group.title}
                      </p>
                      <p className="text-xs text-[var(--text-faded)]">
                        {groupUploadedCount}/{group.slots.length}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}

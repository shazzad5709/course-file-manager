"use client";

import { useMemo, useState } from "react";
import { Check, FileArchive } from "lucide-react";
import { toast } from "sonner";

import {
  deleteFile,
  getFileEntriesBySection,
  uploadFile,
} from "@/lib/actions/files";
import { getUploadExtensionOverride } from "@/lib/file-extensions";
import { generateFilename } from "@/lib/naming";
import { isRequiredSlot, type SlotDefinition } from "@/lib/slots";
import type { Course, FileEntry, Section } from "@/lib/types";
import {
  buildSectionZip,
  downloadBlob,
  getSectionZipFilename,
} from "@/lib/zip";
import { SlotCard } from "@/components/slot-card";
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

function getSlotKey(slot: SlotDefinition) {
  return `${slot.category}:${slot.subCategory ?? ""}:${slot.quizNumber ?? ""}`;
}

function getFileEntryKey(fileEntry: FileEntry) {
  return `${fileEntry.document_category}:${fileEntry.sub_category ?? ""}:${
    fileEntry.quiz_number ?? ""
  }`;
}

function getDefaultQuizQuestionSlotKey(slot: SlotDefinition) {
  const match = slot.category.match(/^theory_quiz_([123])_question_set_b$/);

  if (!match) {
    return null;
  }

  return `theory_quiz_${match[1]}_question::${slot.quizNumber ?? ""}`;
}

function isQuizQuestionSlot(slot: SlotDefinition) {
  return (
    slot.category.startsWith("theory_quiz_") &&
    (slot.category.endsWith("_question") ||
      slot.category.endsWith("_question_set_b"))
  );
}

function isQuizGroup(group: SlotGroup) {
  return group.title.startsWith("Quiz ");
}

function getQuizQuestionSetForPreview(
  slot: SlotDefinition,
) {
  const match = slot.category.match(/^theory_quiz_([123])_question(_set_b)?$/);

  if (!match) {
    return undefined;
  }

  if (match[2]) {
    return "B";
  }

  return null;
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
  const requiredSlots = group.slots.filter(isRequiredSlot);

  return requiredSlots.every((slot) => entryBySlotKey.has(getSlotKey(slot)));
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
  return group.slots
    .filter(isRequiredSlot)
    .filter((slot) => entryBySlotKey.has(getSlotKey(slot))).length;
}

function getGroupRequiredCount(group: SlotGroup) {
  return group.slots.filter(isRequiredSlot).length;
}

function getSectionPeople(section: Section) {
  const people = [`Teacher: ${section.teacher_initial}`];

  if (section.role === "Module Leader" || section.role === "Both") {
    people.push(`Module Leader: ${section.teacher_initial}`);
  }

  return people.join(" | ");
}

function renderGroupSlots(
  group: SlotGroup,
  displayEntryBySlotKey: Map<string, FileEntry>,
  completedEntryBySlotKey: Map<string, FileEntry>,
  handleUpload: (slot: SlotDefinition, file: File) => Promise<FileEntry>,
  handleDelete: (fileEntry: FileEntry) => Promise<void>,
) {
  const nodes = [];
  const scriptSlotsBeforeQuestions = group.slots.filter(
    (slot) => !isQuizQuestionSlot(slot),
  ).length;
  let addedQuizQuestionSpacer = false;

  for (const slot of group.slots) {
    if (
      isQuizGroup(group) &&
      isQuizQuestionSlot(slot) &&
      scriptSlotsBeforeQuestions % 2 === 1 &&
      !addedQuizQuestionSpacer
    ) {
      nodes.push(
        <div
          key={`${group.title}-question-spacer`}
          className="hidden lg:block"
          aria-hidden="true"
        />,
      );
      addedQuizQuestionSpacer = true;
    }

    const defaultQuizQuestionSlotKey = getDefaultQuizQuestionSlotKey(slot);
    const disabledReason =
      defaultQuizQuestionSlotKey &&
      !completedEntryBySlotKey.has(defaultQuizQuestionSlotKey)
        ? "Upload Set A first"
        : undefined;

    nodes.push(
      <SlotCard
        key={getSlotKey(slot)}
        slot={slot}
        fileEntry={displayEntryBySlotKey.get(getSlotKey(slot)) ?? null}
        disabledReason={disabledReason}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />,
    );
  }

  return nodes;
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
    isRequiredSlot(slot) && completedEntryBySlotKey.has(getSlotKey(slot)),
  ).length;
  const requiredSlotCount = slots.filter(isRequiredSlot).length;
  const progress =
    requiredSlotCount > 0 ? (uploadedCount / requiredSlotCount) * 100 : 0;
  const groupedSlots = useMemo(() => groupSlots(slots), [slots]);
  const isProjectCourse = course.course_type === "Project";
  const regularGroups = groupedSlots.filter(
    (group) => !isCompactGroup(group) && !isRecordGroup(group),
  );
  const recordGroups = groupedSlots.filter(isRecordGroup);
  const compactGroups = groupedSlots.filter(isCompactGroup);
  const sectionDocumentsComplete =
    compactGroups.length > 0 &&
    compactGroups.every((group) =>
      isGroupComplete(group, completedEntryBySlotKey),
    );

  if (isProjectCourse) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: course.course_code, href: `/courses/${course.id}` },
              { label: `Section ${section.section_label}` },
            ]}
          />
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {course.course_code} - Section {section.section_label}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-faded)]">
              {getSectionPeople(section)}
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
        quizQuestionSet: getQuizQuestionSetForPreview(slot),
        extensionOverride: getUploadExtensionOverride(slot, file.name),
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

      const freshEntries = await getFileEntriesBySection(section.id);
      toast.success("File uploaded.");
      setEntries(freshEntries);

      return uploadedEntry;
    } catch (error) {
      try {
        setEntries(await getFileEntriesBySection(section.id));
      } catch {
        setEntries((current) =>
          current.filter((entry) => entry.id !== optimisticEntry.id),
        );
      }
      throw error;
    }
  }

  async function handleDelete(fileEntry: FileEntry) {
    await deleteFile(fileEntry.id, fileEntry.storage_path);
    setEntries(await getFileEntriesBySection(section.id));
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
      toast.error(
        error instanceof Error ? error.message : "ZIP export failed.",
      );
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
            { label: course.course_code, href: `/courses/${course.id}` },
            { label: `Section ${section.section_label}` },
          ]}
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {course.course_code} - Section {section.section_label}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-faded)]">
              {getSectionPeople(section)}
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
              {uploadedCount} of {requiredSlotCount} required files uploaded
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
          {regularGroups.map((group) => {
            const isComplete = isGroupComplete(group, completedEntryBySlotKey);

            return (
              <section key={group.title} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{group.title}</h2>
                  {isComplete ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {renderGroupSlots(
                    group,
                    displayEntryBySlotKey,
                    completedEntryBySlotKey,
                    handleUpload,
                    handleDelete,
                  )}
                </div>
              </section>
            );
          })}

          {recordGroups.map((group) => {
            const isComplete = isGroupComplete(group, completedEntryBySlotKey);

            return (
              <section key={group.title} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{group.title}</h2>
                  {isComplete ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {renderGroupSlots(
                    group,
                    displayEntryBySlotKey,
                    completedEntryBySlotKey,
                    handleUpload,
                    handleDelete,
                  )}
                </div>
              </section>
            );
          })}

          {compactGroups.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Section Documents</h2>
                {sectionDocumentsComplete ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {compactGroups.flatMap((group) =>
                  renderGroupSlots(
                    group,
                    displayEntryBySlotKey,
                    completedEntryBySlotKey,
                    handleUpload,
                    handleDelete,
                  ),
                )}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-4 xl:sticky xl:top-20">
          <div>
            <h2 className="text-sm font-semibold">Upload checklist</h2>
            <p className="mt-1 text-xs text-[var(--text-faded)]">
              Track which upload sections are complete.
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {groupedSlots.map((group) => {
              const groupUploadedCount = getGroupUploadedCount(
                group,
                completedEntryBySlotKey,
              );
              const groupRequiredCount = getGroupRequiredCount(group);
              const isComplete = groupUploadedCount === groupRequiredCount;

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
                        {groupUploadedCount}/{groupRequiredCount}
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

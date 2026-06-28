"use server";

import { revalidatePath } from "next/cache";

import { generateFilename } from "@/lib/naming";
import { getSlotsForCourse, type SlotDefinition } from "@/lib/slots";
import { supabase } from "@/lib/supabase";
import type { Course, FileEntry, Section } from "@/lib/types";

const STORAGE_BUCKET = "course-files";
const FILE_ENTRY_SELECT =
  "id, course_id, section_id, document_category, sub_category, quiz_number, original_filename, renamed_filename, storage_path, storage_url, uploaded_at";

type FileEntryRow = FileEntry;

function assertSafeStorageSegment(value: string, label: string) {
  if (
    !value ||
    value.includes("/") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    throw new Error(`${label} contains invalid storage path characters.`);
  }
}

function assertSafeStoragePath(value: string) {
  const segments = value.split("/");

  if (segments.length !== 3) {
    throw new Error("Storage path does not match the expected bucket layout.");
  }

  assertSafeStorageSegment(segments[0], "Storage course id");
  assertSafeStorageSegment(segments[1], "Storage section id");
  assertSafeStorageSegment(segments[2], "Storage file");
}

function assertMatchingCourseContext(courseId: string, course: Course) {
  if (course.id !== courseId) {
    throw new Error("Course context does not match the upload course id.");
  }
}

function assertMatchingContext(
  courseId: string,
  sectionId: string,
  course: Course,
  section: Section,
) {
  if (course.id !== courseId) {
    throw new Error("Course context does not match the upload course id.");
  }

  if (section.id !== sectionId || section.course_id !== courseId) {
    throw new Error("Section context does not match the upload course id.");
  }
}

function getSlotKey(slot: SlotDefinition) {
  return `${slot.category}:${slot.subCategory ?? ""}:${slot.quizNumber ?? ""}`;
}

function getCanonicalSectionSlot(course: Course, slot: SlotDefinition) {
  const canonicalSlot = getSlotsForCourse(course.course_type, "section").find(
    (candidate) => getSlotKey(candidate) === getSlotKey(slot),
  );

  if (!canonicalSlot) {
    throw new Error("Slot does not belong to this course type.");
  }

  return canonicalSlot;
}

function getCanonicalCourseSlot(course: Course, slot: SlotDefinition) {
  const canonicalSlot = getSlotsForCourse(course.course_type, "course").find(
    (candidate) => getSlotKey(candidate) === getSlotKey(slot),
  );

  if (!canonicalSlot) {
    throw new Error("Slot does not belong to this course type.");
  }

  return canonicalSlot;
}

async function getTrustedCourseContext(courseId: string) {
  if (!courseId) {
    throw new Error("Course id is required.");
  }

  const { data: course, error } = await supabase
    .from("courses")
    .select(
      "id, course_code, course_name, course_type, semester, coordinator_initial, created_at",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load course: ${error.message}`);
  }

  if (!course) {
    throw new Error("Course was not found.");
  }

  return course as Course;
}

async function getTrustedUploadContext(courseId: string, sectionId: string) {
  if (!courseId) {
    throw new Error("Course id is required.");
  }

  if (!sectionId) {
    throw new Error("Section id is required.");
  }

  const course = await getTrustedCourseContext(courseId);

  const { data: section, error: sectionError } = await supabase
    .from("sections")
    .select("id, course_id, section_label, teacher_initial, role, created_at")
    .eq("id", sectionId)
    .maybeSingle();

  if (sectionError) {
    throw new Error(`Unable to load section: ${sectionError.message}`);
  }

  if (!section) {
    throw new Error("Section was not found.");
  }

  if (section.course_id !== course.id) {
    throw new Error("Section does not belong to this course.");
  }

  return {
    course,
    section: section as Section,
  };
}

export async function getFileEntriesBySection(
  sectionId: string,
): Promise<FileEntry[]> {
  if (!sectionId) {
    throw new Error("Section id is required.");
  }

  const { data, error } = await supabase
    .from("file_entries")
    .select(FILE_ENTRY_SELECT)
    .eq("section_id", sectionId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load files: ${error.message}`);
  }

  return (data ?? []) as FileEntryRow[];
}

export async function getFileEntriesByCourse(
  courseId: string,
  sectionId: string | null = null,
): Promise<FileEntry[]> {
  if (!courseId) {
    throw new Error("Course id is required.");
  }

  let query = supabase
    .from("file_entries")
    .select(FILE_ENTRY_SELECT)
    .eq("course_id", courseId);

  query =
    sectionId === null
      ? query.is("section_id", null)
      : query.eq("section_id", sectionId);

  const { data, error } = await query.order("uploaded_at", {
    ascending: false,
  });

  if (error) {
    throw new Error(`Unable to load files: ${error.message}`);
  }

  return (data ?? []) as FileEntryRow[];
}

export async function getAllFileEntriesByCourse(
  courseId: string,
): Promise<FileEntry[]> {
  if (!courseId) {
    throw new Error("Course id is required.");
  }

  const { data, error } = await supabase
    .from("file_entries")
    .select(FILE_ENTRY_SELECT)
    .eq("course_id", courseId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load files: ${error.message}`);
  }

  return (data ?? []) as FileEntryRow[];
}

export async function getAllFileEntriesByCourseIds(
  courseIds: string[],
): Promise<FileEntry[]> {
  const uniqueCourseIds = Array.from(new Set(courseIds.filter(Boolean)));

  if (uniqueCourseIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("file_entries")
    .select(FILE_ENTRY_SELECT)
    .in("course_id", uniqueCourseIds)
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load files: ${error.message}`);
  }

  return (data ?? []) as FileEntryRow[];
}

export async function uploadFile(
  file: File,
  slot: SlotDefinition,
  courseId: string,
  sectionId: string,
  clientCourse: Course,
  clientSection: Section,
): Promise<FileEntry> {
  if (slot.level !== "section") {
    throw new Error("Only section-level slots can be uploaded here.");
  }

  if (!file || file.size === 0) {
    throw new Error("Choose a non-empty file to upload.");
  }

  assertMatchingContext(courseId, sectionId, clientCourse, clientSection);

  const { course, section } = await getTrustedUploadContext(
    courseId,
    sectionId,
  );
  const canonicalSlot = getCanonicalSectionSlot(course, slot);

  assertMatchingContext(courseId, sectionId, course, section);

  const renamedFilename = generateFilename(canonicalSlot, {
    courseCode: course.course_code,
    sectionLabel: section.section_label,
    teacherInitial: section.teacher_initial,
    semester: course.semester,
  });

  assertSafeStorageSegment(courseId, "Course id");
  assertSafeStorageSegment(sectionId, "Section id");
  assertSafeStorageSegment(renamedFilename, "Renamed filename");

  const storagePath = `${courseId}/${sectionId}/${renamedFilename}`;
  const uploadResult = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadResult.error) {
    throw new Error(`Unable to upload file: ${uploadResult.error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

  const { data: entry, error } = await supabase
    .from("file_entries")
    .insert({
      course_id: courseId,
      section_id: sectionId,
      document_category: canonicalSlot.category,
      sub_category: canonicalSlot.subCategory,
      quiz_number: canonicalSlot.quizNumber,
      original_filename: file.name,
      renamed_filename: renamedFilename,
      storage_path: storagePath,
      storage_url: publicUrl,
    })
    .select(FILE_ENTRY_SELECT)
    .single();

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Unable to save file record: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}/sections/${sectionId}`);

  return entry as FileEntryRow;
}

export async function uploadCourseFile(
  file: File,
  slot: SlotDefinition,
  courseId: string,
  clientCourse: Course,
): Promise<FileEntry> {
  if (slot.level !== "course") {
    throw new Error("Only course-level slots can be uploaded here.");
  }

  if (!file || file.size === 0) {
    throw new Error("Choose a non-empty file to upload.");
  }

  assertMatchingCourseContext(courseId, clientCourse);

  const course = await getTrustedCourseContext(courseId);
  const canonicalSlot = getCanonicalCourseSlot(course, slot);

  assertMatchingCourseContext(courseId, course);

  const renamedFilename = generateFilename(canonicalSlot, {
    courseCode: course.course_code,
    coordinatorInitial: course.coordinator_initial,
    semester: course.semester,
  });

  assertSafeStorageSegment(courseId, "Course id");
  assertSafeStorageSegment(renamedFilename, "Renamed filename");

  const storagePath = `${courseId}/course-level/${renamedFilename}`;
  const uploadResult = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadResult.error) {
    throw new Error(`Unable to upload file: ${uploadResult.error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

  const { data: entry, error } = await supabase
    .from("file_entries")
    .insert({
      course_id: courseId,
      section_id: null,
      document_category: canonicalSlot.category,
      sub_category: canonicalSlot.subCategory,
      quiz_number: canonicalSlot.quizNumber,
      original_filename: file.name,
      renamed_filename: renamedFilename,
      storage_path: storagePath,
      storage_url: publicUrl,
    })
    .select(FILE_ENTRY_SELECT)
    .single();

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Unable to save file record: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/courses/${courseId}`);

  return entry as FileEntryRow;
}

export async function deleteFile(
  fileEntryId: string,
  storagePath: string,
): Promise<void> {
  if (!fileEntryId) {
    throw new Error("File entry id is required.");
  }

  assertSafeStoragePath(storagePath);

  const { data: entry, error: entryError } = await supabase
    .from("file_entries")
    .select("course_id, section_id, storage_path")
    .eq("id", fileEntryId)
    .single();

  if (entryError) {
    throw new Error(`Unable to load file record: ${entryError.message}`);
  }

  if (entry.storage_path !== storagePath) {
    throw new Error("Storage path does not match file record.");
  }

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (storageError) {
    throw new Error(`Unable to delete stored file: ${storageError.message}`);
  }

  const { error: deleteError } = await supabase
    .from("file_entries")
    .delete()
    .eq("id", fileEntryId);

  if (deleteError) {
    throw new Error(`Unable to delete file record: ${deleteError.message}`);
  }

  if (entry.section_id) {
    revalidatePath(`/courses/${entry.course_id}/sections/${entry.section_id}`);
  }

  revalidatePath("/");
  revalidatePath(`/courses/${entry.course_id}`);
}

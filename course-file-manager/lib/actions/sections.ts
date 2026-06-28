"use server";

import { revalidatePath } from "next/cache";

import { supabase } from "@/lib/supabase";
import { SECTION_ROLES, type Section, type SectionInput } from "@/lib/types";

type SectionRow = Section;

function isSectionRole(value: string): value is SectionInput["role"] {
  return SECTION_ROLES.includes(value as SectionInput["role"]);
}

function normalizeSectionInput(data: SectionInput): SectionInput {
  const courseId = data.course_id.trim();
  const sectionLabel = data.section_label.trim().toUpperCase();
  const teacherInitial = data.teacher_initial.trim().toUpperCase();

  if (!courseId) {
    throw new Error("Course id is required.");
  }

  if (!sectionLabel) {
    throw new Error("Section label is required.");
  }

  if (!teacherInitial) {
    throw new Error("Teacher initial is required.");
  }

  if (!isSectionRole(data.role)) {
    throw new Error("Role must be Section Teacher, Module Leader, or Both.");
  }

  return {
    course_id: courseId,
    section_label: sectionLabel,
    teacher_initial: teacherInitial,
    role: data.role,
  };
}

export async function getSectionsByCourse(courseId: string): Promise<Section[]> {
  if (!courseId) {
    throw new Error("Course id is required.");
  }

  const { data, error } = await supabase
    .from("sections")
    .select("id, course_id, section_label, teacher_initial, role, created_at")
    .eq("course_id", courseId)
    .order("section_label", { ascending: true });

  if (error) {
    throw new Error(`Unable to load sections: ${error.message}`);
  }

  return (data ?? []) as SectionRow[];
}

export async function getSectionsByCourseIds(
  courseIds: string[],
): Promise<Section[]> {
  const uniqueCourseIds = Array.from(new Set(courseIds.filter(Boolean)));

  if (uniqueCourseIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("sections")
    .select("id, course_id, section_label, teacher_initial, role, created_at")
    .in("course_id", uniqueCourseIds)
    .order("section_label", { ascending: true });

  if (error) {
    throw new Error(`Unable to load sections: ${error.message}`);
  }

  return (data ?? []) as SectionRow[];
}

export async function getSectionById(id: string): Promise<Section | null> {
  if (!id) {
    throw new Error("Section id is required.");
  }

  const { data, error } = await supabase
    .from("sections")
    .select("id, course_id, section_label, teacher_initial, role, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load section: ${error.message}`);
  }

  return data as SectionRow | null;
}

export async function createSection(data: SectionInput): Promise<Section> {
  const payload = normalizeSectionInput(data);

  const { data: section, error } = await supabase
    .from("sections")
    .insert(payload)
    .select("id, course_id, section_label, teacher_initial, role, created_at")
    .single();

  if (error) {
    throw new Error(`Unable to create section: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/courses/${payload.course_id}`);

  return section as SectionRow;
}

export async function updateSection(
  id: string,
  data: SectionInput,
): Promise<Section> {
  const payload = normalizeSectionInput(data);

  if (!id) {
    throw new Error("Section id is required.");
  }

  const { data: section, error } = await supabase
    .from("sections")
    .update(payload)
    .eq("id", id)
    .select("id, course_id, section_label, teacher_initial, role, created_at")
    .single();

  if (error) {
    throw new Error(`Unable to update section: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/courses/${payload.course_id}`);
  revalidatePath(`/courses/${payload.course_id}/sections/${id}`);

  return section as SectionRow;
}

export async function deleteSection(id: string, courseId: string): Promise<void> {
  if (!id) {
    throw new Error("Section id is required.");
  }

  if (!courseId) {
    throw new Error("Course id is required.");
  }

  const { error } = await supabase.from("sections").delete().eq("id", id);

  if (error) {
    throw new Error(`Unable to delete section: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/courses/${courseId}`);
}

"use server";

import { revalidatePath } from "next/cache";

import { supabase } from "@/lib/supabase";
import { COURSE_TYPES, type Course, type CourseInput } from "@/lib/types";

type CourseRow = Course;

function isCourseType(value: string): value is CourseInput["course_type"] {
  return COURSE_TYPES.includes(value as CourseInput["course_type"]);
}

function normalizeCourseInput(data: CourseInput): CourseInput {
  const courseCode = data.course_code.trim().toUpperCase();
  const courseName = data.course_name.trim();
  const semester = data.semester.trim();
  const coordinatorInitial = data.coordinator_initial.trim().toUpperCase();

  if (!courseCode) {
    throw new Error("Course code is required.");
  }

  if (!courseName) {
    throw new Error("Course name is required.");
  }

  if (!isCourseType(data.course_type)) {
    throw new Error("Course type must be Theory, Lab, or Project.");
  }

  if (!semester) {
    throw new Error("Semester is required.");
  }

  if (!coordinatorInitial) {
    throw new Error("Coordinator initial is required.");
  }

  return {
    course_code: courseCode,
    course_name: courseName,
    course_type: data.course_type,
    semester,
    coordinator_initial: coordinatorInitial,
  };
}

export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, course_code, course_name, course_type, semester, coordinator_initial, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load courses: ${error.message}`);
  }

  return (data ?? []) as CourseRow[];
}

export async function getCourseById(id: string): Promise<Course | null> {
  if (!id) {
    throw new Error("Course id is required.");
  }

  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, course_code, course_name, course_type, semester, coordinator_initial, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load course: ${error.message}`);
  }

  return data as CourseRow | null;
}

export async function createCourse(data: CourseInput): Promise<Course> {
  const payload = normalizeCourseInput(data);

  const { data: course, error } = await supabase
    .from("courses")
    .insert(payload)
    .select(
      "id, course_code, course_name, course_type, semester, coordinator_initial, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Unable to create course: ${error.message}`);
  }

  revalidatePath("/");

  return course as CourseRow;
}

export async function updateCourse(
  id: string,
  data: CourseInput,
): Promise<Course> {
  const payload = normalizeCourseInput(data);

  if (!id) {
    throw new Error("Course id is required.");
  }

  const { data: course, error } = await supabase
    .from("courses")
    .update(payload)
    .eq("id", id)
    .select(
      "id, course_code, course_name, course_type, semester, coordinator_initial, created_at",
    )
    .single();

  if (error) {
    throw new Error(`Unable to update course: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/courses/${id}`);

  return course as CourseRow;
}

export async function deleteCourse(id: string): Promise<void> {
  if (!id) {
    throw new Error("Course id is required.");
  }

  const { error } = await supabase.from("courses").delete().eq("id", id);

  if (error) {
    throw new Error(`Unable to delete course: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/courses/${id}`);
}

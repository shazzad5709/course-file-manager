import { notFound } from "next/navigation";

import { CourseDetail } from "@/components/course-detail";
import { getCourseById } from "@/lib/actions/courses";
import {
  getAllFileEntriesByCourse,
  getFileEntriesByCourse,
} from "@/lib/actions/files";
import { getSectionsByCourse } from "@/lib/actions/sections";
import { getSlotsForCourse } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) {
    notFound();
  }

  const [sections, courseLevelFileEntries, allFileEntries] = await Promise.all([
    getSectionsByCourse(course.id),
    getFileEntriesByCourse(course.id),
    getAllFileEntriesByCourse(course.id),
  ]);
  const courseLevelSlots = getSlotsForCourse(course.course_type, "course");

  return (
    <CourseDetail
      course={course}
      sections={sections}
      courseLevelSlots={courseLevelSlots}
      courseLevelFileEntries={courseLevelFileEntries}
      allFileEntries={allFileEntries}
    />
  );
}

import { CourseDashboard } from "@/components/course-dashboard";
import { getCourses } from "@/lib/actions/courses";
import { getAllFileEntriesByCourseIds } from "@/lib/actions/files";
import { getSectionsByCourseIds } from "@/lib/actions/sections";
import { calculateCourseCompletion } from "@/lib/progress";
import type { FileEntry, Section } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Dashboard />;
}

function groupByCourseId<T extends Section | FileEntry>(items: T[]) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    grouped.set(item.course_id, [...(grouped.get(item.course_id) ?? []), item]);
  }

  return grouped;
}

async function Dashboard() {
  const courses = await getCourses();
  const courseIds = courses.map((course) => course.id);
  const [sections, fileEntries] = await Promise.all([
    getSectionsByCourseIds(courseIds),
    getAllFileEntriesByCourseIds(courseIds),
  ]);
  const sectionsByCourseId = groupByCourseId(sections);
  const fileEntriesByCourseId = groupByCourseId(fileEntries);
  const dashboardCourses = courses.map((course) => {
    const courseSections = sectionsByCourseId.get(course.id) ?? [];
    const courseFileEntries = fileEntriesByCourseId.get(course.id) ?? [];

    return {
      ...course,
      completion: calculateCourseCompletion(
        course,
        courseSections,
        courseFileEntries,
      ),
    };
  });

  return <CourseDashboard courses={dashboardCourses} />;
}

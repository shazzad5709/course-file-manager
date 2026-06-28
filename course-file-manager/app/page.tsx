import { CourseDashboard } from "@/components/course-dashboard";
import { getCourses } from "@/lib/actions/courses";
import { getAllFileEntriesByCourse } from "@/lib/actions/files";
import { getSectionsByCourse } from "@/lib/actions/sections";
import { calculateCourseCompletion } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default function Home() {
  return <Dashboard />;
}

async function Dashboard() {
  const courses = await getCourses();
  const dashboardCourses = await Promise.all(
    courses.map(async (course) => {
      const [sections, fileEntries] = await Promise.all([
        getSectionsByCourse(course.id),
        getAllFileEntriesByCourse(course.id),
      ]);

      return {
        ...course,
        completion: calculateCourseCompletion(course, sections, fileEntries),
      };
    }),
  );

  return <CourseDashboard courses={dashboardCourses} />;
}

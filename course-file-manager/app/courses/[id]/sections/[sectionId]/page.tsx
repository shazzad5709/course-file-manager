import { notFound } from "next/navigation";

import { SectionUploadPage } from "@/components/section-upload-page";
import { getCourseById } from "@/lib/actions/courses";
import { getFileEntriesBySection } from "@/lib/actions/files";
import { getSectionById } from "@/lib/actions/sections";
import { getSlotsForCourse } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function SectionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>;
}) {
  const { id, sectionId } = await params;
  const [course, section, fileEntries] = await Promise.all([
    getCourseById(id),
    getSectionById(sectionId),
    getFileEntriesBySection(sectionId),
  ]);

  if (!course || !section || section.course_id !== course.id) {
    notFound();
  }

  const slots = getSlotsForCourse(course.course_type, "section");

  return (
    <SectionUploadPage
      course={course}
      section={section}
      slots={slots}
      fileEntries={fileEntries}
    />
  );
}

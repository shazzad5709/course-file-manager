"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteCourse } from "@/lib/actions/courses";
import type { CompletionSummary } from "@/lib/progress";
import { COURSE_TYPES, type Course, type CourseType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CourseDialog } from "@/components/course-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CourseDashboardProps = {
  courses: CourseDashboardItem[];
};

type CourseDashboardItem = Course & {
  completion: CompletionSummary;
};

type TypeFilter = CourseType | "all";

const COURSE_TYPE_STYLES: Record<CourseType, string> = {
  Theory:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  Lab:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  Project:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

const TYPE_FILTER_STORAGE_KEY = "course-file-manager-type-filter";
const SEMESTER_FILTER_STORAGE_KEY = "course-file-manager-semester-filter";

function getProgressColor(percentage: number) {
  if (percentage < 33) {
    return "bg-red-600";
  }

  if (percentage <= 66) {
    return "bg-yellow-500";
  }

  return "bg-green-600";
}

export function CourseDashboard({ courses }: CourseDashboardProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  const semesters = useMemo(
    () =>
      Array.from(new Set(courses.map((course) => course.semester))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [courses],
  );

  const filteredCourses = courses.filter((course) => {
    const matchesType =
      typeFilter === "all" || course.course_type === typeFilter;
    const matchesSemester =
      semesterFilter === "all" || course.semester === semesterFilter;

    return matchesType && matchesSemester;
  });

  useEffect(() => {
    const storedTypeFilter = localStorage.getItem(TYPE_FILTER_STORAGE_KEY);
    const storedSemesterFilter = localStorage.getItem(
      SEMESTER_FILTER_STORAGE_KEY,
    );
    const timeout = window.setTimeout(() => {
      if (
        storedTypeFilter === "all" ||
        COURSE_TYPES.includes(storedTypeFilter as CourseType)
      ) {
        setTypeFilter(storedTypeFilter as TypeFilter);
      }

      if (storedSemesterFilter) {
        setSemesterFilter(storedSemesterFilter);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function updateTypeFilter(value: TypeFilter) {
    setTypeFilter(value);
    localStorage.setItem(TYPE_FILTER_STORAGE_KEY, value);
  }

  function updateSemesterFilter(value: string) {
    setSemesterFilter(value);
    localStorage.setItem(SEMESTER_FILTER_STORAGE_KEY, value);
  }

  function openCreateDialog() {
    setEditingCourse(null);
    setDialogOpen(true);
  }

  function openEditDialog(course: Course) {
    setEditingCourse(course);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deletingCourse) {
      return;
    }

    try {
      await deleteCourse(deletingCourse.id);
      setDeletingCourse(null);
      toast.success("Course deleted.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete course.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-[var(--text-default)]">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--text-faded)]">
            Manage course records and track accreditation document progress.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus />
          Add Course
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--elevated)] p-3 sm:flex-row sm:items-center">
        <span className="text-sm font-medium text-[var(--text-default)]">
          Filter
        </span>
        <Select
          value={semesterFilter}
          onValueChange={(value) => {
            if (value) {
              updateSemesterFilter(value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue>
              {semesterFilter === "all" ? "All Semesters" : semesterFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester} value={semester}>
                {semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) => {
            if (value) {
              updateTypeFilter(value as TypeFilter);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue>
              {typeFilter === "all" ? "Any Course" : typeFilter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Course</SelectItem>
            {COURSE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-lg transition hover:border-[var(--primary)] hover:ring-[var(--primary)]/30"
              onClick={() => router.push(`/courses/${course.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/courses/${course.id}`);
                }
              }}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {course.course_code}
                </CardTitle>
                <CardDescription>{course.course_name}</CardDescription>
                <CardAction onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          aria-label={`Open actions for ${course.course_code}`}
                          variant="ghost"
                          size="icon"
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => openEditDialog(course)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeletingCourse(course)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    variant="outline"
                    className={cn(COURSE_TYPE_STYLES[course.course_type])}
                  >
                    {course.course_type}
                  </Badge>
                  <span className="text-sm text-[var(--text-faded)]">
                    {course.semester}
                  </span>
                </div>
                <Progress
                  value={course.completion.percentage}
                  indicatorClassName={getProgressColor(
                    course.completion.percentage,
                  )}
                >
                  <ProgressLabel>
                    {course.completion.uploaded} of{" "}
                    {course.completion.required} files uploaded
                  </ProgressLabel>
                  <ProgressValue />
                </Progress>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-lg">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div>
              <h2 className="text-lg font-semibold">
                {courses.length === 0
                  ? "No courses yet"
                  : "No courses match these filters"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-[var(--text-faded)]">
                {courses.length === 0
                  ? "Create your first course to start organizing accreditation documents by section and course level."
                  : "Adjust the semester or course type filters to see more courses."}
              </p>
            </div>
            {courses.length === 0 ? (
              <Button onClick={openCreateDialog}>
                <Plus />
                Add your first course
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {dialogOpen ? (
        <CourseDialog
          key={editingCourse?.id ?? "new-course"}
          course={editingCourse}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSaved={() => router.refresh()}
        />
      ) : null}

      <AlertDialog
        open={Boolean(deletingCourse)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCourse(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {deletingCourse?.course_code} and any related
              sections or file records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createCourse, updateCourse } from "@/lib/actions/courses";
import { COURSE_TYPES, type Course, type CourseInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CourseDialogProps = {
  course?: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

const EMPTY_FORM: CourseInput = {
  course_code: "",
  course_name: "",
  course_type: "Theory",
  semester: "",
  coordinator_initial: "",
};

function getInitialForm(course?: Course | null): CourseInput {
  if (!course) {
    return EMPTY_FORM;
  }

  return {
    course_code: course.course_code,
    course_name: course.course_name,
    course_type: course.course_type,
    semester: course.semester,
    coordinator_initial: course.coordinator_initial,
  };
}

export function CourseDialog({
  course,
  open,
  onOpenChange,
  onSaved,
}: CourseDialogProps) {
  const [form, setForm] = useState<CourseInput>(() => getInitialForm(course));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(course);

  function updateField<Field extends keyof CourseInput>(
    field: Field,
    value: CourseInput[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    return (
      form.course_code.trim() &&
      form.course_name.trim() &&
      form.semester.trim() &&
      form.coordinator_initial.trim()
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError("All fields are required.");
      return;
    }

    startTransition(async () => {
      try {
        if (course) {
          await updateCourse(course.id, form);
        } else {
          await createCourse(form);
        }

        onOpenChange(false);
        toast.success(course ? "Course updated." : "Course created.");
        onSaved?.();
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to save course.";

        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Course" : "Add Course"}
            </DialogTitle>
            <DialogDescription>
              Enter the course metadata used for document naming.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-code">Course Code</Label>
              <Input
                id="course-code"
                value={form.course_code}
                onChange={(event) =>
                  updateField("course_code", event.target.value)
                }
                placeholder="SE232"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={form.semester}
                onChange={(event) => updateField("semester", event.target.value)}
                placeholder="Fall-25"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="course-name">Course Name</Label>
              <Input
                id="course-name"
                value={form.course_name}
                onChange={(event) =>
                  updateField("course_name", event.target.value)
                }
                placeholder="Software Engineering"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Course Type</Label>
              <Select
                value={form.course_type}
                onValueChange={(value) => {
                  if (value) {
                    updateField(
                      "course_type",
                      value as CourseInput["course_type"],
                    );
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coordinator-initial">Coordinator Initial</Label>
              <Input
                id="coordinator-initial"
                value={form.coordinator_initial}
                onChange={(event) =>
                  updateField("coordinator_initial", event.target.value)
                }
                placeholder="NT"
                required
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

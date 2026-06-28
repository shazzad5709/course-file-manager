"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createSection, updateSection } from "@/lib/actions/sections";
import {
  SECTION_ROLES,
  type Section,
  type SectionInput,
  type SectionRole,
} from "@/lib/types";
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

type SectionDialogProps = {
  courseId: string;
  section?: Section | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

function getInitialForm(courseId: string, section?: Section | null): SectionInput {
  if (!section) {
    return {
      course_id: courseId,
      section_label: "",
      teacher_initial: "",
      role: "Section Teacher",
    };
  }

  return {
    course_id: courseId,
    section_label: section.section_label,
    teacher_initial: section.teacher_initial,
    role: section.role,
  };
}

export function SectionDialog({
  courseId,
  section,
  open,
  onOpenChange,
  onSaved,
}: SectionDialogProps) {
  const [form, setForm] = useState<SectionInput>(() =>
    getInitialForm(courseId, section),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(section);

  function updateField<Field extends keyof SectionInput>(
    field: Field,
    value: SectionInput[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    return form.section_label.trim() && form.teacher_initial.trim();
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
        if (section) {
          await updateSection(section.id, form);
        } else {
          await createSection(form);
        }

        onOpenChange(false);
        toast.success(section ? "Section updated." : "Section created.");
        onSaved?.();
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to save section.";

        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Section" : "Add Section"}
            </DialogTitle>
            <DialogDescription>
              Enter the section metadata used for section-level documents.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="section-label">Batch Section</Label>
              <Input
                id="section-label"
                value={form.section_label}
                onChange={(event) =>
                  updateField("section_label", event.target.value)
                }
                placeholder="43A"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-initial">Teacher Initial</Label>
              <Input
                id="teacher-initial"
                value={form.teacher_initial}
                onChange={(event) =>
                  updateField("teacher_initial", event.target.value)
                }
                placeholder="NT"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => {
                  if (value) {
                    updateField("role", value as SectionRole);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  : "Add Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

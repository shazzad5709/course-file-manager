"use client";

import { useRef, useState } from "react";
import { Check, Download, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { getAcceptedExtensions } from "@/lib/file-extensions";
import type { SlotDefinition } from "@/lib/slots";
import type { FileEntry } from "@/lib/types";
import { downloadBlob } from "@/lib/zip";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SlotCardProps = {
  slot: SlotDefinition;
  fileEntry: FileEntry | null;
  disabledReason?: string;
  onUpload: (slot: SlotDefinition, file: File) => Promise<FileEntry>;
  onDelete: (fileEntry: FileEntry) => Promise<void>;
};

export function SlotCard({
  slot,
  fileEntry,
  disabledReason,
  onUpload,
  onDelete,
}: SlotCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isOptimisticEntry =
    Boolean(fileEntry) &&
    (!fileEntry?.storage_url || fileEntry.id.startsWith("optimistic:"));
  const isUploadDisabled = Boolean(disabledReason);

  async function uploadSelectedFile(file: File | undefined) {
    if (!file || isUploading || isUploadDisabled) {
      return;
    }

    const acceptedExtensions = getAcceptedExtensions(slot);

    if (
      !acceptedExtensions.some((extension) =>
        file.name.toLowerCase().endsWith(extension),
      )
    ) {
      toast.warning(
        `Expected ${acceptedExtensions.join(" or ")}, uploading anyway.`,
      );
    }

    setIsUploading(true);

    try {
      await onUpload(slot, file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      toast.error(`${slot.label}: ${message}`);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function confirmDelete() {
    if (!fileEntry || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await onDelete(fileEntry);
      setDeleteOpen(false);
      toast.success("File deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDownload() {
    if (!fileEntry || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(fileEntry.storage_url);

      if (!response.ok) {
        throw new Error("Download failed.");
      }

      downloadBlob(await response.blob(), fileEntry.renamed_filename);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium leading-snug">
            {slot.label}
          </CardTitle>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {slot.optional ? <Badge variant="outline">Optional</Badge> : null}
            <Badge variant="outline">
              {getAcceptedExtensions(slot).join(" / ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {fileEntry ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--background-alt)] p-3">
              {isOptimisticEntry ? (
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
              ) : (
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">
                  {fileEntry.renamed_filename}
                </p>
                <p className="mt-1 break-words text-xs text-[var(--text-faded)]">
                  Original: {fileEntry.original_filename}
                </p>
              </div>
            </div>
            {isOptimisticEntry ? (
              <p className="text-xs text-[var(--text-faded)]">
                Uploading file...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Download />
                  )}
                  {isDownloading ? "Downloading..." : "Download"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 />
                  Delete
                </Button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-4 text-center transition-colors hover:border-[var(--primary)] hover:bg-[var(--background-alt)] focus-visible:border-[var(--primary)] focus-visible:ring-3 focus-visible:ring-[var(--primary)]/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 ${
              isDragging
                ? "border-[var(--primary)] bg-[var(--background-alt)] text-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--background)]"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              if (isUploadDisabled) {
                return;
              }
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              if (isUploadDisabled) {
                return;
              }
              void uploadSelectedFile(event.dataTransfer.files[0]);
            }}
            disabled={isUploading || isUploadDisabled}
          >
            {isUploading ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : (
              <UploadCloud className="size-5 text-[var(--text-faded)]" />
            )}
            <span className="text-sm font-medium">
              {isUploading
                ? "Uploading..."
                : disabledReason
                  ? disabledReason
                  : "Drop file or browse"}
            </span>
            <span className="text-xs text-[var(--text-faded)]">
              Expected {getAcceptedExtensions(slot).join(" or ")}
            </span>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={getAcceptedExtensions(slot).join(",")}
              disabled={isUploading || isUploadDisabled}
              onChange={(event) =>
                void uploadSelectedFile(event.target.files?.[0])
              }
            />
          </button>
        )}
      </CardContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete uploaded file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

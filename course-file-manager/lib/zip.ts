"use client";

import JSZip from "jszip";

import type { Course, FileEntry, Section } from "@/lib/types";
import {
  getCourseRootFolder,
  getSectionEntryRelativePath,
  getSectionRootFolder,
  safeZipSegment,
} from "@/lib/zip-paths";

type CourseZipInput = {
  course: Course;
  sections: Section[];
  fileEntries: FileEntry[];
};

type SectionZipInput = {
  section: Section;
  fileEntries: FileEntry[];
};

function zipFilename(rootFolder: string) {
  return `${rootFolder}.zip`;
}

async function fetchEntryBlob(entry: FileEntry) {
  const response = await fetch(entry.storage_url);

  if (!response.ok) {
    throw new Error(`Unable to fetch ${entry.renamed_filename}.`);
  }

  return response.blob();
}

async function addEntry(zip: JSZip, path: string, entry: FileEntry) {
  zip.file(path, await fetchEntryBlob(entry));
}

export function getCourseZipFilename(course: Course) {
  return zipFilename(getCourseRootFolder(course));
}

export function getSectionZipFilename(section: Section) {
  return zipFilename(getSectionRootFolder(section));
}

export async function buildCourseZip({
  course,
  sections,
  fileEntries,
}: CourseZipInput) {
  const zip = new JSZip();
  const rootFolder = getCourseRootFolder(course);
  zip.folder(rootFolder);
  const courseEntries = fileEntries.filter((entry) => entry.section_id === null);

  for (const entry of courseEntries) {
    await addEntry(
      zip,
      `${rootFolder}/${safeZipSegment(entry.renamed_filename)}`,
      entry,
    );
  }

  for (const section of sections) {
    const sectionFolder = `${rootFolder}/${getSectionRootFolder(section)}`;
    zip.folder(sectionFolder);
    const sectionEntries = fileEntries.filter(
      (entry) => entry.section_id === section.id,
    );

    for (const entry of sectionEntries) {
      await addEntry(
        zip,
        `${sectionFolder}/${getSectionEntryRelativePath(entry)}`,
        entry,
      );
    }
  }

  return zip.generateAsync({ type: "blob" });
}

export async function buildSectionZip({
  section,
  fileEntries,
}: SectionZipInput) {
  const zip = new JSZip();
  const rootFolder = getSectionRootFolder(section);
  zip.folder(rootFolder);

  for (const entry of fileEntries.filter(
    (fileEntry) => fileEntry.section_id === section.id,
  )) {
    await addEntry(
      zip,
      `${rootFolder}/${getSectionEntryRelativePath(entry)}`,
      entry,
    );
  }

  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

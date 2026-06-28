# Course File Manager

A Next.js application for organizing academic course files, renaming uploads to accreditation-friendly filenames, and preparing ZIP exports.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Storage
- jszip

## Local Development

Install dependencies:

```bash
npm install
```

Copy the environment example and fill in your Supabase project values:

```bash
cp .env.local.example .env.local
```

Required variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Supabase Setup

1. Create a new Supabase project from the Supabase dashboard.
2. Open Project Settings, then API.
3. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the publishable key into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Open the SQL Editor.
6. Paste and run the contents of `supabase/schema.sql`.

The schema creates these tables:

- `courses`
- `sections`
- `file_entries`

## Storage Setup

Create one Supabase Storage bucket:

- Bucket name: `course-files`
- Public bucket: enabled

The schema also includes Storage policies for the `course-files` bucket so this
unauthenticated V1 app can upload, read, and delete files with the Supabase
publishable key. If uploads fail with `new row violates row-level security
policy`, rerun the Storage policy section in `supabase/schema.sql`.

The app will use these path conventions:

- Section files: `{course_id}/{section_id}/{renamed_filename}`
- Course-level files: `{course_id}/course-level/{renamed_filename}`

Because V1 has no authentication, keep the deployed app URL private. Later versions should add Supabase Auth and replace permissive access with user-scoped row-level security policies.

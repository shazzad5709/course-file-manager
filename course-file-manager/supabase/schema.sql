create extension if not exists pgcrypto;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_code text not null,
  course_name text not null,
  course_type text not null check (course_type in ('Theory', 'Lab', 'Project')),
  semester text not null,
  coordinator_initial text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_label text not null,
  teacher_initial text not null,
  role text not null check (role in ('Section Teacher', 'Module Leader', 'Both')),
  created_at timestamptz not null default now()
);

create table if not exists public.file_entries (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.sections(id) on delete cascade,
  document_category text not null,
  sub_category text,
  quiz_number int check (quiz_number is null or quiz_number in (1, 2, 3)),
  original_filename text not null,
  renamed_filename text not null,
  storage_path text not null,
  storage_url text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists sections_course_id_idx on public.sections(course_id);
create index if not exists file_entries_course_id_idx on public.file_entries(course_id);
create index if not exists file_entries_section_id_idx on public.file_entries(section_id);

insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'course_files_anon_read'
  ) then
    create policy "course_files_anon_read"
    on storage.objects for select
    to anon
    using (bucket_id = 'course-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'course_files_anon_insert'
  ) then
    create policy "course_files_anon_insert"
    on storage.objects for insert
    to anon
    with check (bucket_id = 'course-files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'course_files_anon_delete'
  ) then
    create policy "course_files_anon_delete"
    on storage.objects for delete
    to anon
    using (bucket_id = 'course-files');
  end if;
end $$;

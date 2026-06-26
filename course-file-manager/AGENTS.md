<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Session Workflow

- Treat each requested session as a bounded milestone.
- Do not implement tasks from later sessions unless explicitly requested.
- During a session, make necessary fixes to complete that session, but do not start broad iterative polish beyond the session scope.
- At the end of every session, run the relevant verification commands and report results.
- If a dev server is required, start it and provide the local URL.
- Preserve user-created files and planning documents unless the user explicitly asks to modify them.

# General Engineering Rules

- Prefer the existing project patterns over introducing new architecture.
- Keep changes scoped to the current request.
- Use TypeScript types for shared data shapes and exported functions.
- Avoid unrelated refactors.
- Do not leave dead code, unused imports, or placeholder console logs.
- Keep README/setup docs accurate when setup steps, environment variables, or scripts change.
- Run lint/type/build checks when available before finishing a milestone.
- If a command fails, explain whether it is a code issue, missing environment setup, or local tooling issue.

# Code Quality

- Keep code simple, explicit, and easy to review.
- Prefer pure functions for business rules such as slot definitions, filename generation, completion math, and ZIP path construction.
- Avoid duplicating naming rules or slot definitions across UI and data layers.
- Keep components focused on one responsibility; move shared behavior into small helpers only when reuse or testability justifies it.
- Validate inputs at boundaries before writing to Supabase or Storage.
- Do not suppress TypeScript or ESLint errors unless there is a documented reason.
- Add tests for pure logic and high-risk behavior as soon as those modules exist.

# Security

- Never commit real secrets, Supabase keys other than anon/public keys, tokens, credentials, private URLs, or local `.env*` files.
- Keep `.env.local.example` limited to placeholder values.
- Treat uploaded filenames, Supabase records, URL params, and user-entered course metadata as untrusted input.
- Do not use `dangerouslySetInnerHTML` unless explicitly required and safely sanitized.
- Do not expose Supabase service-role keys or privileged credentials to client code.
- Do not add authentication bypasses, broad admin operations, or permissive database policies without calling out the security impact.
- For V1, remember the app is private-by-URL and unauthenticated; avoid presenting that as strong access control.
- Before each session closeout, check for likely repo leaks and app security issues introduced in that session.

# Course File Manager Rules

- Use Next.js App Router conventions.
- Use npm only.
- Use Tailwind CSS and shadcn/ui for UI work.
- Use Supabase for database and file storage integration.
- Use the `course-files` Supabase Storage bucket.
- Keep V1 single-user and unauthenticated unless a later session explicitly adds auth.
- Do not build product UI before the session that requests it.
- Follow `REQUIREMENTS.md` as the source of truth for document slots, filenames, ZIP structure, and out-of-scope items.
- All generated filenames must use underscores and exactly match the naming rules in `REQUIREMENTS.md`.
- Category values for representative examples must be only `Highest`, `Average`, or `Marginal`.
- Store section files at `{course_id}/{section_id}/{renamed_filename}`.
- Store course-level files at `{course_id}/course-level/{renamed_filename}`.
- ZIP export must preserve the required directory structure from `REQUIREMENTS.md`.

# Session Closeout Checklist

At the end of each full session, report:

- Files changed.
- Commands run.
- Whether lint/type/build/dev-server verification passed.
- Any skipped verification and the reason.
- Security checks performed and any remaining security notes.
- The local dev URL if the server is running.

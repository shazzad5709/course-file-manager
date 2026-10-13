# Project agent routing

## Root coordinator

GPT-6 Astra Low is primarily the planner, router, and coordinator. Minimize direct
implementation work. Delegate substantive implementation to `worker`; focus on
requirements, bounded task decomposition, shared context, integration decisions,
verification review, and the final response. Small coordination edits or trivial
self-contained tasks may be handled directly when delegation would cost more.

The root retains end-to-end ownership. Minimizing implementation does not mean
forwarding the entire user prompt to one subagent and waiting. The root must do
the decomposition, dependency ordering, routing, progress tracking, integration
review, and acceptance checks. These coordinator responsibilities apply to the
root only; subagents execute their assigned part and report back.

## Decompose before dispatch

1. For a substantial or multi-part request, identify the deliverables and acceptance
   criteria before choosing agents. Briefly tell the user the work breakdown,
   intended role for each part, and which parts depend on others.
2. Divide the request into cohesive bounded work packages by responsibility or
   outcome (for example, discovery, a business-rule change, a UI change, and
   verification). Each package needs a concrete output and clear ownership.
   Do not send the original broad request verbatim to one agent as its assignment.
3. If missing repository context prevents a useful breakdown, give scout a narrow
   discovery question first, then refine the plan using its findings. Discovery
   is an input to planning, not a handoff of the whole task.
4. Route each package independently: scout for evidence gathering, worker for
   ordinary implementation and tests, expert for the specific hard or high-risk
   question. Escalation applies to a blocked package, not automatically to the
   entire request. Multiple worker instances may own separate packages.
5. Run independent packages concurrently when useful work can proceed alongside
   them. Sequence dependencies and overlapping file edits; do not force parallelism
   or one agent of every role. A coherent small task may need just one worker or
   direct handling, but that exception must not swallow a separable multi-part task.
6. While agents work, coordinate other unblocked packages or resolve integration
   questions without duplicating their work. Review reports, route follow-ups,
   and track each package through completion. An agent report is evidence, not
   automatic acceptance of the whole request.
7. Before the final response, compare the combined result with the original
   acceptance criteria, review interfaces between packages, and ensure appropriate
   verification completed. Report the integrated outcome and unresolved limitations.

## Cost-efficient routing

- Use **Luna -> Terra -> Sol** escalation. Choose the least expensive role capable
  of the task; do not run all three tiers mechanically when context is already clear.
- Use `scout` (GPT-5.6 Luna Low, read-only) for repository exploration, searching,
  extraction, and tracing. It must not edit files or perform external mutations.
- Use `worker` (GPT-5.6 Terra Medium) as the default spawned implementation agent
  for features, fixes, tests, refactoring, and normal debugging. Route directly to
  worker for a bounded package when its relevant paths and requirements are known.
- Use `expert` (GPT-5.6 Sol High) for difficult debugging, architecture, security,
  concurrency, performance, or an evidenced blocker after Terra struggles.
  Clearly high-risk specialist work may go directly to expert with a stated reason.
- Escalate a worker blocker after a focused attempt and evidence-driven correction
  fail to make progress. Supply reproduction, attempts, findings, and the specific
  unresolved question. Avoid repeated speculative retries or restarting the task.
- After expert resolves the hard question, return routine implementation to worker.
  Do not use Astra as the fallback implementation engineer.

## Delegation and shared context

- Delegate concrete bounded subtasks. Each assignment must include its objective,
  relevant paths, known findings, constraints, file ownership, acceptance criteria,
  and expected verification. Use the configured role and reasoning level.
- Minimize duplicated repository exploration: usually assign one scout to a topic,
  retain its concise findings in the coordinator context, and pass them to successors.
  Workers and experts should inspect only missing or changed context.
- Do not independently repeat delegated work while waiting. Review targeted evidence
  and resulting diffs instead of rerunning the entire investigation.
- Parallelize only independent work with clear ownership. Use one writer per file
  at a time; sequence overlapping edits. Preserve other agents' and users' changes.
- Four spawned threads is a ceiling, not a target; the root does not count toward
  this configured limit. Use fewer agents when sufficient and reuse existing agents
  for follow-ups. Subagents should return to the coordinator rather than spawn more.
- Require concise reports, normally at most 8 bullets: outcome, relevant paths or
  symbols, evidence, changes, checks/results, blockers, and recommended next action.
  Omit full file dumps, raw logs, repeated background, and unsupported success claims.

## Repository scope and verification

- The application lives in `course-file-manager/`. Follow its existing `AGENTS.md`
  for application work; consult `REQUIREMENTS.md` and `CLAUDE_CODE_SESSIONS.md` for
  requirements and session boundaries. More specific directory guidance still applies.
- Preserve existing uncommitted changes and user-provided data. Keep work within the
  requested milestone and avoid unrelated refactors or later-session work.
- For configuration-only requests, change only the requested configuration and
  instruction files. Do not modify application source code.
- Validate TOML syntax and requested settings for configuration changes and check
  the diff boundary. For application changes, follow the application's required
  tests, lint, build, and security checks. Report checks performed and any omissions.
- Do not introduce secrets or loosen approval, sandbox, authentication, or data-access
  controls as a shortcut. Keep scout read-only and inherit existing permissions for
  implementation agents.

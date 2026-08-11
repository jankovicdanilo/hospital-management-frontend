# # Project Conventions

This file documents coding standards for this project.
Claude Code should follow these conventions automatically when writing or editing any code here.

## Code Style

- **Always use braces `{}` for if/else/for/while statements**, even
  single-line ones.

## Styling

- Use Tailwind for all styling. Do not add external UI component
  libraries unless explicitly requested.
  Don't default to the plainest possible implementation. Use thoughtful spacing,
  typography hierarchy, and subtle color/shadow choices — this is an internal business tool,
  not a wireframe, but it should still feel considered rather than bare-minimum.
  Look at existing styled components in the project (e.g. LoginPage) for the established visual language and stay consistent with it rather than inventing a new style each time.
  You have creative latitude here — exact colors, spacing values, and layout details don't
  need to be specified in every prompt. Use good judgment by default so this doesn't need correcting after the fact.

  Established conventions: primary actions use a solid blue button with
  white text; secondary actions (Cancel, Edit) use bordered/outline
  buttons; destructive actions (Delete) use a red outline style. Cards
  and tables use rounded corners with generous padding over a dense
  layout.

## Scope Discipline

- **Do not add tooling, dependencies, or verification steps beyond what
  was explicitly requested.** This includes browser automation (e.g.
  Playwright), testing frameworks, linters, or CI config. These are all
  legitimate tools — the rule is about who decides to add them, not
  whether they're allowed. Add them only when a prompt asks for them
  directly.
- If a build/typecheck passes, that is sufficient verification unless
  told otherwise. Do not launch a browser or install additional tools
  to "double check" on your own initiative.

## Git

- Never run any git commands that change repository state — no git add,
  git commit, git push, branch creation, merge, reset, or similar.
  Leave the working tree as modified/untracked files; the developer
  reviews and commits manually.
- Read-only git commands (git diff, git log, git status) are fine —
  needed for reviewing changes before a PR.
- If .gitignore doesn't exist or looks incomplete, flag it to the
  developer rather than fixing it yourself via git commands — you can
  still create/edit the .gitignore file's contents directly, since
  that's a file edit, not a git operation.

## Environment Files

- Never touch .env at all — no reading, no writing, no creating it. Use .env.example for declaring what variables a feature needs 
  (placeholder values only); the developer creates/edits their own .env manually. This is enforced by a hook, but don't attempt it regardless.
- Never commit `.env` — confirm it's covered by `.gitignore`.

## Environment variables

Frontend env vars pointing at backend services:

- VITE_AUTH_SERVICE_URL — Auth service
- VITE_QUERY_SERVICE_SERVICE_URL — QueryService (GET/read endpoints for patients/doctors/procedures/doctor-schedules)
- VITE_COMMAND_SERVICE_SERVICE_URL — CommandService (POST/PUT/DELETE endpoints for patients/doctors/procedures/doctor-schedules)
- VITE_APPOINTMENT_SERVICE_URL — Appointment service (all endpoints, reads and writes — this service is not split across QueryService/CommandService)

## Auth

Authenticated requests attach the JWT token as a Bearer token in the
Authorization header. Token comes from the in-memory auth context —
never persisted to storage.

## Handling inconsistencies between files

If you find two files disagreeing (e.g. an env var name, a type shape,
a route path), do not silently resolve it by picking one side. Flag
the discrepancy and ask which one is correct — don't assume the older
or "example" file is the source of truth.
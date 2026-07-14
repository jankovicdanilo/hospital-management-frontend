# Project Conventions

This file documents coding standards for this project. Claude Code should follow these
conventions automatically when writing or editing any code here.

## Code Style

- **Always use braces `{}` for if/else/for/while statements**, even
  single-line ones. Never write bare single-line conditionals.

## Scope Discipline

- **Do not add tooling, dependencies, or verification steps beyond what
  was explicitly requested.** This includes browser automation (e.g.
  Playwright), testing frameworks, linters, or CI config — unless asked
  for directly.
- If a build/typecheck passes, that is sufficient verification unless
  told otherwise. Do not install additional tools to "double check."

## Git / Environment

- Never assume `.gitignore` exists — confirm it's present and correct
  before running `git add .` on a new project.

---
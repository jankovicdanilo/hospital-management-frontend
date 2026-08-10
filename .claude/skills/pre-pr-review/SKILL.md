---
name: pre-pr-review
description: Use this skill whenever the user is about to create a pull request, or asks to review changes before one — e.g. "review my changes", "ready for a PR", "check this before I push".
---

# Pre-PR Review

Review the current branch's changes the way a mentor reviewing a PR
would — thorough, and skeptical of anything that looks copy-pasted,
guessed, or inconsistent with the rest of the codebase.

## Steps

1. Run `git diff main` (or the relevant base branch) to see everything
   changed on this branch.
2. Check for the specific failure patterns that AI-written code tends
   to produce:
   - Duplicated logic/classes that should reuse an existing shared
     file instead (e.g. redefining a class that already exists
     elsewhere)
   - A file edited to "resolve" a disagreement with another file by
     silently picking one side, instead of flagging the conflict
   - Env var names, endpoint paths, or DTO field names that don't
     match what's actually declared elsewhere in the project
   - Documentation/contract files that no longer match the code they
     describe (stale after a related change)
   - Missing error handling that the rest of the codebase already has
     a convention for (e.g. a Result.Fail call without an ErrorType,
     a controller not using HandleFailure)
   - If .claude/ files (skills, prompts, contracts) were changed on
     this branch, check them for the same kinds of issues — broken
     references to renamed/moved files, outdated content left over
     from a restructuring, inconsistent naming
3. Check naming and structure:
   - File and folder names/locations follow the conventions already
     established elsewhere in the project (e.g. matching naming
     patterns, correct folder for the type of file)
   - Names inside files (classes, functions, variables, DTO fields)
     are consistent with naming already used for similar things
     elsewhere in the codebase — no inconsistent casing or naming
     style introduced
4. Check the changes against the actual assigned task: re-read what
   the mentor (Aleksei) or the prompt asked for, and confirm the diff
   fully addresses it — nothing missing, and nothing extra/unrequested
   added that wasn't asked for.
5. Report findings grouped into:
   - Blocking issues (real bugs or convention violations)
   - Worth a second look (works but deviates from established patterns)
   - Nitpicks (minor, mention but don't dwell)
6. Do not fix anything automatically — report findings only, so the
   developer can decide what to address before committing/pushing.
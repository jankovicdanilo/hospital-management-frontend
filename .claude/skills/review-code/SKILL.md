---
name: review-code
description: Use this skill to review changes to application code (backend or frontend) before a pull request.
---

# Review Code

## Steps

1. Run `git diff main` and filter to only files outside `.claude/`.
2. Check for the specific failure patterns AI-written code tends to
   produce:
   - Duplicated logic/classes that should reuse an existing shared
     file instead
   - A file "resolving" a disagreement with another file by silently
     picking one side
   - Env var names, endpoint paths, or DTO field names that don't
     match what's declared elsewhere
   - Missing error handling the codebase already has a convention for
     (e.g. Result.Fail without an ErrorType, a controller not using
     HandleFailure)
3. Check naming and structure: files/folders and names inside files
   (classes, functions, variables, DTO fields) match existing
   conventions.
4. Check the changes against the actual assigned task — nothing
   missing, nothing extra/unrequested.
5. Report findings grouped into: Blocking issues, Worth a second look,
   Nitpicks. Do not fix anything automatically.
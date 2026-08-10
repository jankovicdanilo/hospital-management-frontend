---
name: review-claude-files
description: Use this skill to review changes to .claude/ files before a pull request.
---

# Review .claude Files

## Steps

1. Run `git diff main` and filter to only files under `.claude/`.
2. Check for:
   - Broken references to renamed/moved files
   - Content that no longer matches reality (a contract doc describing
     an endpoint shape that doesn't match the actual code)
   - Naming and folder structure consistent with existing conventions
   - Content left over from a restructuring that's now redundant or dead
3. Check the changes against the actual assigned task — nothing
   missing, nothing extra/unrequested.
4. Report findings grouped into: Blocking issues, Worth a second look,
   Nitpicks. Do not fix anything automatically.
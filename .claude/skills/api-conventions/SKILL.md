---
name: api-conventions
description: Use this skill whenever building or modifying a frontend feature that calls the HospitalManagement backend.
---

# API Conventions

Cross-cutting rules that apply across every service. Read the relevant
reference file(s) below based on what the task involves:

- references/error-responses.md — the two error shapes (business-rule
  and field-level validation)
- references/success-responses.md — response shapes, including the
  PagedResult and Billing exceptions
- references/shared-api-client.md — ApiError/throwApiError/authHeaders
  in src/api/apiErrors.ts
- references/auth.md — JWT Bearer token handling
- references/date-serialization.md — DateOnly field format
- references/file-conflicts.md — how to handle disagreeing files
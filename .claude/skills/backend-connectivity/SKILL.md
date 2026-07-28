---
name: backend-connectivity
description: Use this skill whenever building or modifying a frontend feature that calls the HospitalManagement backend (CommandService, QueryService, Auth, or any other service) — covers error response shapes, success response shapes, environment variable names, auth header conventions, and how to handle conflicting information between files.
---

# Backend Connectivity Conventions

Cross-cutting rules that apply across every service, regardless of
endpoint. Per-service contracts in .claude/architecture/services/*.md
assume these without restating them.

## Error responses

All backend failures follow one of two shapes:

### Business-rule / not-found errors
Status code indicates the category (404 not found, 409 conflict,
401 unauthorized, 400 validation, 502 upstream failure). Body:

{ "message": string, "errorCode": string }

### Field-level validation errors (FluentValidation, always 400)

{
"errorCode": "VALIDATION_FAILED",
"message": string,
"errors": { "<FieldName>": ["<message>", ...], ... }
}

## Shared API client code

ApiError, throwApiError, and authHeaders belong in src/api/apiErrors.ts.

If this file already exists, import from it — do not redefine these
per-feature.

If it does not exist yet, create it with this shape:

export interface ApiErrorResponse {
message: string;
errorCode: string;
errors?: Record<string, string[]>;
}

export class ApiError extends Error {
readonly errorCode: string;
readonly errors?: Record<string, string[]>;

constructor(message: string, errorCode: string, errors?: Record<string, string[]>) {
super(message);
this.name = 'ApiError';
this.errorCode = errorCode;
this.errors = errors;
}
}

export async function throwApiError(response: Response): Promise<never> {
const body: ApiErrorResponse = await response.json();
throw new ApiError(body.message, body.errorCode, body.errors);
}

export function authHeaders(token: string): HeadersInit {
return { Authorization: `Bearer ${token}` };
}

## Success responses

- Endpoints returning a resource (GET, POST, PUT) return the
  DTO/list directly, unwrapped — no envelope, no `success`/`data` keys.
- Endpoints with no resource to return (DELETE, status-only actions)
  return `{ message: string }` only.
- Exception: paginated list endpoints return `PagedResult<T>` after
  unwrapping — { items: T[], totalCount, pageNumber, pageSize } — not
  a flat array. Check the specific service's contract file for which
  list endpoints are paginated.
- Exception: Billing's invoice generation endpoint returns a raw file
  (binary), not JSON.

  ## Pagination

  Paginated list endpoints accept `pageNumber` and `pageSize` as query
  parameters (e.g. `GET /api/patient?pageNumber=1&pageSize=20`), validated
  server-side (page number > 0, page size between 1 and 100). Check the
  specific service's contract file for which list endpoints are paginated.

## Environment variables

Frontend env vars pointing at backend services:

- VITE_AUTH_SERVICE_URL — Auth service
- VITE_QUERY_SERVICE_SERVICE_URL — QueryService (all GET/read endpoints)
- VITE_COMMAND_SERVICE_SERVICE_URL — CommandService (all POST/PUT/DELETE endpoints)

## Auth

Authenticated requests attach the JWT token as a Bearer token in the
Authorization header. Token comes from the in-memory auth context —
never persisted to storage.

## Date serialization

Backend `DateOnly` fields (e.g. dateOfBirth) serialize over JSON as
ISO date strings, e.g. "1990-05-14" — not full datetime strings, and
not JS Date objects.

## Handling inconsistencies between files

If you find two files disagreeing (e.g. an env var name, a type shape,
a route path), do not silently resolve it by picking one side. Flag
the discrepancy and ask which one is correct — don't assume the older
or "example" file is the source of truth.

## Shared list/table component

Tables with pagination use src/components/DataTable.tsx.

If this file already exists, import and use it — do not hand-roll a
new `<table>` per feature.

If it does not exist yet, create a generic component accepting:
columns (header + render function per column), rows, rowKey, loading,
emptyMessage, optional actions per row, and an optional pagination
object ({ pageNumber, pageSize, totalCount, onPageChange }) rendering
page controls.</message>
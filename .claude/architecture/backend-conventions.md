# Backend Conventions (General)

Cross-cutting rules that apply across every service, regardless of
endpoint. Per-service contracts in .claude/architecture/services/*.md assume
these without restating them.

## Error responses

All backend failures follow one of two shapes:

## Business-rule / not-found errors
Status code indicates the category (404 not found, 409 conflict,
401 unauthorized, 400 validation, 502 upstream failure). Body:

{ "message": string, "errorCode": string }

## Field-level validation errors (FluentValidation, always 400)

{
"errorCode": "VALIDATION_FAILED",
"message": string,
"errors": { "<FieldName>": ["<message>", ...], ... }
}

## Error class shape

Throw API errors as a custom `ApiError` extending `Error`. Use explicit
property declarations, not TypeScript parameter properties:

class ApiError extends Error {
readonly errorCode: string;
readonly errors?: Record<string, string[]>;

constructor(message: string, errorCode: string, errors?: Record<string, string[]>) {
super(message);
this.name = 'ApiError';
this.errorCode = errorCode;
this.errors = errors;
}
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

## Environment variables

Frontend env vars pointing at backend services:

- VITE_AUTH_SERVICE_URL — Auth service
- VITE_QUERY_SERVICE_SERVICE_URL
- VITE_COMMAND_SERVICE_SERVICE_URL

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
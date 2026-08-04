# API Conventions

Cross-cutting rules that apply across every service when calling the
HospitalManagement backend.

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

## Date serialization

Backend `DateOnly` fields (e.g. dateOfBirth) serialize over JSON as
ISO date strings, e.g. "1990-05-14" — not full datetime strings, and
not JS Date objects.


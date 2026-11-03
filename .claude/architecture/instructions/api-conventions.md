# API Conventions

Cross-cutting rules that apply across every service when calling the
HospitalManagement backend.

## Error responses

All backend failures follow one of two shapes:

### Business-rule / not-found errors

Status code indicates the category (404 not found, 409 conflict,
401 unauthorized, 403 forbidden, 400 validation, 502 upstream failure). Body:

{ "message": string, "errorCode": string }

### Forbidden errors (403)

The user is logged in but not allowed. The body is the same as for other errors:
`{ "message": string, "errorCode": string }`. Show the message and keep the user logged in.

| Code                   | Source                                                         |
|------------------------|----------------------------------------------------------------|
| `FORBIDDEN`            | Role policy, or a role that is not allowed to use appointments |
| `NOT_YOUR_APPOINTMENT` | A doctor touched another doctor's appointment                  |
| `NOT_YOUR_PATIENT`     | A doctor asked for a patient who is not his                    |
| `DOCTOR_NOT_LINKED`    | Doctor account without `doctorId`                              |

A 401 still means not logged in, expired, or revoked. See [Roles and permissions](roles-and-permissions.md).

### Field-level validation errors (FluentValidation, always 400)

{
"errorCode": "VALIDATION_FAILED",
"message": string,
"errors": { "<FieldName>": ["<message>", ...], ... }
}

Not every error response is guaranteed to have a JSON body — some
non-2xx responses (e.g. a 405 from a routing mismatch, or certain
409s) can come back with an empty body. Error handling must not assume
every failure is parseable JSON — see the throwApiError implementation
below, which falls back to a generic error when the body is empty or
not valid JSON.

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
readonly status: number;
readonly errorCode: string;
readonly errors?: Record<string, string[]>;

constructor(message: string, errorCode: string, status: number, errors?: Record<string, string[]>) {
super(message);
this.name = 'ApiError';
this.status = status;
this.errorCode = errorCode;
this.errors = errors;
}
}

// Set by AuthProvider so a 401 (expired/revoked token) logs the user out
// from wherever the failing request happened, without every call site
// needing to check for it — see Roles and permissions for the 401 vs 403
// distinction this exists to support.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
unauthorizedHandler = handler;
}

export async function throwApiError(response: Response): Promise<never> {
const text = await response.text();

if (response.status === 401) {
unauthorizedHandler?.();
}

if (text) {
try {
const body: ApiErrorResponse = JSON.parse(text);
throw new ApiError(body.message, body.errorCode, response.status, body.errors);
} catch (err) {
if (err instanceof ApiError) {
throw err;
}
// Body was present but not valid JSON — fall through to the generic error below.
}
}

throw new ApiError(`Request failed with status ${response.status}.`, 'UNKNOWN_ERROR', response.status);
}

export function authHeaders(token: string): HeadersInit {
return { Authorization: `Bearer ${token}` };
}

## Date serialization

Backend `DateOnly` fields (e.g. dateOfBirth) serialize over JSON as
ISO date strings, e.g. "1990-05-14" — not full datetime strings, and
not JS Date objects.

## Dates, times and timezones

All date and time rules, including time zones, are in
[time-handling.md](time-handling.md). Read it before touching
anything that shows, accepts, or filters by a date or time.

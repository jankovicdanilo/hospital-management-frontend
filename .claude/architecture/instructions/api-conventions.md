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
const text = await response.text();

if (text) {
try {
const body: ApiErrorResponse = JSON.parse(text);
throw new ApiError(body.message, body.errorCode, body.errors);
} catch (err) {
if (err instanceof ApiError) {
throw err;
}
// Body was present but not valid JSON — fall through to the generic error below.
}
}

throw new ApiError(`Request failed with status ${response.status}.`, 'UNKNOWN_ERROR');
}

export function authHeaders(token: string): HeadersInit {
return { Authorization: `Bearer ${token}` };
}

## Date serialization

Backend `DateOnly` fields (e.g. dateOfBirth) serialize over JSON as
ISO date strings, e.g. "1990-05-14" — not full datetime strings, and
not JS Date objects.

## DateTime fields and timezones

Any full `DateTime` field sent to the backend (e.g. an appointment's
start time) must be sent as a genuine UTC value — use `date.toISOString()`
on a real JS `Date` object, never a manually-built local-time string.
The backend stores `DateTime` columns as UTC and compares against
`DateTime.UtcNow` for time-based logic (e.g. marking appointments
Missed) — sending a local, timezone-less string will silently
double-shift any comparison against a schedule or "now."

Business hours, weekly schedules, and day-of-week are defined in the
clinic's local time, not UTC. The backend converts UTC values to
clinic-local time internally before comparing against schedule hours
or determining which weekday a `DateTime` falls on — the frontend does
not need to do this conversion itself, only ensure it sends genuine
UTC in the first place.

When displaying a `DateTime` received from the backend, convert it to
the user's local time for display (`new Date(isoString)` plus
`.toLocaleTimeString()`/`.toLocaleDateString()` — this happens
automatically once the backend returns a proper UTC ISO string).
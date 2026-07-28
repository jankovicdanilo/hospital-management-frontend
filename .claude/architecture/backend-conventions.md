# Backend Conventions (General)

Cross-cutting rules that apply across every service, regardless of
endpoint. Per-service contracts in .claude/architecture/contracts/*.md assume
these without restating them.

## Error responses

Every failed request returns:
```
{ message: string, errorCode: string }
```
with an appropriate HTTP status code (400, 401, 404, 409, etc.)
depending on the failure.

## Success responses

Shape varies by endpoint — check the specific service's contract file
in architecture/contracts/. Some endpoints return flat data, others
wrap data with a message. Don't assume one pattern applies everywhere.

## Environment variables

Frontend env vars pointing at backend services follow the pattern
`VITE_<SERVICE_NAME>_SERVICE_URL`, e.g. `VITE_AUTH_SERVICE_URL`.

## Auth

Authenticated requests attach the JWT token as a Bearer token in the
Authorization header. Token comes from the in-memory auth context —
never persisted to storage.
# Success responses

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
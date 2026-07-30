# Pagination

Paginated list endpoints accept `pageNumber` and `pageSize` as query
parameters (e.g. `GET /api/patient?pageNumber=1&pageSize=20`), validated
server-side (page number > 0, page size between 1 and 100). Check the
specific service's contract file for which list endpoints are paginated.

Paginated responses from the backend come wrapped in `PagedResult<T>`
after the outer envelope is unwrapped — { items: T[], totalCount,
pageNumber, pageSize } — not a flat array.
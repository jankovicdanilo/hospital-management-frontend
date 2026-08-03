# List/Table Pages

Conventions for any page showing a list of records in a table.

## Shared table component

Tables use src/components/DataTable.tsx.

If this file already exists, import and use it — do not hand-roll a
new `<table>` per feature.

If it does not exist yet, create a generic component accepting:
columns (header + render function per column), rows, rowKey, loading,
emptyMessage, optional actions per row, and an optional pagination
object ({ pageNumber, pageSize, totalCount, onPageChange }) rendering
page controls.

## Pagination

Paginated list endpoints accept `pageNumber` and `pageSize` as query
parameters (e.g. `GET /api/patient?pageNumber=1&pageSize=20`), validated
server-side (page number > 0, page size between 1 and 100). Check the
specific service's contract file for which list endpoints are paginated.

Paginated responses from the backend come wrapped in `PagedResult<T>`
after the outer envelope is unwrapped — { items: T[], totalCount,
pageNumber, pageSize } — not a flat array.

## List page styling

### Summary stat cards
List pages (Patients, Doctors, Procedures, Dashboard) should show a row
of small stat cards above the main table — e.g. total count, and one or
two other relevant numbers for that entity. Muted small label above a
larger bold number, on a light gray card background, no border.

### Avatar initials
Wherever a person's name is shown in a table row (Patient, Doctor), show
a small circular avatar with their initials before the name — light blue
background, blue text, consistent size (~36px).

### Status/info badges
Where a row has a categorical value worth highlighting (e.g. active/
inactive, a specialization, a price tier), show it as a small rounded
pill/badge with a tinted background and matching darker text color —
not just plain text. Use color meaningfully (e.g. green-ish for a
positive/active state), not decoratively.
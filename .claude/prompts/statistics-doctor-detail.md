## Feature: Doctor Statistics Detail

I want clicking a doctor on the statistics page to show statistics for
that doctor. Use the statistics-service backend for fetching data.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)
- [Statistics page](.claude/prompts/statistics-page.md)

- Bars in the Doctors Load and Doctors Revenue charts and lines in the
  Doctor Load Timeline chart are clickable (pointer cursor, hover
  state) and open /statistics/doctors/:doctorId. The selected From/To
  range travels in the URL query and is restored on load; the page
  has a back link to /statistics that keeps the range
- Detail page for GET /api/statistics/doctors/{doctorId}: the doctor's
  name as the heading, stat cards (appointments, completed, revenue,
  unique patients), a status breakdown chart (pending, completed,
  missed, cancelled), a visits-over-time line chart, a "Top
  procedures" table, and a "Top patients" table
- Same From/To inputs as the main page; changing them refetches
- Loading and error states scoped to the page; a 404 INVALID_DOCTOR_ID
  shows a "Doctor not found" state with the back link
- Reuse the existing chart and stat-card components
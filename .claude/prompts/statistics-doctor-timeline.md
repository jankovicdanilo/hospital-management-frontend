## Feature: Doctor Load Timeline

I want to add a chart to the statistics page showing appointment load
over time for the top 10 doctors. Use the statistics-service backend
for fetching data.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)
- [Statistics page](.claude/prompts/statistics-page.md)

- New section below "Doctors Load", same card style and the same shared
  date range, with its own loading, empty, and error states
  (GET /api/statistics/doctors/load/timeline)
- Multi-line chart: one line per doctor, months on the x axis,
  appointment count on the y axis. Extend the existing line chart
  component to support multiple series instead of writing a new one
- Legend with doctor names; hovering a line highlights it and dims the
  others, and the tooltip shows doctor, month, and count. Use
  distinguishable colors, not only the blue accent
- The series are already aligned and gap-filled by the backend — don't
  fill months on the client
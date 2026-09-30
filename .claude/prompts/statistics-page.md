## Feature: Statistics Dashboard

I want to create a statistics page. Use the statistics-service backend
for fetching data.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)
- [Statistics service contract](.claude/skills/service-lookup/references/statistics-service-contract.md)

- Page at /statistics, added to the main navigation alongside the other
  pages. Read-only — there are no create/edit/delete actions.
- A date-range filter above all sections: "From" and "To" date inputs
  shared by every section. Defaults to the last 12 months, computed
  from today's date in the clinic timezone (see api-conventions.md),
  not the browser's. Changing either date refetches all four sections.
  "To" cannot be before "From" — prevent it in the inputs so
  INVALID_DATE_RANGE is never sent, and don't fire requests while the
  range is invalid.
- Four sections, each in its own card, each with its own loading,
  empty, and error state. Fetch the four endpoints in parallel:
    1. Doctors load — horizontal bar chart, one bar per doctor,
       appointment count. GET /api/statistics/doctors/load
    2. Doctors revenue — bar chart, one bar per doctor, revenue
       formatted with formatCurrency; the completed-appointment count
       shows in the hover tooltip. GET /api/statistics/doctors/revenue
    3. Procedures profitability — bar chart, one bar per procedure,
       revenue (that's what profitability means here: money made from
       the procedure); the times-performed count shows in the tooltip.
       GET /api/statistics/procedures/profitability
    4. Patient statistics — GET /api/statistics/patients, shown as:
        - four stat cards: total patients, total visits, total
          revenue, average revenue per patient
        - a line chart of visits over time (one point per month, month
          labels on the x axis). The backend omits empty months, so
          fill missing months between the first and last returned
          period with 0 before drawing
        - a "Top patients" table: name, visits, revenue
- Charts are built with d3.js. Build reusable bar-chart and line-chart
  components that take data and accessor props, rather than one
  hand-written chart per section. Each chart:
    - resizes with its container
    - shows a tooltip on hover with the exact values
    - has readable axis labels; long doctor/procedure names must not
      get clipped or overlap (truncate with the full name in the
      tooltip)
    - lists bars in the order the backend returns them (already sorted)
- Empty state per section when the range has no data (`[]`, or a
  patients response with `totalVisits` of 0): a short message inside
  the card, not an error.
- On failure, show the backend message inside the affected section
  only, never a page-wide banner. For 502 UPSTREAM_FAILURE also show a
  "Retry" button that refetches just that section. Errors clear as
  soon as a new fetch starts.
- A loading state for each section while its request is in flight.
- Results can be up to 5 minutes stale (backend cache) — don't add
  client-side polling or manual "refresh data" workarounds for that.

## Styling

- Match the existing app's visual language: rounded cards, consistent
  spacing, the established button hierarchy (outline for the Retry
  action)
- Layout: date-range filter on top, then the two doctor charts side by
  side on wide screens, procedures below them, then the patient
  section (stat cards row, line chart, top patients table). Stack the
  sections in one column on narrow screens
- Use one consistent color for bars in a chart and a second color for
  the line chart; keep the palette close to the app's existing blue
  accent. Never encode meaning by color alone — tooltips and labels
  carry the values
- Stat cards: large number, small label beneath, same card style as
  elsewhere in the app

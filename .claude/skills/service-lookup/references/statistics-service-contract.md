# Statistics Service

Like the Appointment service, all Statistics endpoints are served from a
single dedicated base URL — `VITE_STATISTICS_SERVICE_URL` (Docker
Compose: `http://localhost:8086`) — not the QueryService/CommandService
split described in API conventions. The service is read-only: there are
no write endpoints.

## Endpoints

All endpoints are GET, require the bearer token, and take `from` and
`to` — both required, `yyyy-MM-dd`, both inclusive. None are paginated:
each returns its full result directly, unwrapped (no `PagedResult`).

- GET /api/statistics/doctors/load?from&to → DoctorLoadDto[] (sorted by appointmentCount, descending)
    - Counts every appointment except Cancelled
- GET /api/statistics/doctors/revenue?from&to → DoctorRevenueDto[] (sorted by revenue, descending)
    - Completed appointments only; uses the discounted appointment total
- GET /api/statistics/procedures/profitability?from&to → ProcedureProfitabilityDto[] (sorted by revenue, descending)
    - "Profitability" means revenue: the money made from the procedure
    - Completed appointments only; gross, discounts are not split across procedures
- GET /api/statistics/patients?from&to → PatientStatisticsDto
- GET /api/statistics/doctors/load/timeline?from&to&[top] → DoctorLoadTimelineDto[] (sorted by totalAppointments, descending)
    - `top` is optional: default 10, allowed 1–50
    - Counts every appointment except Cancelled, per month
    - Every doctor's `points` cover the same months, so all lines share one x axis
- GET /api/statistics/doctors/{doctorId}?from&to → DoctorStatisticsDto
    - Statistics for a single doctor over the range

## DTOs

DoctorLoadDto: { doctorId: number, doctorName: string, appointmentCount: number }

DoctorRevenueDto: { doctorId: number, doctorName: string, revenue: number, completedCount: number }

ProcedureProfitabilityDto: { procedureId: number, procedureName: string, timesPerformed: number, revenue: number }

PatientStatisticsDto: { totalPatients: number, totalVisits: number, totalRevenue: number, averageRevenuePerPatient: number, visitsOverTime: VisitsOverTimeDto[], topPatients: TopPatientDto[] }

VisitsOverTimeDto: { period: string, visits: number }

TopPatientDto: { patientId: number, patientName: string, visits: number, revenue: number }

DoctorLoadTimelineDto: { doctorId: number, doctorName: string, totalAppointments: number, points: VisitsOverTimeDto[] }

DoctorStatisticsDto: { doctorId: number, doctorName: string, appointmentCount: number, pendingCount: number, completedCount: number, missedCount: number, cancelledCount: number, revenue: number, uniquePatients: number, visitsOverTime: VisitsOverTimeDto[], topProcedures: ProcedureProfitabilityDto[], topPatients: TopPatientDto[] }

Note: `period` is a month as `"yyyy-MM"` (e.g. `"2026-03"`), sorted
ascending.

Note: `topPatients` and `topProcedures` have at most 5 entries. Patients
are ordered by revenue and then by visits, procedures by revenue. The
count is fixed by the backend.

Note: `revenue`, `totalRevenue` and `averageRevenuePerPatient` are EUR
monetary amounts (same unit as appointment `totalCost`) — display them
with the shared `formatCurrency` helper.

Note: `totalVisits` and `totalPatients` exclude Cancelled appointments.
`averageRevenuePerPatient` is total revenue divided by the number of
patients with at least one Completed appointment, so it is not
`totalRevenue / totalPatients`.

Note: on `DoctorStatisticsDto`, `appointmentCount` excludes Cancelled
and equals `pendingCount + completedCount + missedCount`;
`cancelledCount` is reported separately. `revenue` is Completed
appointments only, `uniquePatients` counts distinct patients among the
non-cancelled appointments.

## Errors

Follow the shapes in api-conventions.md (`throwApiError` applies as-is).

- 400 `INVALID_DATE_RANGE` — `from` is after `to`
- 400 `INVALID_TOP` — `top` is outside 1–50 (timeline endpoint)
- 404 `INVALID_DOCTOR_ID` — the doctor does not exist and has no
  appointments in the range (doctor endpoint)
- 502 `UPSTREAM_FAILURE` — the Appointment or Query service failed or
  timed out; safe to retry
- 401 `UNAUTHORIZED` — missing or invalid token
- A missing or unparseable `from`/`to` comes back as a plain 400 from
  model binding, not necessarily with the `{ message, errorCode }` body

## Frontend implementation notes

- Send `from`/`to` as plain `yyyy-MM-dd` dates, never as ISO datetimes.
  The backend interprets them as clinic-local calendar days
  (`Europe/Podgorica`), so any default range ("this year", "last 12
  months") must be computed from today's date in the clinic timezone,
  not the browser's — see the DateTime/timezone section in
  api-conventions.md.
- `/patients` `visitsOverTime` omits months with no visits. Fill the
  gaps with `visits: 0` on the client before drawing a line chart. The
  timeline endpoint and `DoctorStatisticsDto.visitsOverTime` are
  already gap-filled between the first and last month that has a visit,
  so no client-side filling is needed there.
- Months are bucketed by the appointment's UTC timestamp, so an
  appointment right at a month boundary can land in the neighbouring
  month. This is accepted; do not try to correct it client-side.
- A range with no data returns `[]` for the list endpoints (including
  the timeline) and zeros with empty arrays for `/patients` and for a
  doctor that exists — this is not an error. Show an empty state.
- Doctors or patients that no longer exist come back named
  `Unknown doctor (12)` / `Unknown patient (12)`. Display them as-is.
- Results are cached on the backend for 5 minutes per endpoint and date
  range (and per `top` / `doctorId`). After changing appointment data
  elsewhere, the numbers can lag by up to 5 minutes — expected, not a
  bug to work around.
- The endpoints are independent: fetch them in parallel and give each
  its own loading and error state, so one `UPSTREAM_FAILURE` does not
  blank the whole page.
- The first request for a given range can be noticeably slower than a
  cached one (it fans out to two services), so always show a loading
  state.
# Appointment Service

Unlike other services, all Appointment endpoints (reads and writes) are
served from a single dedicated base URL — `VITE_APPOINTMENT_SERVICE_URL`
— not the QueryService/CommandService split described in API
conventions.

## Endpoints

- GET /api/appointment?[doctorId]&[patientId]&[date]&[startDate]&[endDate]&[status]&pageNumber&pageSize → PagedResult<AppointmentListResponseDto> (list, paginated)
    - Provide either `date` (single day) or `startDate`+`endDate` (range) — not both meaningfully, range takes priority if both are sent
    - `startDate`/`endDate` must both be present together or both omitted
- GET /api/appointment/{id} → AppointmentResponseDto
- POST /api/appointment, body AppointmentCreateRequestDto → AppointmentCreateResponseDto
- PUT /api/appointment, body AppointmentUpdateRequestDto → AppointmentUpdateResponseDto
- DELETE /api/appointment/{id} → success/failure only
- PATCH /api/appointment/status, body AppointmentStatusUpdateDto → success/failure, message only
- GET /api/appointment/free-slots?doctorId={id}&date={date} → TimeSlotDto[]
- GET /api/appointment/patient/{patientId}/history → AppointmentResponseDto[]

## DTOs

AppointmentListResponseDto: { id: number, doctorId: number, doctorName: string | null, patientId: number, patientName: string | null, dateTime: string, duration: string, status: "Pending" | "Missed" | "Completed" | "Cancelled", notes: string | null, procedures: AppointmentProcedureResponseDto[], treatment: TreatmentResponseDto | null, totalCost: number, discount: number }

AppointmentResponseDto: { id: number, dateTime: string, duration: string, status: "Pending" | "Missed" | "Completed" | "Cancelled", notes: string | null, doctor: DoctorResponseDto | null, patient: PatientResponseDto | null, procedures: AppointmentProcedureResponseDto[], treatment: TreatmentResponseDto | null, totalCost: number, discount: number }

AppointmentCreateRequestDto: { patientId: number, doctorId: number, dateTime: string, duration: string, notes?: string }
AppointmentCreateResponseDto: { id: number, dateTime: string, duration: string, status: string, notes: string | null, doctor: DoctorResponseDto | null, patient: PatientResponseDto | null }

AppointmentUpdateRequestDto: { id: number, patientId: number, doctorId: number, dateTime: string, duration: string, notes?: string }
AppointmentUpdateResponseDto: { id: number, dateTime: string, duration: string, status: string, notes: string | null, doctor: DoctorResponseDto | null, patient: PatientResponseDto | null, procedures: AppointmentProcedureResponseDto[] }

AppointmentStatusUpdateDto: { id: number, status: "Completed" | "Cancelled" }

FreeSlotsRequestDto (query params): { doctorId: number, date: string }
TimeSlotDto: { start: string, end: string }

PatientResponseDto (nested on AppointmentResponseDto.patient): { id: number, name: string | null, lastName: string | null, email: string | null, phone: string | null, dateOfBirth: string }

AppointmentProcedureResponseDto: { appointmentId: number, procedureId: number, procedureName: string, procedurePrice: number }

TreatmentResponseDto: { id: number, appointmentId: number, description: string, medication: string | null, createdAt: string }

Note: `duration` (TimeSpan) serializes as a string like "01:00:00" —
confirm exact format via Swagger before parsing on the frontend.

Note: `status` serializes as a string (confirmed pattern from Doctor
Schedule).

## Frontend implementation notes

These were never explicitly confirmed against Swagger — documented so
a future rebuild doesn't have to rediscover them by trial and error:

- The frontend sends `dateTime` on create/update as a local,
  timezone-less string (`YYYY-MM-DDTHH:mm:ss`, no `Z`/offset suffix) —
  not `Date.toISOString()` — so the wall-clock time the user picked
  isn't shifted by timezone conversion. If the backend actually expects
  UTC or an offset, appointment times booked from a non-UTC client will
  be off by the local offset.
- `TimeSlotDto.start`/`.end` format was never pinned down (could be a
  bare time-of-day like `"09:00:00"` or a full ISO datetime). The
  frontend parses defensively: if the string contains `T` it's treated
  as a full datetime, otherwise it's combined with the query date as
  `${date}T${time}`.
- The free-slots endpoint appears to throw a business-rule error (e.g.
  409, message like "Doctor does not work on Wednesday") rather than
  returning `200` with an empty array when the doctor has no schedule
  for that day. The frontend treats both cases as "no slots available"
  in the UI, but surfaces the thrown error message specifically if one
  comes back.
- Error responses on this service are not guaranteed to have a JSON
  body (a 409 from free-slots and a 405 from a routing mismatch have
  both come back with an empty body in practice). `throwApiError` in
  `src/api/apiErrors.ts` must not assume every non-2xx response is
  parseable JSON — this is a cross-cutting fix, not appointment-only,
  and api-conventions.md's shared-code template has been updated to
  match.
- The list endpoint (`GET /api/appointment`) has no procedure filter
  query param, even though `AppointmentListResponseDto.procedures` is
  returned per-appointment. A "filter by procedure" UI has to fetch
  the full (already doctorId/patientId-filtered) week and filter
  client-side by checking each appointment's `procedures` array — it
  cannot be pushed down to the backend.
- The `doctorId` filter on the list endpoint is documented as a single
  value; multi-doctor filtering in the UI is done by fetching
  unfiltered and filtering client-side rather than assuming the
  backend accepts repeated `doctorId` params.
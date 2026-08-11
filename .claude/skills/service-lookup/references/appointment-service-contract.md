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
- DELETE /api/appointment?id={id} → success/failure only
    - Unlike other services, `id` is a query parameter here, not a route
      segment — the `[HttpDelete]` action has no `{id}` route template,
      so `DELETE /api/appointment/{id}` 405s (its path shape collides
      with the `GET /api/appointment/{id}` route but isn't registered
      for DELETE)
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
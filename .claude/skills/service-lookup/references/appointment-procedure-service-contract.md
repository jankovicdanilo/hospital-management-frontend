# Appointment Procedure Service

## Endpoints

- POST /api/appointmentprocedure, body AppointmentProcedureCreateRequestDto → AppointmentProcedureCreateResponseDto
- GET /api/appointmentprocedure?appointmentId={id}&procedureId={id} → AppointmentProcedureResponseDto
- DELETE /api/appointmentprocedure?appointmentId={id}&procedureId={id} → success/failure only

Note: confirm GET/DELETE's parameter binding (query string vs. route)
via Swagger before relying on this — no [FromQuery]/[FromRoute]
attribute is present in the controller, so this is ASP.NET Core's
implicit default for GET/DELETE with no route template, not something
explicitly verified.

## DTOs

AppointmentProcedureCreateRequestDto: { appointmentId: number, procedureId: number }
AppointmentProcedureCreateResponseDto: { appointmentId: number, procedureId: number, procedureName: string, procedurePrice: number }
AppointmentProcedureResponseDto: { appointmentId: number, procedureId: number, procedureName: string, procedurePrice: number }

## Business rules (for context, not directly enforced by frontend on this pass)

- Attaching a procedure requires the appointment to be in Pending
  status
- A procedure can't be attached twice to the same appointment
  (duplicate attach fails)
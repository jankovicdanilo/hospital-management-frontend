# Doctor Schedule Service

## Endpoints

QueryService:
- GET /api/doctorschedule/{id} → DoctorScheduleResponseDto
- GET /api/doctorschedule/doctor/{doctorId} → DoctorScheduleResponseDto[] (all schedules for a doctor)
- GET /api/doctorschedule/doctor/{doctorId}/day/{dayOfWeek} → DoctorScheduleResponseDto

CommandService:
- POST /api/doctorschedule, body DoctorScheduleCreateRequestDto → DoctorScheduleCreateResponseDto
- PUT /api/doctorschedule, body DoctorScheduleUpdateRequestDto → DoctorScheduleUpdateResponseDto
- DELETE /api/doctorschedule/{id} → success/failure only

## DTOs

DoctorScheduleResponseDto: { id: number, doctorId: number, dayOfWeek: DayOfWeek, startHour: number, endHour: number }
DoctorScheduleCreateRequestDto: { doctorId: number, dayOfWeek: DayOfWeek, startHour: number, endHour: number }
DoctorScheduleCreateResponseDto: { id: number, doctorId: number, dayOfWeek: DayOfWeek, startHour: number, endHour: number }
DoctorScheduleUpdateRequestDto: { id: number, dayOfWeek: DayOfWeek, startHour: number, endHour: number }
DoctorScheduleUpdateResponseDto: { id: number, doctorId: number, dayOfWeek: DayOfWeek, startHour: number, endHour: number }

Note: `dayOfWeek` serializes as a string (e.g. "Monday").

## Business rules (for context, not directly enforced by frontend)

- A doctor can only have one schedule per day of week (duplicate
  create/update fails with DUPLICATE_SCHEDULE, Conflict)
- Schedules cannot be created for Saturday or Sunday (validation error)
- startHour must be 8–19, endHour must be 9–20, and endHour > startHour
  (validation errors)
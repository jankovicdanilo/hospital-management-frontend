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

Note: `dayOfWeek`, `startHour` and `endHour` are UTC. See time-handling.md for how they map to the clinic's local time.

## Business rules (for context, not directly enforced by frontend)

- A doctor can only have one schedule per day of week (duplicate
  create/update fails with DUPLICATE_SCHEDULE, Conflict)
- Schedules cannot be created for Saturday or Sunday (validation error)
- startHour must be 0–23, endHour must be 1–24, and endHour > startHour
  (validation errors); 24 means the end of the UTC day
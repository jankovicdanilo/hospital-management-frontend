## Feature: UTC-only backend

I want the frontend to work with the backend's UTC-only time handling. Use the appointment-service, doctor-schedule-service and statistics-service backends.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)
- [Time handling](.claude/architecture/instructions/time-handling.md)

- Appointments, schedules, free slots and the create/edit page work against the UTC API and show and accept clinic-local times
- The doctor schedule editor works in clinic-local hours, with no UTC wording
- Statistics From and To are UTC days, labelled as UTC
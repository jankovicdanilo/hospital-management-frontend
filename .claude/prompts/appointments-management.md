## Feature: Appointment Management Interface

I want to create an appointments calendar/list page. Use
appointment-service, doctor-service, and patient-service backends for
fetching and updating data.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)

- Main view: a true time-grid week view (Monday–Friday), similar to
  Outlook/Google Calendar — hours listed down the left side, each
  appointment rendered as a block positioned and sized according to
  its actual start time and duration. Overlapping appointments for the
  same time slot render side by side within their column, not stacked
  on top of each other. Fetch the whole visible week in one call using
  the startDate/endDate range filter. Navigate to previous/next week.
- Each appointment block shows the time, doctor name, and patient name
- A status dropdown per appointment: only Pending appointments can be
  changed, to Completed or Cancelled. Missed is never offered as an
  option — it's set automatically by a backend background service, not
  by direct user action. Calling PATCH /api/appointment/status on
  change.
- A "View" action per appointment opens a detail page (/appointments/:id)
  showing full info: doctor, patient, date/time, duration, notes,
  status, and read-only sections for procedures performed and
  treatment (if any) — no editing of procedures/treatment on this pass
- "New Appointment" action opens a create page:
    1. Pick a doctor (from existing doctors)
    2. Pick a date
    3. Free time slots for that doctor/date load automatically
       (GET /api/appointment/free-slots) — the doctor must have a
       schedule for that day of week, or no slots will be available
    4. Pick a patient
    5. Pick a slot
    6. Optional notes
    7. Submit
- Edit works the same as create, pre-filled with the appointment's
  current data — only available for Pending appointments
- Delete requires a confirm step before the actual delete call
- Client-side validation on create/edit: doctor, patient, date, and
  slot are required; date/time must be in the future; duration must be
  greater than 0 and no more than 8 hours; notes limited to 500
  characters
- A loading state while fetching the week's appointments, free slots,
  or submitting
- On failure, display the backend's error details to the user — for
  field-level validation errors, show each message next to its
  matching field; for other failures, show the message generically
- On success (create/edit/delete/status change), refresh the current
  week's view

## Styling

- Match the existing app's visual language: rounded cards, the
  established button hierarchy (solid blue for primary actions,
  outline for secondary, red outline for destructive), consistent
  spacing
- Time-grid week view: 5 day columns, hour labels down the left,
  appointment blocks colored by status — a distinct color per status
  (Pending, Completed, Cancelled, Missed), with a small legend showing
  what each color means
- Keep the week navigation controls simple and consistent with the
  pagination controls already used elsewhere (bordered buttons,
  disabled state at boundaries)
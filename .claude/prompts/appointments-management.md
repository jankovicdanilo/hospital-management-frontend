## Feature: Appointment Management Interface

I want to create an appointments calendar/list page. Use
appointment-service, doctor-service, and patient-service backends for
fetching and updating data.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)

- Main view: a true time-grid week view (Monday–Friday), similar to
  Outlook/Google Calendar — hours listed down the left side, each
  appointment rendered as a block positioned and sized according to
  its actual start time and duration, at full column width (one
  appointment per time slot renders as a normal detailed block — no
  side-by-side columns). Give every block a minimum height regardless
  of duration, so a short (e.g. 15–30 min) appointment still has room
  to show all its content without content getting clipped or hidden;
  this also means two back-to-back appointments can be close enough
  that a min-height block would visually collide with the next one —
  treat that case the same as a real time overlap (see below) rather
  than letting them overlap visually.
  Whenever more than one appointment shares the same time slot (or is
  close enough to visually collide per the above), don't render them
  side by side at all — collapse them into a single summary card
  showing the count (e.g. "3 appointments") and the time range they
  span. Clicking that card opens a small list/modal showing every
  bundled appointment in full (time range, doctor, patient, status
  control, click to view).
  Fetch the whole visible week in one call using the startDate/endDate
  range filter. Navigate to previous/next week.
- Add filter controls above the grid:
    - "Doctor" — multi-select (a checklist dropdown, not a plain
      `<select>`), defaulting to all doctors. When exactly one doctor
      is selected, pass that doctorId to the backend as a filter on
      the week fetch (reduces payload and avoids the pagination cap
      truncating results on a busy week); with zero or multiple
      doctors selected, fetch unfiltered and filter client-side —
      don't assume the backend's doctorId filter accepts multiple
      values.
    - "Patient" — single-select, passed to the backend as a filter on
      the week fetch (the list endpoint supports patientId directly).
    - "Procedure" — single-select. The appointment list endpoint has
      no procedure filter param, so this filters client-side against
      each already-fetched appointment's `procedures` array. Note
      procedures are typically only attached to Completed appointments
      ("procedures performed"), so this filter will mostly surface
      completed ones.
  All active filters combine (AND, not OR).
- Each appointment block shows the time range (start–end, not just
  the start time), the doctor name, and the patient name — give
  doctor and patient a distinguishing visual treatment (e.g. a
  different icon each) so it's never ambiguous which name is which.
  The whole block is clickable and opens the detail page
  (/appointments/:id) — do not rely on a small separate "View" link
  as the only way in, since it's easy for that to get squeezed out by
  clipping and become unclickable. The status dropdown inside the
  block must stop click propagation so interacting with it doesn't
  also trigger navigation.
- A status dropdown per appointment: only Pending appointments can be
  changed, to Completed or Cancelled. Missed is never offered as an
  option — it's set automatically by a backend background service, not
  by direct user action. Calling PATCH /api/appointment/status on
  change.
- Clicking an appointment block (or an entry inside the grouped-count
  list/modal) opens a detail page (/appointments/:id) showing full
  info: doctor, patient, date/time, duration, notes, status, and
  read-only sections for procedures performed and treatment (if any)
  — no editing of procedures/treatment on this pass.
- "New Appointment" action opens a create page:
    1. Pick a doctor (from existing doctors)
    2. Pick a date, via a custom date picker component — not the
       native `<input type="date">`, which cannot disable specific
       weekdays. As soon as a doctor is picked, fetch their weekly
       schedule (GET /api/doctorschedule/doctor/{doctorId}) and:
        - disable weekdays the doctor doesn't work, and disable past
          dates, directly in the picker
        - show a small hint below the field, e.g. "Works: Monday,
          Wednesday, Friday" (or "No weekly schedule on file for this
          doctor" if empty)
        - display the picked date together with its weekday name (e.g.
          "Wednesday, Aug 12, 2026") so it's easy to spot what day of
          the week is selected
    3. Free time slots for that doctor/date load automatically
       (GET /api/appointment/free-slots) once both doctor and date are
       picked — the doctor must have a schedule for that day of week,
       or no slots will be available. Picking one of these sets the
       appointment's start time.
    4. Pick a patient
    5. Pick a slot (start time)
    6. Duration is a separate, user-editable field — hours and minutes
       inputs — defaulting to the picked slot's own length but freely
       adjustable to any value (e.g. "1 hour", "46 minutes"); it is
       not locked to the free-slot grid's fixed granularity. Show a
       live "Ends at HH:mm" preview as the user adjusts it.
    7. Optional notes
    8. Submit
- Edit works the same as create, pre-filled with the appointment's
  current data (including duration split into hours/minutes) — only
  available for Pending appointments. If the free-slots lookup for the
  doctor/date already booked to this appointment fails, or the
  response doesn't include this appointment's own slot, keep that
  original slot selectable anyway so the user can still save without
  being forced to change the time.
- Delete requires a confirm step before the actual delete call
- Client-side validation on create/edit:
    - doctor, patient, date, and slot are required
    - date/time must be in the future
    - duration must be greater than 0 and no more than 8 hours
    - duration must not push the appointment past the doctor's
      scheduled end hour for that day of the week (check against the
      doctor's weekly schedule for the selected date)
    - duration must not overlap another already-booked appointment for
      that doctor — check the full [start, start+duration] window
      against the free-slots data (merge the returned slots into
      contiguous free ranges and confirm the window fits entirely
      inside one of them)
    - notes limited to 500 characters
- A loading state while fetching the week's appointments, free slots,
  the doctor's weekly schedule, or while submitting.
- On failure, display the backend's error details to the user — for
  field-level validation errors, show each message next to its
  matching field; for other failures, show the message generically.
  Errors from the free-slots lookup specifically must be scoped to
  that section of the form (not a page-wide banner) and must clear
  automatically whenever the doctor or date changes — never leave a
  stale error on screen after the user has corrected the selection
  that caused it.
- On success (create/edit/delete/status change), refresh the current
  week's view.

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

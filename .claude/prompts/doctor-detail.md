## Feature: Doctor Detail Page

I want to create a doctor detail page. Use doctor-service and
doctor-schedule-service backends for fetching and updating data.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)

- Add a "View" button to each row in the Doctors table (alongside Edit
  and Delete), linking to /doctors/:id
- The detail page shows the doctor's basic info (first name, last name,
  specialization, email, phone) at the top
- Below that, a weekly schedule section: one row per weekday
  (Monday–Friday, no weekend rows), each showing either the scheduled
  hours (e.g. "9:00–17:00") or "Not scheduled"
- Each day row has an action to add a schedule (if not scheduled) or
  edit/remove it (if already scheduled) with inline editing
- Client-side validation on the schedule form: start hour 8–19, end
  hour 9–20, end hour must be after start hour
- On failure, display the backend's error details to the user — for
  field-level validation errors, show each message next to its
  matching field; for other failures, show the message generically
  (e.g. a doctor already having a schedule for that day)
- A loading state while fetching the doctor's info and schedule

## Styling

- A profile header card at the top: the doctor's avatar-initials circle
  (same style as the Doctors table — light blue background, blue
  initials) at a larger size, next to their name and specialization
  badge, in a rounded card matching the existing card style
- Basic info (email, phone) shown below the header, in the same
  muted-label / value layout used elsewhere in the app
- The weekly schedule as a stacked list of day rows in a card, each row
  showing the day name, then either the hours as plain text or a
  "Not scheduled" state in muted gray text, with the add/edit/remove
  action aligned to the right — visually consistent with row actions in
  the Doctors/Patients tables (bordered outline buttons)
- Keep spacing and rounded-corner conventions consistent with the rest
  of the app rather than introducing a new visual style for this page
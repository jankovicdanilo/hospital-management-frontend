## Feature: Patient Detail Page

Use patient-service and appointment-service backends for fetching data.

Before starting, read:
- [List/table conventions](.claude/prompts/list-table.md)
- [API conventions](.claude/architecture/instructions/api-conventions.md)

- Add a "History" button to each row in the Patients table (alongside
  Edit and Delete), linking to /patients/:id/history
- The page shows the patient's basic info at the top (name, last name,
  email, phone, date of birth), following the same header-card
  pattern used on the Doctor detail page (without an avatar/badge,
  since Patient has neither a photo nor a specialization)
- Below that, an "Appointment History" section: a paginated table
  (using the shared DataTable component) of every appointment for
  this patient, fetched from GET /api/appointment?patientId={id}
  (paginated via pageNumber/pageSize). Note: there's also a dedicated
  GET /api/appointment/patient/{patientId}/history endpoint documented
  in appointment-service-contract.md, but it returns a plain
  AppointmentResponseDto[] with no pageNumber/pageSize support — since
  this page needs a paginated table, use the general list endpoint
  with the patientId filter instead, not the dedicated history one.
- Table columns: date/time, doctor name, status, total cost — sorted
  most recent first
- A "Status" multi-select filter above the table (same
  MultiSelectDropdown pattern used on the Appointments page),
  filtering client-side against the already-fetched page's results
  the same way status filtering works there
- Each row is clickable and navigates to the existing appointment
  detail page (/appointments/:id) to see full details
- A loading state while fetching the patient's info and their
  appointment history
- On failure, display the backend's error details to the user
- Structure the page so additional sections could be added later
  without a rewrite, same principle as the Doctor detail page — a
  simple stacked-sections layout, not a rigid layout tied to exactly
  these two pieces of content

## Styling

- A profile header card at the top: patient's name, email, and phone
  in the same muted-label/value layout used on the Doctor detail page
  and elsewhere in the app
- The appointment history table uses the same card, spacing, and
  pagination-control conventions as the shared DataTable component
  everywhere else in the app
- Keep visual language consistent with the rest of the app rather than
  introducing a new style for this page
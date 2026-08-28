## Feature: Invoice Download

Use invoice-service backend for fetching data.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)

- On the appointment detail page (/appointments/:id), add a
  "Download Invoice" action, visible only when the appointment's
  status is Completed
- A small format choice next to the action (PDF / DOCX), defaulting
  to PDF
- Clicking triggers GET /api/billing/{appointmentId}?format={format},
  reads the response as a blob (this endpoint returns a raw file, not
  the usual JSON envelope), and triggers a browser download using the
  same "{PatientName}_{InvoiceNumber}.{extension}" naming pattern the
  backend uses internally — since the response may not set an explicit
  Content-Disposition filename, construct the filename on the frontend
  from the appointment's already-known patient name if needed, falling
  back to a generic name like "invoice.pdf" if that's not cleanly
  available.
- A loading state on the button while the download is in progress
  (file generation may take a moment)
- On failure, display the backend's error details to the user — same
  two-shape convention as everywhere else (this endpoint can fail with
  the standard JSON error shape even though success returns a binary
  file)
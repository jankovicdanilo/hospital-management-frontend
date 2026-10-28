# Invoice Service

Served from its own dedicated base URL —
`VITE_INVOICE_SERVICE_URL`.

## Endpoints

- GET /api/billing/{appointmentId}?format=pdf|docx&language=en|me&utcOffsetMinutes={n} → raw file
  (binary), not JSON — download response, not a Result<T> envelope.
  `utcOffsetMinutes` is optional (integer, -840 to 840, default 0): the
  clinic's UTC offset in minutes on the appointment's own date (for
  example 120 in June and 60 in December for Europe/Podgorica). The
  document prints the appointment time shifted by it and labelled with
  it (e.g. `22/06/2026 13:00 UTC+02:00`, or `... UTC` for 0). The
  invoice's issue date is a UTC day and is not shifted. See
  time-handling.md.
  Response Content-Type is either "application/pdf" or
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  depending on format. The backend sets `Content-Disposition: attachment`
  with the filename `{PatientName}_{InvoiceNumber}.{pdf|docx}`. A browser
  app can only read that header from a cross-origin response if CORS
  exposes it, so the frontend keeps its own filename fallback.
- Failure (e.g. appointment not found, or appointment has no
  doctor/patient data attached) returns the normal JSON error shape,
  not a file — { message, errorCode }, per api-conventions.md. An
  out-of-range `utcOffsetMinutes` returns 400 `INVALID_UTC_OFFSET`.
# Invoice Service

Served from its own dedicated base URL —
`VITE_INVOICE_SERVICE_URL`.

## Endpoints

- GET /api/billing/{appointmentId}?format=pdf|docx → raw file
  (binary), not JSON — download response, not a Result<T> envelope.
  Response Content-Type is either "application/pdf" or
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  depending on format. Suggested filename comes from the
  Content-Disposition-style naming pattern
  "{PatientName}_{InvoiceNumber}.{pdf|docx}", though this isn't set as
  an explicit Content-Disposition header in the current backend code —
  confirm via Swagger/network inspection whether the browser needs the
  filename supplied manually on the frontend side instead.
- Failure (e.g. appointment not found, or appointment has no
  doctor/patient data attached) returns the normal JSON error shape,
  not a file — { message, errorCode }, per api-conventions.md.
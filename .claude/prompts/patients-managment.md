## Feature: Patient Management Interface

- A table listing all patients (name, last name, email, phone, date of birth),
  using the shared DataTable component with pagination
- Edit and Delete buttons on each row
- Delete requires a confirm step before the actual delete call
- An "Add Patient" action, opening a separate create page
- Edit opens a separate page pre-filled with the patient's current data
- Client-side validation on create/edit forms requiring name, last name,
  email, and date of birth; phone is optional
- A loading state while list/create/edit/delete requests are in flight
- On failure, display the backend's error details to the user — for
  field-level validation errors, show each message next to its
  matching form field; for other failures, show the message generically
- On success (create/edit/delete), return to the patient table, refreshed
- Basic routing between the table and the create/edit pages
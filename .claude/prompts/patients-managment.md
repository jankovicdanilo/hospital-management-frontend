## Feature: Patient Management Interface

I want to create a page with patients table. Use patient-service backend for fetching and updating data.

Before starting, read:
- [List/table conventions](.claude/prompts/list-table.md)
- [API conventions](.claude/architecture/instructions/api-conventions.md)

- A table listing all patients (name, last name, email, phone, date of birth),
  using the shared DataTable component with pagination
- A search box above the table (300ms debounce, minimum 3 characters
  before searching), filtering server-side via GET /api/patient's
  search query param (matches name or last name)
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

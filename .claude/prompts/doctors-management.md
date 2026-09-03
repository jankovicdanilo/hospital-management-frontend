## Feature: Doctor Management Interface

I want to create a page with doctors table. Use doctor-service backend for fetching and updating data.

Before starting, read:
- [List/table conventions](.claude/prompts/list-table.md)
- [API conventions](.claude/architecture/instructions/api-conventions.md)

- A table listing all doctors (first name, last name, specialization, email, phone),
  using the shared DataTable component with pagination
- A search box above the table, filtering server-side via GET /api/doctor's
  search query param (matches first or last name)
- Edit and Delete buttons on each row
- Delete requires a confirm step before the actual delete call
- An "Add Doctor" action, opening a separate create page
- Edit opens a separate page pre-filled with the doctor's current data
- Client-side validation on create/edit forms requiring first name, last
  name, specialization, and email; phone is optional
- A loading state while list/create/edit/delete requests are in flight
- On failure, display the backend's error details to the user — for
  field-level validation errors, show each message next to its
  matching form field; for other failures, show the message generically
- On success (create/edit/delete), return to the doctor table, refreshed
- Basic routing between the table and the create/edit pages

## Feature: Procedure Management Interface

I want to create a page with procedures table. Use procedure-service backend for fetching and updating data.

Before starting, read:
- [List/table conventions](.claude/prompts/list-table.md)
- [API conventions](.claude/prompts/api-conventions.md)

- A table listing all procedures (name, price formatted as currency,
  e.g. "€45.00"), using the shared DataTable component with pagination
- Edit and Delete buttons on each row
- Delete requires a confirm step before the actual delete call
- An "Add Procedure" action, opening a separate create page
- Edit opens a separate page pre-filled with the procedure's current data
- Price input on create/edit forms is a plain number field (no currency
  formatting while typing — formatting only applies on the table display)
- Client-side validation on create/edit forms requiring name and price
  (price must be greater than 0)
- A loading state while list/create/edit/delete requests are in flight
- On failure, display the backend's error details to the user — for
  field-level validation errors, show each message next to its
  matching form field; for other failures, show the message generically
- On success (create/edit/delete), return to the procedure table, refreshed
- Basic routing between the table and the create/edit pages
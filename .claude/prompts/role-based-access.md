## Feature: Role-based access

I want each role (Admin, Manager, Doctor) to see and do only what it is allowed to.

Before starting, read:

- [API conventions](.claude/architecture/instructions/api-conventions.md)
- [Roles and permissions](.claude/architecture/instructions/roles-and-permissions.md)

- The menu, routes and action buttons follow the permission table for the logged-in role
- Opening a page the role cannot use shows a clear "no permission" page and makes no API calls
- A doctor sees only his own appointments; when booking, he is the doctor and the free slots are his
- A doctor opens a patient's history and summary only for his own patients
- Every 403 shows the message from the response and keeps the user logged in; a 401 still sends them to login
- A doctor account without a linked doctor record gets a clear message instead of an empty or broken app
- Statistics and invoices stay available to Admin and Manager only
- When a patient's appointment history is refused or fails to load, only the error message is shown, 
  not the empty-state text; the patient's details still show
## Feature: User management

I want admins to manage user accounts from the app: see all users, create, edit and delete them, and link a Doctor
account to a doctor. Use the auth-service and doctor-service backends.

Before starting, read:

- [API conventions](.claude/architecture/instructions/api-conventions.md)
- [Roles and permissions](.claude/architecture/instructions/roles-and-permissions.md)
- [Auth service contract](.claude/skills/service-lookup/references/auth-service-contract.md)

- Only Admin sees the Users entry in the menu and can open its pages; other roles get the same "no permission" behavior
  as elsewhere
- A searchable list of all users with username, email and role; the active flag and the linked doctor are not shown in
  the list
- Creating and editing a user follows the role rules: a Doctor must be linked to an existing doctor chosen from the
  doctor list, and the other roles cannot be linked
- When linking a Doctor account, the doctor choice lists all doctors that do not have an account yet, not a most-booked
  list; the doctor already linked to the account being edited stays selectable, and a message says so when every doctor
  already has an account
- Renaming a user to a taken username or email, deleting your own account, and changing your own role all show the
  backend's message instead of failing silently
- Field errors from the backend, including a taken username or email, show next to the right field
- Deleting a user asks for confirmation
- The logged-in admin cannot delete his own account or change its role
- When a role or doctor link changes, the admin is told it applies after that user's next login
- English and Montenegrin texts, in the same style as the other pages
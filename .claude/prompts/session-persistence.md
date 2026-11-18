## Feature: Keep the session after a page reload

I want users to stay logged in when they reload the page, so a reload does not trigger a new login.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)
- [Roles and permissions](.claude/architecture/instructions/roles-and-permissions.md)
- [Auth service contract](.claude/skills/service-lookup/references/auth-service-contract.md)

- After a reload, the user is still logged in with the same role and doctor link, without entering the password again
- The session ends on logout, when the token expires or is rejected with a 401, and when the browser tab is closed
- A stored session that is stale or has been tampered with is discarded, and the user sees the login page
- Role-based routes and the menu behave exactly as after a normal login
- Documentation that says a reload logs the user out is updated
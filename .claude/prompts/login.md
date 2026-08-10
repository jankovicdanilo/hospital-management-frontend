## Feature: Login Interface

I want to create login page. Use auth-service backend for fetching and updating data.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)

- A login form with username and password inputs
- Client-side validation requiring both fields, with visible feedback
  if submitted empty
- A loading state while the request is in flight
- On failure, display the backend's error details to the user — for
  field-level validation errors, show each message next to its
  matching form field; for other failures, show the message generically
- On success, redirect to a /dashboard route. This route should be a
  bare placeholder for now (e.g. plain text like "Dashboard — coming
  soon")
- If an already-logged-in user reaches the login page, send them to
  the dashboard instead
- Basic routing between the login and dashboard areas
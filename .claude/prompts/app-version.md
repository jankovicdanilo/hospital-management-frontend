## Feature: Show the app version

I want the footer to show which version of the app is running, so a deploy can be confirmed at a glance. Use the auth-service backend.

Before starting, read:
- [API conventions](.claude/architecture/instructions/api-conventions.md)
- [Auth service contract](.claude/skills/service-lookup/references/auth-service-contract.md) (the GET /version section)

- The footer shows the version and build next to the copyright text, for example "v1.0.14 (5c5b9ac)"
- The version is requested once when the app starts, and needs no login
- If it cannot be loaded, the footer shows nothing extra and the app keeps working
- A numeric version is shown as "v1.0.14 (5c5b9ac)", and anything else, such as "dev", is shown as it is: "dev (local)"
- The version also shows on the login page, so it can be seen without logging in
- The version is requested once and shared by both places
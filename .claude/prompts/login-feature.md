# Prompt: Login Feature (React + TS + Tailwind, .NET backend)

What this produces: a login page wired to a .NET auth microservice —
form, in-memory auth state, routing, dashboard placeholder. 
Assumes project-wide conventions (style, scope  discipline, tooling rules) are already defined in CLAUDE.md.

---

Build a login feature for this React + TypeScript + Tailwind v4 app.

Backend contract (do not deviate from this):
- POST /api/auth/login
- Request body: { username: string, password: string }
- Success (200): { username: string, email: string, role: string, token: string }
- Failure (401): { message: string, errorCode: string }
- Base URL for the auth service should come from an environment
  variable, not be hardcoded. Create .env with a placeholder value
  (e.g. VITE_AUTH_SERVICE_URL=http://localhost:0000) — the developer
  running this will set it to their own local Auth service port.

Behavioral requirements:
- A login form with username and password inputs
- Client-side validation requiring both fields, with visible feedback if submitted empty
- A loading state while the request is in flight
- On failure, display the backend's error message to the user
- On success, redirect to a /dashboard route. This route should be a bare placeholder for now (e.g. plain text like "Dashboard — coming soon")
- If an already-logged-in user reaches the login page, send them to the dashboard instead
- Authentication state must exist only in memory for this session — never persisted to localStorage, sessionStorage, or cookies
- Basic routing between the login and dashboard areas
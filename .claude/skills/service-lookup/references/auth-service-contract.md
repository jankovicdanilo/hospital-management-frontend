# Auth Service

Authentication and user accounts. Endpoints marked Admin only answer 403 with errorCode FORBIDDEN to other roles, and
401 when the user is not logged in (see api-conventions).

### Roles and the doctor link

Roles are Admin, Manager and Doctor. Receptionist was renamed to Manager.

doctorId (nullable integer) links a Doctor account to a doctor record. Login, the user list and the current-user
endpoint return it, and register and update accept it.

Rules:

- doctorId is required and greater than 0 for Doctor, and must be null for the other roles. The field errors are "
  DoctorId is required for the Doctor role", "DoctorId must be greater than 0" and "DoctorId is only allowed for the
  Doctor role".
- A doctor can be linked to at most one account. Register and update refuse a doctorId that another user already has (
  409 DOCTOR_ALREADY_LINKED).
- Auth does not check that the doctor exists, so the app must offer only existing doctors.
- Usernames and emails are unique, on register and on update.
- A role or doctor change applies to that user after the next login, because the role is stored in the token.

### POST /api/auth/login

Request body:
{ username: string, password: string }

Success (200):
{ username: string, email: string, role: string, doctorId: number | null, token: string }

Failure (400): field validation errors (username and password are required)
Failure (401): { message: string, errorCode: "INVALID_CREDENTIALS" }

### GET /api/auth (Admin only)

Success (200): array, one item per user:
{ id: number, username: string, email: string, role: string, doctorId: number | null, createdAt: string (UTC), isActive:
boolean }
isActive is not enforced by login and must not be shown in the UI.
Only doctorId is returned for a Doctor account, so the doctor's name comes from the doctor list.

### POST /api/auth/register (Admin only)

Request body:
{ username: string, email: string, password: string, role: string, doctorId?: number | null }

Success (200):
{ username: string, email: string, role: string, doctorId: number | null, token: string }
The token belongs to the new user. The app must ignore it and keep the admin's session.

Failure (400): field validation errors (see api-conventions). Username 3 to 50 characters, a valid email, a password of
at least 6 characters with an uppercase letter, a digit and a special character, a valid role, and the doctorId rules
above.
Failure (409): { message: string, errorCode: "USERNAME_TAKEN" | "EMAIL_TAKEN" | "DOCTOR_ALREADY_LINKED" }

### PUT /api/auth (Admin only)

Request body:
{ id: number, username: string, email: string, role: string, doctorId?: number | null }
There is no password field. A password cannot be changed.

Success (200): the updated user. The app reloads the list afterwards and does not rely on the fields of this response.

Failure (400): field validation errors (see api-conventions). Username 3 to 50 characters, a valid email, a valid role,
and the doctorId rules above.
Failure (404): { message: string, errorCode: "USER_NOT_FOUND" }
Failure (409): { message: string, errorCode: "USERNAME_TAKEN" | "EMAIL_TAKEN" | "DOCTOR_ALREADY_LINKED" | "
CANNOT_CHANGE_OWN_ROLE" }
CANNOT_CHANGE_OWN_ROLE applies when the logged-in admin changes the role of his own account.

### DELETE /api/auth/{id} (Admin only)

Success (200): { message: string }

Failure (404): { message: string, errorCode: "USER_NOT_FOUND" }
Failure (409): { message: string, errorCode: "CANNOT_DELETE_SELF" }
CANNOT_DELETE_SELF applies when the logged-in admin deletes his own account.

### GET /api/auth/me (any logged-in user)

Success (200): { id: number, username: string, email: string, role: string, doctorId: number | null, createdAt: string (
UTC) }

Failure (404): { message: string, errorCode: "USER_NOT_FOUND" }
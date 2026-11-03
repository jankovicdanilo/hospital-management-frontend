# Auth Service

### POST /api/auth/login

Request body:
{ username: string, password: string }

Success (200):
{ username: string, email: string, role: string, doctorId: number | null, token: string }

Failure (401):
{ message: string, errorCode: string }

Roles are Admin, Manager, Doctor. Receptionist was renamed to Manager. The migration AddManagerRoleAndDoctorLink updates
existing rows.
doctorId (nullable integer) was added to the user, to the register and update requests, and to the login, user list,
update and current-user responses.
Validation: doctorId required and greater than 0 for Doctor, must be null for the other roles.
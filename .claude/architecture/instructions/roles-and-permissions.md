# Roles and permissions

The backend enforces every rule below. The frontend only hides what a role cannot use and explains refusals. Never rely
on hiding for security.

## Roles

| Role      | Purpose                                                               |
|-----------|-----------------------------------------------------------------------|
| `Admin`   | Everything, including user accounts                                   |
| `Manager` | Staff, patients, procedures, statistics and invoices. No appointments |
| `Doctor`  | His own appointments and patients, plus patient management            |

A user has exactly one role. `Mcp` is a service role for the MCP server and is never a frontend user.

## The current user

The login response returns `role` and `doctorId`, and the app keeps them with the logged-in user. It does not call
`GET /api/auth/me`, which exists on the backend and returns the same fields.

- `role` is one of `Admin`, `Manager`, `Doctor`.
- `doctorId` is a number for `Doctor` accounts and `null` for everyone else. It links the login to a doctor record.
- A role change applies after the user logs in again, because the role is stored in the token.

## Permissions

| Area                                                     | Admin | Manager | Doctor                |
|----------------------------------------------------------|-------|---------|-----------------------|
| View doctors, schedules, patients, procedures            | yes   | yes     | yes                   |
| Manage patients (create, edit, delete)                   | yes   | yes     | yes                   |
| Manage doctors, schedules, procedures                    | yes   | yes     | no                    |
| Appointments: list, detail, create, edit, delete, status | yes   | no      | own only              |
| Appointment procedures and treatment                     | yes   | no      | own appointments only |
| Free slots                                               | yes   | no      | himself only          |
| Patient history and AI summary                           | yes   | no      | own patients only     |
| Statistics                                               | yes   | yes     | no                    |
| Invoices (download)                                      | yes   | yes     | no                    |
| User accounts and service tokens                         | yes   | no      | no                    |

## What "own" means for a doctor

- An appointment is his own when its doctor is the logged-in doctor (`doctorId`).
- A patient is his own when he has at least one appointment with that patient, in any status.
- He can still find and create any patient, so he can book a first visit.
- The appointment list always contains only his appointments, whatever filter the client sends.
- He can create or edit an appointment only with himself as the doctor, and ask for free slots only for himself. The
  doctor choice is therefore fixed to him.
- Asking for the appointments of a patient who is not his is refused with `NOT_YOUR_PATIENT`. 
  The history page therefore shows the error and no empty list.

## Errors

Both error statuses use the same body: `{ "errorCode": "...", "message": "..." }`. Always show the `message` from the
response.

| Status | Meaning                                 | Frontend behavior                         |
|--------|-----------------------------------------|-------------------------------------------|
| 401    | Not logged in, token expired or revoked | Send to login, as before                  |
| 403    | Logged in, but not allowed              | Show the message, keep the user logged in |

The `errorCode` of a 403 tells the cause:

| Code                   | Meaning                                                           |
|------------------------|-------------------------------------------------------------------|
| `FORBIDDEN`            | The role may not use this endpoint                                |
| `NOT_YOUR_APPOINTMENT` | A doctor touched another doctor's appointment                     |
| `NOT_YOUR_PATIENT`     | A doctor asked for a patient who is not his                       |
| `DOCTOR_NOT_LINKED`    | A Doctor account has no `doctorId`. An admin must fix the account |

## User accounts (admin)

- Register and update take `role` (`Admin`, `Manager`, `Doctor`) and `doctorId`.
- `doctorId` is required for `Doctor` and must be empty for the other roles. It is not checked against the doctor table,
  so it must be the id of an existing doctor.
- Username and email must be unique.

## Open points

Both are undecided. Do not build them unless asked:

- Managers have no appointment pages, so there is no invoice entry point for them yet.
- There is no admin page for creating users yet. Accounts are created through the API.
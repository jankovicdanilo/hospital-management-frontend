# Patient Service

## Endpoints

QueryService:
- GET /api/patient?pageNumber={n}&pageSize={n}&search={s} → PagedResult<PatientListDto> (list, paginated; optional `search` matches name or last name)
- GET /api/patient/{id} → PatientGetByIdDto
- GET /api/patient/popular?count={n} → PatientListDto[] (top N patients by number of appointments, most-booked first; default count is 5)

CommandService:
- POST /api/patient, body PatientCreateRequestDto → PatientCreateResponseDto
- PUT /api/patient, body PatientUpdateRequestDto → PatientUpdateResponseDto
- DELETE /api/patient/{id} → success/failure only

## DTOs

PatientListDto: { id: number, name: string, lastName: string, email: string, phone: string | null, dateOfBirth: string }
PatientGetByIdDto: { id: number, name: string, lastName: string, dateOfBirth: string, email: string, phone: string | null }
PatientCreateRequestDto: { name: string, lastName: string, email: string, phone?: string, dateOfBirth: string }
PatientCreateResponseDto: { id: number, name: string, lastName: string, email: string, phone: string | null, dateOfBirth: string }
PatientUpdateRequestDto: { id: number, name: string, lastName: string, dateOfBirth: string, email: string, phone?: string }
PatientUpdateResponseDto: { id: number, name: string, lastName: string, dateOfBirth: string, email: string, phone?: string }
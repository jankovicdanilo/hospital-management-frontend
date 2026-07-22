# Patient Service

## Endpoints

QueryService:
- GET /api/patient → PatientListDto[] (list)
- GET /api/patient/{id} → PatientGetByIdDto

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
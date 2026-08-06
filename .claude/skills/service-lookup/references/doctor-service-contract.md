# Doctor Service

## Endpoints

QueryService:
- GET /api/doctor?pageNumber={n}&pageSize={n} → PagedResult<DoctorResponseDto> (list, paginated)
- GET /api/doctor/{id} → DoctorResponseDto

CommandService:
- POST /api/doctor, body DoctorCreateRequestDto → DoctorResponseDto
- PUT /api/doctor, body DoctorUpdateRequestDto → DoctorResponseDto
- DELETE /api/doctor/{id} → success/failure only

## DTOs

DoctorResponseDto: { id: number, firstName: string | null, lastName: string | null, specialization: string | null, email: string | null, phone: string | null }
DoctorCreateRequestDto: { firstName: string, lastName: string, specialization: string, email: string, phone?: string }
DoctorUpdateRequestDto: { id: number, firstName: string, lastName: string, specialization: string, email: string, phone?: string }
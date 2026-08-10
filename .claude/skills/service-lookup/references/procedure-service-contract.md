# Procedure Service

## Endpoints

QueryService:
- GET /api/procedure?pageNumber={n}&pageSize={n} → PagedResult<ProcedureListDto> (list, paginated)
- GET /api/procedure/{id} → ProcedureResponseDto

CommandService:
- POST /api/procedure, body ProcedureCreateRequestDto → ProcedureCreateResponseDto
- PUT /api/procedure/{id}, body ProcedureUpdateRequestDto → ProcedureUpdateResponseDto
  (note: id is in the route, not the body — unlike Patient/Doctor)
- DELETE /api/procedure/{id} → success/failure only

## DTOs

ProcedureListDto: { id: number, name: string, price: number }
ProcedureResponseDto: { id: number, name: string, price: number }
ProcedureCreateRequestDto: { name: string, price: number }
ProcedureCreateResponseDto: { id: number, name: string, price: number }
ProcedureUpdateRequestDto: { name: string, price: number }
ProcedureUpdateResponseDto: { id: number, name: string, price: number }
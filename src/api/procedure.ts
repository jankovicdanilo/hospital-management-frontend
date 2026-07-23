import type {
  ProcedureCreateRequestDto,
  ProcedureCreateResponseDto,
  ProcedureListDto,
  ProcedureResponseDto,
  ProcedureUpdateRequestDto,
  ProcedureUpdateResponseDto,
} from '../types/procedure';
import { throwApiError, authHeaders } from './apiErrors';

const QUERY_BASE_URL = import.meta.env.VITE_QUERY_SERVICE_SERVICE_URL as string;
const COMMAND_BASE_URL = import.meta.env.VITE_COMMAND_SERVICE_SERVICE_URL as string;

export async function getProcedures(token: string): Promise<ProcedureListDto[]> {
  const response = await fetch(`${QUERY_BASE_URL}/api/procedure`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<ProcedureListDto[]>;
}

export async function getProcedureById(
  id: number,
  token: string,
): Promise<ProcedureResponseDto> {
  const response = await fetch(`${QUERY_BASE_URL}/api/procedure/${id}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<ProcedureResponseDto>;
}

export async function createProcedure(
  data: ProcedureCreateRequestDto,
  token: string,
): Promise<ProcedureCreateResponseDto> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/procedure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<ProcedureCreateResponseDto>;
}

export async function updateProcedure(
  id: number,
  data: ProcedureUpdateRequestDto,
  token: string,
): Promise<ProcedureUpdateResponseDto> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/procedure/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<ProcedureUpdateResponseDto>;
}

export async function deleteProcedure(id: number, token: string): Promise<void> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/procedure/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}

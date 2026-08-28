import type {
  PatientCreateRequestDto,
  PatientCreateResponseDto,
  PatientGetByIdDto,
  PatientListDto,
  PatientUpdateRequestDto,
  PatientUpdateResponseDto,
} from '../types/patient';
import { throwApiError, authHeaders } from './apiErrors';

const QUERY_BASE_URL = import.meta.env.VITE_QUERY_SERVICE_SERVICE_URL as string;
const COMMAND_BASE_URL = import.meta.env.VITE_COMMAND_SERVICE_SERVICE_URL as string;

export async function getPatients(
  pageNumber: number,
  pageSize: number,
  token: string,
  search?: string,
): Promise<{ items: PatientListDto[]; totalCount: number }> {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const response = await fetch(
    `${QUERY_BASE_URL}/api/patient?pageNumber=${pageNumber}&pageSize=${pageSize}${searchParam}`,
    { headers: authHeaders(token) },
  );

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<{ items: PatientListDto[]; totalCount: number }>;
}

export async function getPatientById(id: number, token: string): Promise<PatientGetByIdDto> {
  const response = await fetch(`${QUERY_BASE_URL}/api/patient/${id}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<PatientGetByIdDto>;
}

export async function createPatient(
  data: PatientCreateRequestDto,
  token: string,
): Promise<PatientCreateResponseDto> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<PatientCreateResponseDto>;
}

export async function updatePatient(
  data: PatientUpdateRequestDto,
  token: string,
): Promise<PatientUpdateResponseDto> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/patient`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<PatientUpdateResponseDto>;
}

export async function deletePatient(id: number, token: string): Promise<void> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/patient/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}

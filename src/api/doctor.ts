import type {
  DoctorCreateRequestDto,
  DoctorResponseDto,
  DoctorUpdateRequestDto,
} from '../types/doctor';
import { throwApiError, authHeaders } from './apiErrors';

const QUERY_BASE_URL = import.meta.env.VITE_QUERY_SERVICE_SERVICE_URL as string;
const COMMAND_BASE_URL = import.meta.env.VITE_COMMAND_SERVICE_SERVICE_URL as string;

export async function getDoctors(pageNumber: number, pageSize: number, token: string): Promise<{ items: DoctorResponseDto[]; totalCount: number }> {
  const response = await fetch(`${QUERY_BASE_URL}/api/doctor?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<{ items: DoctorResponseDto[]; totalCount: number }>;
}

export async function getDoctorById(id: number, token: string): Promise<DoctorResponseDto> {
  const response = await fetch(`${QUERY_BASE_URL}/api/doctor/${id}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorResponseDto>;
}

export async function createDoctor(
  data: DoctorCreateRequestDto,
  token: string,
): Promise<DoctorResponseDto> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorResponseDto>;
}

export async function updateDoctor(
  data: DoctorUpdateRequestDto,
  token: string,
): Promise<DoctorResponseDto> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/doctor`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorResponseDto>;
}

export async function deleteDoctor(id: number, token: string): Promise<void> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/doctor/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}

import type {
  DoctorScheduleCreateRequestDto,
  DoctorScheduleCreateResponseDto,
  DoctorScheduleResponseDto,
  DoctorScheduleUpdateRequestDto,
  DoctorScheduleUpdateResponseDto,
} from '../types/doctorSchedule';
import { throwApiError, authHeaders } from './apiErrors';

const QUERY_BASE_URL = import.meta.env.VITE_QUERY_SERVICE_SERVICE_URL as string;
const COMMAND_BASE_URL = import.meta.env.VITE_COMMAND_SERVICE_SERVICE_URL as string;

export async function getDoctorSchedulesByDoctor(
  doctorId: number,
  token: string,
): Promise<DoctorScheduleResponseDto[]> {
  const response = await fetch(`${QUERY_BASE_URL}/api/doctorschedule/doctor/${doctorId}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorScheduleResponseDto[]>;
}

export async function createDoctorSchedule(
  data: DoctorScheduleCreateRequestDto,
  token: string,
): Promise<DoctorScheduleCreateResponseDto> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/doctorschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorScheduleCreateResponseDto>;
}

export async function updateDoctorSchedule(
  data: DoctorScheduleUpdateRequestDto,
  token: string,
): Promise<DoctorScheduleUpdateResponseDto> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/doctorschedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorScheduleUpdateResponseDto>;
}

export async function deleteDoctorSchedule(id: number, token: string): Promise<void> {
  const response = await fetch(`${COMMAND_BASE_URL}/api/doctorschedule/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}

import type {
  AppointmentCreateRequestDto,
  AppointmentCreateResponseDto,
  AppointmentListResponseDto,
  AppointmentResponseDto,
  AppointmentStatusUpdateDto,
  AppointmentUpdateRequestDto,
  AppointmentUpdateResponseDto,
  TimeSlotDto,
} from '../types/appointment';
import { throwApiError, authHeaders } from './apiErrors';

const APPOINTMENT_BASE_URL = import.meta.env.VITE_APPOINTMENT_SERVICE_URL as string;

export async function getAppointmentsByWeek(
  startDate: string,
  endDate: string,
  token: string,
  doctorId?: number,
  patientId?: number,
): Promise<{ items: AppointmentListResponseDto[]; totalCount: number }> {
  const doctorParam = doctorId != null ? `&doctorId=${doctorId}` : '';
  const patientParam = patientId != null ? `&patientId=${patientId}` : '';
  const response = await fetch(
    `${APPOINTMENT_BASE_URL}/api/appointment?startDate=${startDate}&endDate=${endDate}${doctorParam}${patientParam}&pageNumber=1&pageSize=100`,
    { headers: authHeaders(token) },
  );

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<{ items: AppointmentListResponseDto[]; totalCount: number }>;
}

export async function getAppointmentById(id: number, token: string): Promise<AppointmentResponseDto> {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/api/appointment/${id}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<AppointmentResponseDto>;
}

export async function getFreeSlots(
  doctorId: number,
  date: string,
  token: string,
): Promise<TimeSlotDto[]> {
  const response = await fetch(
    `${APPOINTMENT_BASE_URL}/api/appointment/free-slots?doctorId=${doctorId}&date=${date}`,
    { headers: authHeaders(token) },
  );

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<TimeSlotDto[]>;
}

export async function createAppointment(
  data: AppointmentCreateRequestDto,
  token: string,
): Promise<AppointmentCreateResponseDto> {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/api/appointment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<AppointmentCreateResponseDto>;
}

export async function updateAppointment(
  data: AppointmentUpdateRequestDto,
  token: string,
): Promise<AppointmentUpdateResponseDto> {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/api/appointment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<AppointmentUpdateResponseDto>;
}

export async function deleteAppointment(id: number, token: string): Promise<void> {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/api/appointment/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}

export async function updateAppointmentStatus(
  data: AppointmentStatusUpdateDto,
  token: string,
): Promise<void> {
  const response = await fetch(`${APPOINTMENT_BASE_URL}/api/appointment/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    return throwApiError(response);
  }
}

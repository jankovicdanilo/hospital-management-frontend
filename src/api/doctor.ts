import type {
  ApiErrorResponse,
  DoctorCreateRequestDto,
  DoctorResponseDto,
  DoctorUpdateRequestDto,
} from '../types/doctor';

const QUERY_BASE_URL = import.meta.env.VITE_QUERY_SERVICE_SERVICE_URL as string;
const COMMAND_BASE_URL = import.meta.env.VITE_COMMAND_SERVICE_SERVICE_URL as string;

export class ApiError extends Error {
  readonly errorCode: string;
  readonly errors?: Record<string, string[]>;

  constructor(message: string, errorCode: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

async function throwApiError(response: Response): Promise<never> {
  const body: ApiErrorResponse = await response.json();
  throw new ApiError(body.message, body.errorCode, body.errors);
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function getDoctors(token: string): Promise<DoctorResponseDto[]> {
  const response = await fetch(`${QUERY_BASE_URL}/api/doctor`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    return throwApiError(response);
  }

  return response.json() as Promise<DoctorResponseDto[]>;
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

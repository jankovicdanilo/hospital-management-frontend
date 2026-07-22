export interface DoctorResponseDto {
  id: number;
  firstName: string | null;
  lastName: string | null;
  specialization: string | null;
  email: string | null;
  phone: string | null;
}

export interface DoctorCreateRequestDto {
  firstName: string;
  lastName: string;
  specialization: string;
  email: string;
  phone?: string;
}

export interface DoctorUpdateRequestDto {
  id: number;
  firstName: string;
  lastName: string;
  specialization: string;
  email: string;
  phone?: string;
}

export interface ApiErrorResponse {
  message: string;
  errorCode: string;
  errors?: Record<string, string[]>;
}

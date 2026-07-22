export interface PatientListDto {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string;
}

export interface PatientGetByIdDto {
  id: number;
  name: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string | null;
}

export interface PatientCreateRequestDto {
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
}

export interface PatientCreateResponseDto {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string;
}

export interface PatientUpdateRequestDto {
  id: number;
  name: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
}

export interface PatientUpdateResponseDto {
  id: number;
  name: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
}

export interface ApiErrorResponse {
  message: string;
  errorCode: string;
  errors?: Record<string, string[]>;
}

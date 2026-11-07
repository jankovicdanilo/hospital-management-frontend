export type Role = 'Admin' | 'Manager' | 'Doctor';

export interface User {
  username: string;
  email: string;
  role: Role;
  doctorId: number | null;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginError {
  message: string;
  errorCode: string;
}

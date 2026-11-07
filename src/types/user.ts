import type { Role } from './auth';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  role: Role;
  doctorId: number | null;
  createdAt: string;
}

export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
  role: Role;
  doctorId: number | null;
}

export interface UpdateUserRequest {
  id: number;
  username: string;
  email: string;
  role: Role;
  doctorId: number | null;
}

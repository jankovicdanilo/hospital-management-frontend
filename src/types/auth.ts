export interface User {
  username: string;
  email: string;
  role: string;
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

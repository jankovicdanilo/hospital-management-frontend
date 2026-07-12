export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  username: string
  email: string
  role: string
  token: string
}

export interface ApiError {
  message: string
  errorCode: string
}

export type UserType = 'ADMIN' | 'EMPLOYEE' | 'PATRON';

export interface AuthUser {
  id: string;
  type: UserType;
  firstname: string;
  lastname: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
}

export interface MeResponse {
  message: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export interface ApiErrorBody {
  message: string;
  error?: string;
}

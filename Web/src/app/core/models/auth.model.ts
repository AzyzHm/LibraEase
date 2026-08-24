export type UserType = 'ADMIN' | 'EMPLOYEE' | 'PATRON';

/** The user object as returned by the backend on login/register - password is never included. */
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
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

/** Shape of the JSON body Express sends back on 4xx/5xx responses across this API. */
export interface ApiErrorBody {
  message: string;
  error?: string;
}

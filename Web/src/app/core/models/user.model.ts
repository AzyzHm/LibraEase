import { AuthUser, UserType } from './auth.model';

export interface UpdateProfilePayload {
  id: string;
  type: UserType;
  firstname: string;
  lastname: string;
  email: string;
}

export interface UpdateProfileResponse {
  message: string;
  updatedUser: AuthUser;
}
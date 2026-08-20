import { UserType } from './auth.model';

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';


export interface AdminUser {
  id: string;
  type: UserType;
  firstname: string;
  lastname: string;
  email: string;
  status: UserStatus;
}

/** GET /users response envelope. */
export interface UsersListResponse {
  message: string;
  users: AdminUser[];
}

/** PUT /:userId/approve and PUT /:userId/reject response envelope. */
export interface UserActionResponse {
  message: string;
  user: AdminUser;
}

/** DELETE /:userId response envelope. */
export interface DeleteUserResponse {
  message: string;
}
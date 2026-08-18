import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeleteUserResponse, UserActionResponse, UsersListResponse } from '../models/admin.model';
import { UpdateProfilePayload, UpdateProfileResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  update(payload: UpdateProfilePayload): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(this.baseUrl, payload);
  }

  /** GET /users - admin/employee only. Every user in the system, any status. */
  getAll(): Observable<UsersListResponse> {
    return this.http.get<UsersListResponse>(this.baseUrl);
  }

  /** PUT /:userId/approve - admin only. */
  approve(userId: string): Observable<UserActionResponse> {
    return this.http.put<UserActionResponse>(`${this.baseUrl}/${userId}/approve`, {});
  }

  /** PUT /:userId/reject - admin only. */
  reject(userId: string): Observable<UserActionResponse> {
    return this.http.put<UserActionResponse>(`${this.baseUrl}/${userId}/reject`, {});
  }

  /** DELETE /:userId - admin only for arbitrary users (owner-or-admin on the backend). */
  remove(userId: string): Observable<DeleteUserResponse> {
    return this.http.delete<DeleteUserResponse>(`${this.baseUrl}/${userId}`);
  }
}
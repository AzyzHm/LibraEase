import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UpdateProfilePayload, UpdateProfileResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  update(payload: UpdateProfilePayload): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(this.baseUrl, payload);
  }
}
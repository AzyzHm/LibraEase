import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { AuthApi } from '../api/auth-api';
import {
  ApiErrorBody,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApi);

  private readonly userSignal = signal<AuthUser | null>(null);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly restoring = signal(true);

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly isAdmin = computed(() => this.userSignal()?.type === 'ADMIN');
  readonly isPatron = computed(() => this.userSignal()?.type === 'PATRON');
  readonly isStaff = computed(() => {
    const type = this.userSignal()?.type;
    return type === 'ADMIN' || type === 'EMPLOYEE';
  });

  restoreSession(): Observable<AuthUser | null> {
    return this.authApi.me().pipe(
      map((response) => response.user),
      tap((user) => {
        this.userSignal.set(user);
        this.restoring.set(false);
      }),
      catchError(() => {
        this.userSignal.set(null);
        this.restoring.set(false);
        return of(null);
      }),
    );
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    this.loading.set(true);
    this.errorMessage.set(null);

    return this.authApi.login(credentials).pipe(
      tap((response) => {
        this.userSignal.set(response.user);
        this.loading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          this.extractErrorMessage(error, 'Unable to sign in. Check your details and try again.'),
        );
        return throwError(() => error);
      }),
    );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    this.loading.set(true);
    this.errorMessage.set(null);

    return this.authApi.register(payload).pipe(
      tap(() => this.loading.set(false)),
      catchError((error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          this.extractErrorMessage(error, 'Unable to register. Please try again.'),
        );
        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    this.userSignal.set(null);
    this.authApi.logout().subscribe({ error: () => undefined });
  }

  updateUser(user: AuthUser): void {
    this.userSignal.set(user);
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? fallback;
  }
}

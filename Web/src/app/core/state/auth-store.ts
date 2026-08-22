import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuthApi } from '../api/auth-api';
import {
  ApiErrorBody,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from '../models/auth.model';
import { isJwtExpired } from '../utils/jwt.util';

const TOKEN_KEY = 'libraease.token';
const USER_KEY = 'libraease.user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApi);

  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(
    () => this.userSignal() !== null && this.tokenSignal() !== null,
  );
  readonly isAdmin = computed(() => this.userSignal()?.type === 'ADMIN');
  readonly isPatron = computed(() => this.userSignal()?.type === 'PATRON');
  readonly isStaff = computed(() => {
    const type = this.userSignal()?.type;
    return type === 'ADMIN' || type === 'EMPLOYEE';
  });

  constructor() {
    this.restoreSession();
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    this.loading.set(true);
    this.errorMessage.set(null);

    return this.authApi.login(credentials).pipe(
      tap((response) => {
        this.setSession(response.user, response.token);
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
    this.tokenSignal.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /** Refreshes the cached user (e.g. after a profile edit) without touching the token. */
  updateUser(user: AuthUser): void {
    this.userSignal.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private setSession(user: AuthUser, token: string): void {
    this.userSignal.set(user);
    this.tokenSignal.set(token);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);

    if (!token || !rawUser || isJwtExpired(token)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return;
    }

    try {
      const user = JSON.parse(rawUser) as AuthUser;
      this.userSignal.set(user);
      this.tokenSignal.set(token);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const body = error.error as ApiErrorBody | undefined;
    return body?.message ?? fallback;
  }
}

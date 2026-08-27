import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../state/auth-store';
import { readCsrfToken } from '../utils/csrf.util';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const csrfToken = SAFE_METHODS.has(req.method) ? null : readCsrfToken();

  const authedReq = req.clone({
    withCredentials: true,
    setHeaders: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
  });

  const isAuthEndpoint =
    req.url.endsWith('/auth/me') ||
    req.url.endsWith('/auth/login') ||
    req.url.endsWith('/auth/register');

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        const returnUrl = router.routerState.snapshot.url;
        authStore.logout();
        router.navigate(['/login'], { queryParams: { returnUrl } });
      }

      return throwError(() => error);
    }),
  );
};

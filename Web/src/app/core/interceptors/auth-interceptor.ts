import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../state/auth-store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const token = authStore.token();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  ).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const returnUrl = router.routerState.snapshot.url;
        authStore.logout();
        router.navigate(['/login'], { queryParams: { returnUrl } });
      }

      return throwError(() => error);
    })
  );
};
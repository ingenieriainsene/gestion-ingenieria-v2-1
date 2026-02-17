import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    // Usar localStorage directamente para el token para evitar circularidad DI con AuthService
    const token = localStorage.getItem('authToken');

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error) => {
            if (error?.status === 401 || error?.status === 403) {
                // Si hay error de auth, inyectamos AuthService de forma diferida para forzar logout
                const authService = inject(AuthService);
                authService.forceLogout();
            }
            return throwError(() => error);
        })
    );
};

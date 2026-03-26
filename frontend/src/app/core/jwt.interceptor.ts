import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject, Injector } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const injector = inject(Injector);
    const auth = injector.get(AuthService);
    const token = auth.getToken();

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
                // Si no estamos ya en login, forzamos salida para limpiar estado reactivo
                if (!window.location.pathname.includes('/login')) {
                    auth.forceLogout();
                }
            }
            return throwError(() => error);
        })
    );
};

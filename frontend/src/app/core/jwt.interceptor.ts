import { HttpInterceptorFn } from '@angular/common/http';
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
                // Evita dependencia circular con AuthService dentro del interceptor.
                localStorage.removeItem('authToken');
                localStorage.removeItem('authRole');
                if (!window.location.pathname.includes('/login')) {
                    window.location.assign('/login');
                }
            }
            return throwError(() => error);
        })
    );
};

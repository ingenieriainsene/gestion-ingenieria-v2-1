import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private endpoint = 'auth';
    private tokenKey = 'authToken';

    constructor(private api: ApiService, private router: Router) { }

    login(credentials: any): Observable<any> {
        return this.api.post(`${this.endpoint}/login`, credentials).pipe(
            tap((response: any) => {
                if (response.token) {
                    localStorage.setItem(this.tokenKey, response.token);
                }
            })
        );
    }

    logout() {
        // Llamamos al backend para cerrar sesión y registrar auditoría
        this.api.post(`${this.endpoint}/logout`, {}).subscribe({
            next: () => {
                localStorage.removeItem(this.tokenKey);
                this.router.navigate(['/login']);
            },
            error: () => {
                // Incluso si falla, limpiamos el estado local
                localStorage.removeItem(this.tokenKey);
                this.router.navigate(['/login']);
            }
        });
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}

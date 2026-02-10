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
                this.clearToken();
                this.router.navigate(['/login']);
            },
            error: () => {
                // Incluso si falla, limpiamos el estado local
                this.clearToken();
                this.router.navigate(['/login']);
            }
        });
    }

    getToken() {
        const token = localStorage.getItem(this.tokenKey);
        if (!token) return null;
        if (this.isTokenExpired(token)) {
            this.clearToken();
            return null;
        }
        return token;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    forceLogout(): void {
        this.clearToken();
        this.router.navigate(['/login']);
    }

    private clearToken(): void {
        localStorage.removeItem(this.tokenKey);
    }

    private isTokenExpired(token: string): boolean {
        const payload = this.decodeTokenPayload(token);
        if (!payload || typeof payload.exp !== 'number') return false;
        const nowSeconds = Math.floor(Date.now() / 1000);
        return payload.exp <= nowSeconds;
    }

    getUsername(): string | null {
        const token = this.getToken();
        if (!token) return null;
        const payload = this.decodeTokenPayload(token);
        return payload ? (payload.sub || payload.username) : null;
    }

    private decodeTokenPayload(token: string): any {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
            const json = atob(padded);
            return JSON.parse(json);
        } catch {
            return null;
        }
    }
}

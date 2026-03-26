import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private endpoint = 'auth';
    private tokenKey = 'authToken';
    private roleKey = 'authRole';

    private loggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
    public isLoggedIn$ = this.loggedInSubject.asObservable();

    constructor(private api: ApiService, private router: Router) {
        // Iniciar pulso si ya está logueado al cargar el servicio
        if (this.isLoggedIn()) {
            this.startHeartbeat();
        }
    }

    login(credentials: any): Observable<any> {
        return this.api.post(`${this.endpoint}/login`, credentials).pipe(
            tap((response: any) => {
                if (response.token) {
                    localStorage.setItem(this.tokenKey, response.token);
                    if (response.rol) {
                        localStorage.setItem(this.roleKey, response.rol);
                    }
                    this.loggedInSubject.next(true);
                    this.startHeartbeat();
                }
            })
        );
    }

    ping(): Observable<any> {
        return this.api.get('public/ping');
    }

    private heartbeatInterval: any;
    private startHeartbeat() {
        if (this.heartbeatInterval) return;

        // Enviar primer latido inmediatamente
        this.sendHeartbeat();

        // Configurar latido cada 2 minutos
        this.heartbeatInterval = setInterval(() => {
            if (this.isLoggedIn()) {
                this.sendHeartbeat();
            } else {
                this.stopHeartbeat();
            }
        }, 120000); // 2 minutos
    }

    private sendHeartbeat() {
        this.api.post(`${this.endpoint}/heartbeat`, {}).subscribe({
            error: (err) => console.warn('[Auth] Error enviando heartbeat', err)
        });
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    logout() {
        // Llamamos al backend para cerrar sesión y registrar auditoría
        this.api.post(`${this.endpoint}/logout`, {}).subscribe({
            next: () => {
                this.stopHeartbeat();
                this.clearToken();
                this.loggedInSubject.next(false);
                this.router.navigate(['/login']);
            },
            error: () => {
                // Incluso si falla, limpiamos el estado local
                this.stopHeartbeat();
                this.clearToken();
                this.loggedInSubject.next(false);
                this.router.navigate(['/login']);
            }
        });
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    private hasValidToken(): boolean {
        const token = this.getToken();
        if (!token) return false;
        return !this.isTokenExpired(token);
    }

    getRole(): string | null {
        return localStorage.getItem(this.roleKey);
    }

    isLoggedIn(): boolean {
        return this.loggedInSubject.value;
    }

    /**
     * Valida la sesión actual y actualiza el estado. 
     * Llamar periódicamente o en navegación, NO en plantillas.
     */
    validateSession(): void {
        const isValid = this.hasValidToken();
        if (this.loggedInSubject.value !== isValid) {
            this.loggedInSubject.next(isValid);
            if (!isValid) {
                this.clearToken();
            }
        }
    }

    forceLogout(): void {
        this.clearToken();
        this.loggedInSubject.next(false);
        this.router.navigate(['/login']);
    }

    private clearToken(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.roleKey);
    }

    private isTokenExpired(token: string): boolean {
        const payload = this.decodeTokenPayload(token);
        if (!payload || typeof payload.exp !== 'number') return true;
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

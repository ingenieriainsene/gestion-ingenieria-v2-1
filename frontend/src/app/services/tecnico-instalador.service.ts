import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface TecnicoInstalador {
    idTecnicoInstalador?: number;
    nombre: string;
    telefono?: string;
    activo: boolean;
    fechaAlta?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TecnicoInstaladorService {
    private apiUrl = `${environment.apiUrl}/tecnicos-instaladores`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<TecnicoInstalador[]> {
        return this.http.get<TecnicoInstalador[]>(this.apiUrl);
    }

    getActivos(): Observable<TecnicoInstalador[]> {
        return this.http.get<TecnicoInstalador[]>(`${this.apiUrl}/activos`);
    }

    getById(id: number): Observable<TecnicoInstalador> {
        return this.http.get<TecnicoInstalador>(`${this.apiUrl}/${id}`);
    }

    create(tecnico: TecnicoInstalador): Observable<TecnicoInstalador> {
        return this.http.post<TecnicoInstalador>(this.apiUrl, tecnico);
    }

    update(id: number, tecnico: TecnicoInstalador): Observable<TecnicoInstalador> {
        return this.http.put<TecnicoInstalador>(`${this.apiUrl}/${id}`, tecnico);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

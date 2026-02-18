import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface AreaFuncional {
    idArea?: number;
    nombre: string;
    descripcion?: string;
    orden?: number;
    lineas?: AreaFuncionalLinea[];
}

export interface AreaFuncionalLinea {
    idLinea?: number;
    productoId?: number;
    productoTexto?: string;
    concepto?: string;
    cantidad?: number;
    accionRequerida?: string;
    orden?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AreaFuncionalService {
    private apiUrl = `${environment.apiUrl}/areas-funcionales`;

    constructor(private http: HttpClient) { }

    getByLocal(idLocal: number): Observable<AreaFuncional[]> {
        return this.http.get<AreaFuncional[]>(`${this.apiUrl}/local/${idLocal}`);
    }

    createArea(idLocal: number, area: AreaFuncional): Observable<AreaFuncional> {
        return this.http.post<AreaFuncional>(`${this.apiUrl}/local/${idLocal}`, area);
    }

    updateArea(idArea: number, area: AreaFuncional): Observable<AreaFuncional> {
        return this.http.put<AreaFuncional>(`${this.apiUrl}/${idArea}`, area);
    }

    deleteArea(idArea: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${idArea}`);
    }

    addLinea(idArea: number, linea: AreaFuncionalLinea): Observable<AreaFuncionalLinea> {
        return this.http.post<AreaFuncionalLinea>(`${this.apiUrl}/${idArea}/lineas`, linea);
    }

    updateLinea(idLinea: number, linea: AreaFuncionalLinea): Observable<AreaFuncionalLinea> {
        return this.http.put<AreaFuncionalLinea>(`${this.apiUrl}/lineas/${idLinea}`, linea);
    }

    deleteLinea(idLinea: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/lineas/${idLinea}`);
    }
}

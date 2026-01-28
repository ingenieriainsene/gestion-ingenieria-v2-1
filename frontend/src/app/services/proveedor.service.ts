import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface ProveedorDTO {
    idProveedor?: number;
    nombreComercial: string;
    razonSocial: string;
    cif: string;
    direccionFiscal: string;
    esAutonomo: boolean;
    oficiosIds?: number[];
    contactos?: any[]; // Simplified for brevity
}

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {
    private endpoint = 'proveedores';

    constructor(private api: ApiService) { }

    getAll(): Observable<any[]> {
        return this.api.get<any[]>(this.endpoint);
    }

    getById(id: number): Observable<any> {
        return this.api.get<any>(`${this.endpoint}/${id}`);
    }

    create(data: ProveedorDTO): Observable<any> {
        return this.api.post<any>(this.endpoint, data);
    }

    update(id: number, data: ProveedorDTO): Observable<any> {
        return this.api.put<any>(`${this.endpoint}/${id}`, data); // Note: Backend needs PUT map
    }
}

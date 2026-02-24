import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface ProveedorDTO {
    idProveedor?: number;
    nombreComercial: string;
    razonSocial?: string;
    cif: string;
    direccionFiscal?: string;
    esAutonomo: boolean;
    oficios?: string[];
    contactos?: { nombre: string; cargo?: string; telefono?: string; email?: string }[];
}

/** Payload para POST /api/proveedores. Nombres 100% iguales al backend ProveedorCreateRequest. */
export interface ProveedorCreateRequest {
    nombreComercial: string;
    razonSocial?: string;
    cif: string;
    direccionFiscal?: string;
    esAutonomo: boolean;
    oficios?: string[];
    contactos?: { nombre: string; cargo?: string; telefono?: string; email?: string }[];
}

export interface OficioDTO {
    id: number;
    oficio: string;
}

export interface ContactoDTO {
    id?: number;
    nombre: string;
    cargo?: string;
    telefono?: string;
    email?: string;
}

export interface AlbaranProveedorDTO {
    idAlbaran: number;
    numeroAlbaran: string;
    fecha: string;
    importe: number;
    idTramite?: number;
    numeroTramite?: string;
    notas?: string;
}

export interface FacturaProveedorDTO {
    idFactura: number;
    numeroFactura: string;
    fecha: string;
    importe: number;
    estado: string;
    idTramite?: number;
    numeroTramite?: string;
    notas?: string;
}

export interface TrabajoAsociadoDTO {
    idTramite: number;
    tipoTramite: string;
    clienteNombre: string;
    viviendaDireccion: string;
    fechaSeguimiento: string;
    estado: string;
}

export interface ProveedorDetailDTO {
    id: number;
    nombreComercial: string;
    razonSocial?: string;
    cif: string;
    esAutonomo?: boolean;
    direccionFiscal?: string;
    fechaAlta?: string;
    listaOficios: OficioDTO[];
    listaContactos: ContactoDTO[];
    listaAlbaranes: AlbaranProveedorDTO[];
    listaFacturas: FacturaProveedorDTO[];
    listaTrabajos: TrabajoAsociadoDTO[];
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

    getById(id: number): Observable<ProveedorDetailDTO> {
        return this.api.get<ProveedorDetailDTO>(`${this.endpoint}/${id}`);
    }

    create(data: ProveedorCreateRequest): Observable<{ idProveedor: number }> {
        return this.api.post<{ idProveedor: number }>(this.endpoint, data);
    }

    update(id: number, data: Partial<ProveedorDTO>): Observable<void> {
        return this.api.put<void>(`${this.endpoint}/${id}`, data);
    }

    delete(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`);
    }

    updateOficios(id: number, oficios: string[]): Observable<void> {
        return this.api.put<void>(`${this.endpoint}/${id}/oficios`, oficios);
    }

    addContact(id: number, c: ContactoDTO): Observable<ContactoDTO> {
        return this.api.post<ContactoDTO>(`${this.endpoint}/${id}/contactos`, c);
    }

    updateContact(id: number, idContacto: number, c: ContactoDTO): Observable<ContactoDTO> {
        return this.api.put<ContactoDTO>(`${this.endpoint}/${id}/contactos/${idContacto}`, c);
    }

    deleteContact(id: number, idContacto: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}/contactos/${idContacto}`);
    }
}

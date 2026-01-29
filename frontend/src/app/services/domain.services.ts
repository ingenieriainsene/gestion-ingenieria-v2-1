import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, map } from 'rxjs';

// Interfaces matching DDL
export interface Cliente {
    idCliente?: number;
    nombre: string;
    apellido1: string;
    apellido2?: string;
    dni: string;
    direccionFiscalCompleta?: string;
    codigoPostal?: string;
    cuentaBancaria?: string;
    fechaAlta?: string;
    creadoPor?: string;
    modificadoPor?: string;
    fechaModificacion?: string;
}

export interface Local {
    idLocal?: number;
    idCliente?: number;
    nombreTitular: string;
    apellido1Titular: string;
    apellido2Titular?: string;
    dniTitular?: string;
    cups?: string;
    referenciaCatastral?: string;
    direccionCompleta: string;
    latitud?: number;
    longitud?: number;
    fechaAlta?: string;
    /** Cuando el backend devuelve el local con cliente anidado (GET por id). */
    cliente?: Cliente;
}

export interface Contrato {
    idContrato?: number;
    idCliente: number;
    idLocal: number;
    fechaInicio: string;
    fechaVencimiento: string;
    tipoContrato: string;
    cePrevio?: string;
    cePost?: string;
    enviadoCeePost?: boolean;
    licenciaObras?: string;
    mtd?: boolean;
    planos?: boolean;
    subvencionEstado?: string;
    libroEdifIncluido?: boolean;
    observaciones?: string;
    // Datos enriquecidos que vienen del backend para pantallas tipo listado/gestión
    cliente?: Cliente;
    local?: Local;
    fechaAlta?: string;
    creadoPor?: string;
    modificadoPor?: string;
    fechaModificacion?: string;
}

export interface Tramite {
    idTramite?: number;
    idContrato?: number;
    tipoTramite: string;
    estado?: string;
    tecnicoAsignado?: string;
    fechaSeguimiento?: string | Date;
    fechaCreacion?: string | Date;
    esUrgente?: boolean;
    detalleSeguimiento?: string;
    fechaEjecucion?: string | Date;
}

export interface Seguimiento {
    idSeguimiento?: number;
    idTramite: number;
    idUsuario?: number;
    idUsuarioAsignado?: number;
    idCreador?: number;
    idProveedor?: number;
    comentario: string;
    fechaSeguimiento?: string;
    esUrgente?: boolean;
    estado?: string;
    nombreAsignado?: string;
    nombreCreador?: string;
    fechaRegistro?: string;
}

export interface TramiteDetalleResponse {
    idTramite: number;
    idContrato: number;
    tipoTramite: string;
    estado?: string;
    detalleSeguimiento?: string;
    fechaCreacion?: string;
    fechaSeguimiento?: string;
    fechaEjecucion?: string;
    tecnicoAsignado?: string;
    esUrgente?: boolean;
    tipoContrato?: string;
    observacionesContrato?: string;
    cePrevio?: string;
    cePost?: string;
    mtd?: boolean;
    planos?: boolean;
    enviadoCeePost?: boolean;
    licenciaObras?: string;
    subvencionEstado?: string;
    libroEdifIncluido?: boolean;
    clienteNombre?: string;
    clienteApellido1?: string;
    clienteDni?: string;
    localDireccion?: string;
    localNombreTitular?: string;
}

export interface Proveedor {
    idProveedor?: number;
    nombreComercial: string;
    razonSocial: string;
    cif: string;
    direccionFiscal: string;
    esAutonomo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
    private endpoint = 'clientes';
    constructor(private api: ApiService) { }
    getAll(): Observable<Cliente[]> { return this.api.get<Cliente[]>(this.endpoint); }
    getById(id: number): Observable<Cliente> { return this.api.get<Cliente>(`${this.endpoint}/${id}`); }
    search(term: string): Observable<Cliente[]> { return this.api.get<Cliente[]>(`${this.endpoint}/search`, { q: term }); }
    create(data: Cliente): Observable<Cliente> { return this.api.post<Cliente>(this.endpoint, data); }
    update(id: number, data: Cliente): Observable<Cliente> { return this.api.put<Cliente>(`${this.endpoint}/${id}`, data); }
    delete(id: number): Observable<void> { return this.api.delete<void>(`${this.endpoint}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class LocalService {
    private endpoint = 'locales';
    constructor(private api: ApiService) { }
    getAll(): Observable<Local[]> { return this.api.get<Local[]>(this.endpoint); }
    getById(id: number): Observable<Local> { return this.api.get<Local>(`${this.endpoint}/${id}`); }
    create(data: Partial<Local> & { idCliente: number }): Observable<Local> { return this.api.post<Local>(this.endpoint, data); }
    update(id: number, data: Record<string, unknown>): Observable<Local> {
        return this.api.put<Local>(`${this.endpoint}/${id}`, data);
    }
    delete(id: number): Observable<void> { return this.api.delete<void>(`${this.endpoint}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class ContratoService {
    private endpoint = 'contratos';
    constructor(private api: ApiService) { }
    getAll(): Observable<Contrato[]> { return this.api.get<Contrato[]>(this.endpoint); }
    getById(id: number): Observable<Contrato> { return this.api.get<Contrato>(`${this.endpoint}/${id}`); }
    create(data: Contrato): Observable<Contrato> { return this.api.post<Contrato>(this.endpoint, data); }
    update(id: number, data: Record<string, unknown>): Observable<Contrato> {
        return this.api.put<Contrato>(`${this.endpoint}/${id}`, data);
    }
    delete(id: number): Observable<void> { return this.api.delete<void>(`${this.endpoint}/${id}`); }

    /**
     * Añadir a Ventas: crea intervención con estado Pendiente para el contrato.
     * El trámite aparece en Ventas Pendientes.
     */
    anadirAVentas(idContrato: number, payload: { tipoTramite: string; detalleSeguimiento?: string }): Observable<Tramite> {
        return this.api.post<Tramite>(`${this.endpoint}/${idContrato}/anadir-a-ventas`, payload);
    }

    /**
     * POST /api/contratos/{id}/tramites – crea intervención Pendiente (replica gestionar_contrato.php).
     */
    crearTramiteForContrato(idContrato: number, payload: { tipoTramite: string; detalleSeguimiento?: string }): Observable<Tramite> {
        return this.api.post<Tramite>(`${this.endpoint}/${idContrato}/tramites`, payload);
    }

    /**
     * Alias para añadir intervención (Añadir a ventas). Delega en crearTramiteForContrato.
     */
    addIntervencion(idContrato: number, datos: { tipoTramite: string; detalleSeguimiento?: string }): Observable<Tramite> {
        return this.crearTramiteForContrato(idContrato, datos);
    }

    /**
     * GET /api/contratos/{id}/tramites – todos los trámites del contrato (única fuente de verdad).
     * El frontend distribuye por estado: Pendiente → Ventas Pendientes; En proceso / Terminado → Mapa Visual.
     */
    getTramitesPorContrato(idContrato: number): Observable<Tramite[]> {
        return this.api.get<Tramite[]>(`${this.endpoint}/${idContrato}/tramites`);
    }

    /**
     * GET /api/contratos/{id}/tramites-pendientes – trámites con estado 'Pendiente' de este contrato.
     * Filtrado en backend (WHERE estado = 'Pendiente').
     */
    getTramitesPendientesByContrato(idContrato: number): Observable<Tramite[]> {
        return this.api.get<Tramite[]>(`${this.endpoint}/${idContrato}/tramites-pendientes`);
    }

    /**
     * GET /api/contratos/{id}/tramites-activos – trámites En proceso / Terminado para el Mapa Visual.
     * Replica $res_activas de gestionar_contrato.php.
     */
    getTramitesActivosByContrato(idContrato: number): Observable<Tramite[]> {
        return this.api.get<Tramite[]>(`${this.endpoint}/${idContrato}/tramites-activos`);
    }
}

@Injectable({ providedIn: 'root' })
export class TramiteService {
    private endpoint = 'tramites';
    constructor(private api: ApiService) { }
    getByContrato(idContrato: number): Observable<Tramite[]> {
        return this.api.get<any[]>(`${this.endpoint}/contrato/${idContrato}`).pipe(
            map((lista: any[]) => lista.map((t: any) => ({
                ...t,
                idContrato: t.idContrato ?? t.contrato?.idContrato
            })))
        );
    }
    getById(id: number): Observable<Tramite> {
        return this.api.get<any>(`${this.endpoint}/${id}`).pipe(
            map((t: any) => ({
                ...t,
                idContrato: t.idContrato ?? t.contrato?.idContrato
            }))
        );
    }

    /** GET /api/tramites/{id}/detalle – datos completos para la página de detalle. */
    getDetalle(id: number): Observable<TramiteDetalleResponse> {
        return this.api.get<TramiteDetalleResponse>(`${this.endpoint}/${id}/detalle`);
    }
    create(data: Tramite): Observable<Tramite> {
        // El backend espera un objeto Tramite con un Contrato anidado (ManyToOne),
        // equivalente al INSERT que hacía acciones_tramites.php.
        const payload: any = {
            tipoTramite: data.tipoTramite,
            estado: data.estado,
            fechaSeguimiento: data.fechaSeguimiento,
            esUrgente: data.esUrgente,
            detalleSeguimiento: data.detalleSeguimiento,
            contrato: { idContrato: data.idContrato }
        };
        return this.api.post<Tramite>(this.endpoint, payload);
    }
    update(id: number, data: Partial<Tramite>): Observable<Tramite> {
        return this.api.put<Tramite>(`${this.endpoint}/${id}`, data);
    }

    /**
     * Avanza el estado del trámite siguiendo la lógica legacy:
     * Pendiente -> En proceso -> Terminado.
     * Usa el endpoint específico de gestión de intervención.
     */
    avanzarEstado(id: number): Observable<Tramite> {
        return this.api.post<Tramite>(`${this.endpoint}/${id}/avanzar-estado`, {});
    }

    /**
     * Generar: POST /api/tramites/{id}/generar.
     * Pasa el trámite de Pendiente a En proceso. Sale de Ventas Pendientes y entra en el Mapa Visual.
     */
    generar(id: number): Observable<Tramite> {
        return this.api.post<Tramite>(`${this.endpoint}/${id}/generar`, {});
    }

    /**
     * Marca o desmarca una intervención como "venta pendiente".
     * Usamos PATCH emulado con POST vacío (el backend acepta el verbo PATCH,
     * pero el ApiService no tiene método patch).
     */
    marcarComoVenta(id: number, activo: boolean = true): Observable<Tramite> {
        return this.api.post<Tramite>(`${this.endpoint}/${id}/marcar-venta?activo=${activo}`, {});
    }

    getVentasPendientes(): Observable<Tramite[]> {
        return this.api.get<any[]>(`${this.endpoint}/ventas-pendientes`).pipe(
            map((lista: any[]) => (lista || []).map((t: any) => ({
                ...t,
                idContrato: t.idContrato ?? t.contrato?.idContrato
            })))
        );
    }
}

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
    private endpoint = 'seguimiento';
    constructor(private api: ApiService) { }
    getByTramite(idTramite: number): Observable<Seguimiento[]> { return this.api.get<Seguimiento[]>(`${this.endpoint}/tramite/${idTramite}`); }
    create(data: Seguimiento): Observable<Seguimiento> { return this.api.post<Seguimiento>(this.endpoint, data); }
    delete(id: number): Observable<void> { return this.api.delete<void>(`${this.endpoint}/${id}`); }
}

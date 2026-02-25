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
    email?: string;
    direccionFiscalCompleta?: string;
    codigoPostal?: string;
    cuentaBancaria?: string;
    fechaAlta?: string;
    creadoPor?: string;
    modificadoPor?: string;
    fechaModificacion?: string;
    telefonos?: ClienteTelefono[];
}

export interface ClienteTelefono {
    idTelefono?: number;
    telefono: string;
    descripcion?: string;
}

export interface LocalUbicacion {
    idUbicacion?: number;
    nombre: string;
    descripcion?: string;
    orden?: number;
}

export interface LocalArea {
    idArea?: number;
    nombre: string;
    orden?: number;
    ubicaciones?: LocalUbicacion[];
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
    creadoPor?: string;
    modificadoPor?: string;
    fechaModificacion?: string;
    /** Cuando el backend devuelve el local con cliente anidado (GET por id). */
    cliente?: Cliente;
    areas?: LocalArea[];
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
    estado?: string;
    anularHijos?: boolean; // Solo para envío en update
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
    creadoPor?: string;
    modificadoPor?: string;
    fechaModificacion?: string | Date;
    esUrgente?: boolean;
    detalleSeguimiento?: string;
    fechaEjecucion?: string | Date;
    facturado?: boolean;
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
    nombreProveedor?: string;
    nombreCreador?: string;
    fechaRegistro?: string;
    modificadoPor?: string;
    fechaModificacion?: string;
}

export interface Cita {
    idCita?: number;
    clienteId: number;
    usuarioId: number;
    titulo: string;
    estado?: string;
    enlaceRemoto?: string;
    notas?: string;
    fechaInicio: string;
    fechaFin: string;
    recordatorioMin?: number;
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
    fechaInicio?: string;
    fechaVencimiento?: string;
    facturado?: boolean;
}

export interface Proveedor {
    idProveedor?: number;
    nombreComercial: string;
    razonSocial: string;
    cif: string;
    direcciónFiscal: string;
    esAutonomo: boolean;
    fechaAlta?: string;
    creadoPor?: string;
    modificadoPor?: string;
    fechaModificacion?: string;
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

    checkDni(dni: string): Observable<Cliente> {
        return this.api.get<Cliente>(`${this.endpoint}/check-dni/${dni}`);
    }

    getArchivos(id: number): Observable<ArchivoCliente[]> {
        return this.api.get<ArchivoCliente[]>(`clientes/${id}/archivos`);
    }

    subirArchivo(id: number, file: File): Observable<ArchivoCliente> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post<ArchivoCliente>(`clientes/${id}/archivos`, formData);
    }

    deleteArchivo(fileId: number): Observable<void> {
        return this.api.delete<void>(`clientes/archivos/${fileId}`);
    }
}

export interface ArchivoCliente {
    idArchivo: number;
    clienteId: number;
    nombreVisible: string;
    tipoArchivo: string;
    url: string;
    fechaSubida: string;
    usuarioSubida: string;
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
    checkRC(rc: string): Observable<Local> {
        return this.api.get<Local>(`${this.endpoint}/check-rc/${rc}`);
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

export interface TramiteListResponse {
    idTramite: number;
    idContrato: number;
    tipoTramite: string;
    estado: string;
    fechaSeguimiento?: string;
    esUrgente?: boolean;
    tecnicoAsignado?: string;
    nombreCliente?: string;
    direccionLocal?: string;
    detalleSeguimiento?: string;
}

@Injectable({ providedIn: 'root' })
export class TramiteService {
    private endpoint = 'tramites';
    constructor(private api: ApiService) { }

    getList(): Observable<TramiteListResponse[]> { return this.api.get<TramiteListResponse[]>(`${this.endpoint}/list`); }
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
    getAll(estado?: string): Observable<Seguimiento[]> {
        const params = estado ? { estado } : undefined;
        return this.api.get<Seguimiento[]>(this.endpoint, params);
    }
    create(data: Seguimiento): Observable<Seguimiento> { return this.api.post<Seguimiento>(this.endpoint, data); }
    update(id: number, data: Partial<Seguimiento>): Observable<Seguimiento> { return this.api.put<Seguimiento>(`${this.endpoint}/${id}`, data); }
    delete(id: number): Observable<void> { return this.api.delete<void>(`${this.endpoint}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class CitaService {
    private endpoint = 'citas';
    constructor(private api: ApiService) { }
    listByRange(from: string, to: string): Observable<Cita[]> {
        return this.api.get<Cita[]>(this.endpoint, { from, to });
    }
    create(data: Cita): Observable<Cita> { return this.api.post<Cita>(this.endpoint, data); }
    update(id: number, data: Cita): Observable<Cita> { return this.api.put<Cita>(`${this.endpoint}/${id}`, data); }
    delete(id: number): Observable<void> { return this.api.delete<void>(`${this.endpoint}/${id}`); }
}
@Injectable({ providedIn: 'root' })
export class LocalAreaService {
    private endpoint = 'local-areas';
    constructor(private api: ApiService) { }

    addArea(localId: number, area: LocalArea): Observable<LocalArea> {
        return this.api.post<LocalArea>(`${this.endpoint}/${localId}`, area);
    }

    deleteArea(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/${id}`);
    }

    addUbicacion(areaId: number, ubi: LocalUbicacion): Observable<LocalUbicacion> {
        return this.api.post<LocalUbicacion>(`${this.endpoint}/${areaId}/ubicaciones`, ubi);
    }

    deleteUbicacion(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/ubicaciones/${id}`);
    }
}

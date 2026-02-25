import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AnalyticsTramite {
    idTramite: number;
    idContrato: number;
    tipoTramite: string;
    estado: string;
    esUrgente?: boolean;
    facturado?: boolean;
    fechaCreacion?: string;
    fechaEjecucion?: string;
    /** Duración calculada en días (null si no ha finalizado). */
    duracionDias?: number | null;
    tipoContrato?: string;
    nombreCliente?: string;
    apellido1Cliente?: string;
    dniCliente?: string;
    direccionLocal?: string;
    tecnicoAsignado?: string;
    detalleSeguimiento?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;      // current page (0-based)
    size: number;
}

export interface AnalyticsFilter {
    tipoTramite?: string;
    estado?: string;
    tecnico?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    size?: number;
    sort?: string;
    dir?: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private endpoint = 'analytics/tramites';

    constructor(private api: ApiService) { }

    getTramites(filter: AnalyticsFilter = {}): Observable<PageResponse<AnalyticsTramite>> {
        // Build a params object, omitting undefined/empty values
        const params: Record<string, string> = {};
        if (filter.tipoTramite) params['tipoTramite'] = filter.tipoTramite;
        if (filter.estado) params['estado'] = filter.estado;
        if (filter.tecnico) params['tecnico'] = filter.tecnico;
        if (filter.fechaDesde) params['fechaDesde'] = filter.fechaDesde;
        if (filter.fechaHasta) params['fechaHasta'] = filter.fechaHasta;
        params['page'] = String(filter.page ?? 0);
        params['size'] = String(filter.size ?? 20);
        params['sort'] = filter.sort ?? 'fechaCreacion';
        params['dir'] = filter.dir ?? 'desc';

        return this.api.get<PageResponse<AnalyticsTramite>>(this.endpoint, params);
    }
}

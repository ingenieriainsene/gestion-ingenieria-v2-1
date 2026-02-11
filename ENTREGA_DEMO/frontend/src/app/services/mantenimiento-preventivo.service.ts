import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PresupuestoPreventivoTarea {
  idTareaPrev?: number;
  nombre: string;
  descripcion?: string;
  frecuenciaMeses: number;
  orden?: number;
  activo?: boolean;
}

export interface PresupuestoPreventivo {
  idPresupuestoPrev?: number;
  clienteId: number;
  viviendaId: number;
  fecha: string;
  estado?: string;
  notas?: string;
  tareas: PresupuestoPreventivoTarea[];
}

export interface ContratoMantenimientoTarea {
  idTareaContrato?: number;
  nombre: string;
  descripcion?: string;
  frecuenciaMeses: number;
  orden?: number;
  activo?: boolean;
}

export interface ContratoMantenimiento {
  idContratoMant?: number;
  presupuestoPrevId?: number;
  contratoId?: number;
  clienteId: number;
  viviendaId: number;
  fechaInicio: string;
  estado?: string;
  tareas: ContratoMantenimientoTarea[];
}

export interface AvisoMantenimientoDetalle {
  idAvisoDet?: number;
  tareaContratoId: number;
  tareaNombre?: string;
  estado?: string;
}

export interface AvisoMantenimiento {
  idAviso?: number;
  contratoId: number;
  fechaProgramada: string;
  estado?: string;
  detalles?: AvisoMantenimientoDetalle[];
}

export interface GenerarAvisosRequest {
  hasta?: string;
  tareas?: { tareaContratoId: number; fechaInicio: string }[];
}

export interface GenerarAvisosResponse {
  contratoId?: number;
  avisos: AvisoMantenimiento[];
}

@Injectable({ providedIn: 'root' })
export class MantenimientoPreventivoService {
  private presupuestoEndpoint = 'presupuestos-preventivos';
  private contratoEndpoint = 'contratos-mantenimiento';

  constructor(private api: ApiService) {}

  getBudgets(): Observable<PresupuestoPreventivo[]> {
    return this.api.get<PresupuestoPreventivo[]>(this.presupuestoEndpoint);
  }

  getBudgetById(id: number): Observable<PresupuestoPreventivo> {
    return this.api.get<PresupuestoPreventivo>(`${this.presupuestoEndpoint}/${id}`);
  }

  updateBudget(id: number, payload: PresupuestoPreventivo): Observable<PresupuestoPreventivo> {
    return this.api.put<PresupuestoPreventivo>(`${this.presupuestoEndpoint}/${id}`, payload);
  }

  getContratoByBudget(id: number): Observable<ContratoMantenimiento> {
    return this.api.get<ContratoMantenimiento>(`${this.presupuestoEndpoint}/${id}/contrato`);
  }

  approveBudget(id: number): Observable<ContratoMantenimiento> {
    return this.api.post<ContratoMantenimiento>(`${this.presupuestoEndpoint}/${id}/approve`, {});
  }

  crearContratoDesdePresupuesto(id: number): Observable<ContratoMantenimiento> {
    return this.api.post<ContratoMantenimiento>(`presupuestos/${id}/preventivo/contrato`, {});
  }

  getContratoById(id: number): Observable<ContratoMantenimiento> {
    return this.api.get<ContratoMantenimiento>(`${this.contratoEndpoint}/${id}`);
  }

  getAvisosByContrato(id: number): Observable<AvisoMantenimiento[]> {
    return this.api.get<AvisoMantenimiento[]>(`${this.contratoEndpoint}/${id}/avisos`);
  }

  generarAvisos(id: number, payload: GenerarAvisosRequest): Observable<GenerarAvisosResponse> {
    const url = `${this.contratoEndpoint}/${id}/avisos/generar`;
    return this.api.post<GenerarAvisosResponse>(url, payload || {});
  }
}

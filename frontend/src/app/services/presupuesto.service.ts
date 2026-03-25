import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface PresupuestoLineaDTO {
  idLinea?: string;
  orden?: number;
  productoId?: number | null;
  productoTexto?: string;
  concepto: string;
  ivaPorcentaje?: number;
  costeUnitario?: number;
  factorMargen?: number;
  totalCoste?: number;
  pvpUnitario?: number;
  totalPvp?: number;
  importeIva?: number;
  totalFinal?: number;
  tipoJerarquia?: 'CAPITULO' | 'PARTIDA';
  codigoVisual?: string;
  padreId?: string | null;
  cantidad?: number;
  numVisitas?: number;
  precioUnitario?: number;
  totalLinea?: number;
  hijos?: PresupuestoLineaDTO[];
}

export interface PresupuestoDTO {
  idPresupuesto?: number;
  clienteId: number;
  viviendaId: number;
  codigoReferencia?: string;
  fecha: string;
  total?: number;
  totalSinIva?: number;
  totalConIva?: number;
  estado?: string;
  tipoPresupuesto?: string;
  fechaAceptacion?: string;
  diasValidez?: number;
  tramiteId?: number;
  lineas: PresupuestoLineaDTO[];
  creadoPor?: string;
  fechaAlta?: string;
  modificadoPor?: string;
  fechaModificacion?: string;
}

export interface PresupuestoListItem {
  idPresupuesto: number;
  codigoReferencia: string;
  fecha: string;
  total: number;
  estado: string;
  tipoPresupuesto?: string;
  fechaAceptacion?: string;
  diasValidez?: number;
  tramiteId?: number;
  clienteId: number;
  clienteNombre: string;
  viviendaId: number;
  viviendaDireccion: string;
  tipoLinea?: string;
  productoNombre?: string;
}

export interface ProductoItem {
  id: number;
  nombre: string;
  precio: number;
}

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private endpoint = 'presupuestos';

  constructor(private api: ApiService) { }

  getBudgets(): Observable<PresupuestoListItem[]> {
    return this.api.get<PresupuestoListItem[]>(this.endpoint);
  }

  getById(id: number): Observable<PresupuestoDTO> {
    return this.api.get<PresupuestoDTO>(`${this.endpoint}/${id}`);
  }

  createBudget(payload: PresupuestoDTO): Observable<PresupuestoDTO> {
    return this.api.post<PresupuestoDTO>(this.endpoint, payload);
  }

  updateBudget(id: number, payload: PresupuestoDTO): Observable<PresupuestoDTO> {
    return this.api.put<PresupuestoDTO>(`${this.endpoint}/${id}`, payload);
  }

  deleteBudget(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  patchEstado(id: number, estado: string, diasValidez?: number): Observable<PresupuestoDTO> {
    const payload = { estado, diasValidez };
    return this.api.patch<PresupuestoDTO>(`${this.endpoint}/${id}/estado`, payload);
  }

  convertirAContrato(id: number): Observable<number> {
    return this.api.post<number>(`${this.endpoint}/${id}/convertir-a-contrato`, {});
  }

  downloadPdf(id: number, type: 'simple' | 'detallado' = 'simple'): Observable<Blob> {
    const detallado = type === 'detallado';
    return this.api.getBlob(`${this.endpoint}/${id}/pdf?detallado=${detallado}`);
  }

  getProducts(): Observable<ProductoItem[]> {
    return this.api.get<ProductoItem[]>('productos').pipe(
      catchError(() => of([]))
    );
  }

  getByTramite(tramiteId: number): Observable<PresupuestoListItem[]> {
    return this.api.get<PresupuestoListItem[]>(`${this.endpoint}/tramite/${tramiteId}`);
  }

  getByCliente(clienteId: number): Observable<PresupuestoListItem[]> {
    return this.api.get<PresupuestoListItem[]>(`${this.endpoint}/cliente/${clienteId}`);
  }

  vincularTramite(id: number, tramiteId: number): Observable<PresupuestoDTO> {
    return this.api.patch<PresupuestoDTO>(`${this.endpoint}/${id}/vincular-tramite/${tramiteId}`, {});
  }
}

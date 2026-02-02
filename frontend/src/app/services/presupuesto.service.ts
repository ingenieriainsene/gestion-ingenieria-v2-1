import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface PresupuestoLineaDTO {
  idLinea?: number;
  orden?: number;
  productoId?: number | null;
  productoTexto?: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  totalLinea?: number;
}

export interface PresupuestoDTO {
  idPresupuesto?: number;
  clienteId: number;
  viviendaId: number;
  codigoReferencia?: string;
  fecha: string;
  total?: number;
  estado?: string;
  lineas: PresupuestoLineaDTO[];
}

export interface PresupuestoListItem {
  idPresupuesto: number;
  codigoReferencia: string;
  fecha: string;
  total: number;
  estado: string;
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

  constructor(private api: ApiService) {}

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

  getProducts(): Observable<ProductoItem[]> {
    return this.api.get<ProductoItem[]>('productos').pipe(
      catchError(() => of([]))
    );
  }
}

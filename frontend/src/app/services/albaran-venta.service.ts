import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AlbaranVentaLineaDTO {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  totalLinea: number;
  totalIva: number;
  totalConIva: number;
}

export interface AlbaranVentaDTO {
  idAlbaran: number;
  numeroAlbaran: string;
  fecha: string;
  subtotal: number;
  iva: number;
  total: number;
  presupuestoId?: number | null;
  tramiteId?: number | null;
  lineas: AlbaranVentaLineaDTO[];
}

export interface AlbaranVentaCreateDTO {
  idAlbaran: number;
  numeroAlbaran: string;
  fecha: string;
  importe: number;
  presupuestoId?: number | null;
  tramiteId?: number | null;
  existente?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AlbaranVentaService {
  private endpoint = 'albaranes-venta';

  constructor(private api: ApiService) { }

  crearDesdePresupuesto(presupuestoId: number): Observable<AlbaranVentaCreateDTO> {
    return this.api.post<AlbaranVentaCreateDTO>(`${this.endpoint}/presupuesto/${presupuestoId}`, {});
  }

  getByTramite(tramiteId: number): Observable<AlbaranVentaDTO[]> {
    return this.api.get<AlbaranVentaDTO[]>(`${this.endpoint}/tramite/${tramiteId}`);
  }
}

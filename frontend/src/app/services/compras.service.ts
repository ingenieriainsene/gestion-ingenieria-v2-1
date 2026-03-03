import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CompraDocumentoLineaDTO {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  totalLinea: number;
  totalIva: number;
  totalConIva: number;
}

export interface CompraDocumentoDTO {
  idDocumento: number;
  tipo: 'ALBARAN' | 'FACTURA';
  idProveedor?: number | null;
  proveedorNombre?: string;
  numeroDocumento: string;
  fecha: string;
  subtotal: number;
  iva: number;
  total: number;
  estado?: string | null;
  notas?: string | null;
  lineas: CompraDocumentoLineaDTO[];
}

export interface CompraDocumentoCreateRequest {
  tipo: 'ALBARAN' | 'FACTURA';
  idProveedor: number;
  numeroDocumento: string;
  fecha: string;
  importe?: number;
  estado?: string | null;
  notas?: string | null;
  lineas?: CompraDocumentoLineaDTO[];
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private endpoint = 'compras';

  constructor(private api: ApiService) { }

  getDocumentosByTramite(tramiteId: number): Observable<CompraDocumentoDTO[]> {
    return this.api.get<CompraDocumentoDTO[]>(`${this.endpoint}/tramite/${tramiteId}`);
  }

  crearDocumento(tramiteId: number, payload: CompraDocumentoCreateRequest): Observable<CompraDocumentoDTO> {
    return this.api.post<CompraDocumentoDTO>(`${this.endpoint}/tramite/${tramiteId}/documento`, payload);
  }

  eliminarDocumento(tipo: 'ALBARAN' | 'FACTURA', idDocumento: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/documento/${tipo}/${idDocumento}`);
  }
}

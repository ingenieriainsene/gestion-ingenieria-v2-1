import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  private endpoint = 'documentos';

  constructor(private api: ApiService) { }

  descargarAlbaran(presupuestoId: number): Observable<Blob> {
    return this.api.getBlob(`${this.endpoint}/albaran/${presupuestoId}`);
  }

  descargarAlbaranVenta(albaranId: number): Observable<Blob> {
    return this.api.getBlob(`${this.endpoint}/albaran-venta/${albaranId}`);
  }

  descargarFactura(presupuestoId: number): Observable<Blob> {
    return this.api.getBlob(`${this.endpoint}/factura/${presupuestoId}`);
  }
}

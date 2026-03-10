import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { VentaDocumentoDTO, VentaDocumentoCreateRequest } from './domain.services';

@Injectable({ providedIn: 'root' })
export class VentaDocumentosService {
  private endpoint = 'ventas';

  constructor(private api: ApiService) { }

  getByTramite(idTramite: number): Observable<VentaDocumentoDTO[]> {
    return this.api.get<VentaDocumentoDTO[]>(`${this.endpoint}/tramite/${idTramite}/documentos`);
  }

  crearDocumento(idTramite: number, payload: VentaDocumentoCreateRequest): Observable<VentaDocumentoDTO> {
    return this.api.post<VentaDocumentoDTO>(`${this.endpoint}/tramite/${idTramite}/documentos`, payload);
  }
}


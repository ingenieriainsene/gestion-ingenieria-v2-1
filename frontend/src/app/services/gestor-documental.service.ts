import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ArchivoAdjuntoDTO {
  idArchivo: string;
  entidadTipo: string;
  entidadId: number;
  nombreOriginal: string;
  nombreDisco: string;
  tipoMime?: string | null;
  tamanoBytes?: number | null;
  fechaCreacion?: string | null;
}

@Injectable({ providedIn: 'root' })
export class GestorDocumentalService {
  private base = 'documentos/adjuntos';

  constructor(private api: ApiService) { }

  listar(entidadTipo: string, entidadId: number): Observable<ArchivoAdjuntoDTO[]> {
    return this.api.get<ArchivoAdjuntoDTO[]>(`${this.base}/${entidadTipo}/${entidadId}`);
  }

  subir(entidadTipo: string, entidadId: number, file: File): Observable<ArchivoAdjuntoDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<ArchivoAdjuntoDTO>(`${this.base}/${entidadTipo}/${entidadId}`, formData);
  }

  descargar(idArchivo: string, download = true): Observable<Blob> {
    const flag = download ? 'true' : 'false';
    return this.api.getBlob(`${this.base}/${idArchivo}?download=${flag}`);
  }

  eliminar(idArchivo: string): Observable<void> {
    return this.api.delete<void>(`${this.base}/${idArchivo}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface AuditoriaSesion {
  idSesion: number;
  idUsuario: number;
  nombreUsuario: string;
  fechaInicio: string;
  fechaFin?: string;
  fechaUltimaActividad: string;
  ipAcceso: string;
  estado: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Servicio especializado para consultar la auditoría de sesiones
 * usando la paginación nativa de Spring (Page<T>).
 */
@Injectable({ providedIn: 'root' })
export class AuditoriaSesionService {

  private readonly baseUrl = `${environment.apiUrl}/auditoria-sesiones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene una página de sesiones de auditoría.
   * @param page índice de página (0-based)
   * @param size tamaño de página
   */
  getSesiones(page: number, size: number): Observable<PageResponse<AuditoriaSesion>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http.get<PageResponse<AuditoriaSesion>>(this.baseUrl, { params });
  }
}


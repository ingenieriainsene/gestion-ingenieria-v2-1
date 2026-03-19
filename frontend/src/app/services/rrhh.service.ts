import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmpleadoResponse {
  id: string;
  nombreCompleto: string;
  dniNie: string;
  puesto: string;
  estado: string;
}

export interface CreateEmpleadoRequest {
  nombreCompleto: string;
  dniNie: string;
  puesto: string;
  fechaAlta: string;
}

export interface SolicitarAusenciaRequest {
  empleadoId: string;
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
}

@Injectable({
  providedIn: 'root'
})
export class RrhhService {
  private apiUrl = '/api/rrhh';

  constructor(private http: HttpClient) {}

  onboardEmployee(req: CreateEmpleadoRequest): Observable<EmpleadoResponse> {
    return this.http.post<EmpleadoResponse>(`${this.apiUrl}/empleados`, req);
  }

  offboardEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/empleados/${id}`);
  }

  requestAbsence(req: SolicitarAusenciaRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/ausencias`, req);
  }
}

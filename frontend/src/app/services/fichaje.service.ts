import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface EstadoFichajeDTO {
  estado: string; // TRABAJANDO, EN_PAUSA, FINALIZADO, SIN_INICIAR
  horaEntrada: string;
  horaSalida: string;
  minutosPausa: number;
}

@Injectable({
  providedIn: 'root'
})
export class FichajeService {
  private apiUrl = '/api/fichajes';

  private estadoSubject = new BehaviorSubject<EstadoFichajeDTO | null>(null);
  estado$ = this.estadoSubject.asObservable();

  constructor(private http: HttpClient) {}

  obtenerEstadoActual(): Observable<EstadoFichajeDTO> {
    return this.http.get<EstadoFichajeDTO>(`${this.apiUrl}/estado`).pipe(
      tap(estado => this.estadoSubject.next(estado))
    );
  }

  iniciarJornada(): Observable<EstadoFichajeDTO> {
    return this.http.post<EstadoFichajeDTO>(`${this.apiUrl}/iniciar`, {}).pipe(
      tap(estado => this.estadoSubject.next(estado))
    );
  }

  iniciarPausa(): Observable<EstadoFichajeDTO> {
    return this.http.post<EstadoFichajeDTO>(`${this.apiUrl}/pausa/iniciar`, {}).pipe(
      tap(estado => this.estadoSubject.next(estado))
    );
  }

  finalizarPausa(): Observable<EstadoFichajeDTO> {
    return this.http.post<EstadoFichajeDTO>(`${this.apiUrl}/pausa/finalizar`, {}).pipe(
      tap(estado => this.estadoSubject.next(estado))
    );
  }

  finalizarJornada(): Observable<EstadoFichajeDTO> {
    return this.http.post<EstadoFichajeDTO>(`${this.apiUrl}/finalizar`, {}).pipe(
      tap(estado => this.estadoSubject.next(estado))
    );
  }

  getEstadoActualSync(): EstadoFichajeDTO | null {
    return this.estadoSubject.getValue();
  }
}

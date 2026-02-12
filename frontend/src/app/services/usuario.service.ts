import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Usuario {
  idUsuario?: number;
  nombreUsuario: string;
  passwordHash: string;
  rol: 'ADMIN' | 'TÉCNICO' | 'LECTURA';
  email?: string;
  fechaCreacion?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private endpoint = 'usuarios';

  constructor(private api: ApiService) { }

  getAll(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>(this.endpoint);
  }

  getTecnicos(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>(`${this.endpoint}/tecnicos`);
  }

  getById(id: number): Observable<Usuario> {
    return this.api.get<Usuario>(`${this.endpoint}/${id}`);
  }

  create(data: Usuario): Observable<Usuario> {
    return this.api.post<Usuario>(this.endpoint, data);
  }

  update(id: number, data: Usuario): Observable<Usuario> {
    return this.api.put<Usuario>(`${this.endpoint}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}


import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface ChatMessage {
  idMensaje?: number;
  salaId: number;
  usuarioId: number;
  usuarioNombre?: string;
  contenido: string;
  fechaEnvio?: string;
  adjuntos?: { url: string; tipo?: string; nombre?: string }[];
  menciones?: number[];
}

export interface ChatSala {
  idSala: number;
  nombre: string;
  esGlobal?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private endpoint = 'chat';
  constructor(private api: ApiService) { }

  getSalaGeneral(): Observable<ChatSala> {
    return this.api.get<ChatSala>(`${this.endpoint}/sala-general`);
  }

  getMensajes(salaId: number): Observable<ChatMessage[]> {
    return this.api.get<ChatMessage[]>(`${this.endpoint}/mensajes`, { salaId: String(salaId) });
  }

  marcarLeido(mensajeId: number, usuarioId: number): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/lecturas`, { mensajeId, usuarioId });
  }

  upload(file: File): Observable<{ url: string; tipo?: string; nombre?: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.api.post<{ url: string; tipo?: string; nombre?: string }>(`${this.endpoint}/adjuntos`, form);
  }

  getMisChats(usuarioId: number): Observable<ChatSala[]> {
    return this.api.get<ChatSala[]>(`${this.endpoint}/mis-chats`, { usuarioId: String(usuarioId) });
  }

  iniciarPrivado(usuario1Id: number, usuario2Id: number): Observable<ChatSala> {
    return this.api.post<ChatSala>(`${this.endpoint}/iniciar-privado?usuario1Id=${usuario1Id}&usuario2Id=${usuario2Id}`, {});
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage, ChatSala } from '../models/chat.model';

/**
 * Servicio para interactuar con la API REST de chat.
 * Complementa el WebSocketService para operaciones que no son en tiempo real.
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8082/api/chat';

  constructor(private http: HttpClient) { }

  /**
   * Obtener las salas de chat del usuario.
   */
  getMisChats(usuarioId: number): Observable<ChatSala[]> {
    const params = new HttpParams().set('usuarioId', usuarioId.toString());
    return this.http.get<ChatSala[]>(`${this.apiUrl}/mis-chats`, { params });
  }

  /**
   * Iniciar un chat privado con otro usuario.
   */
  iniciarChatPrivado(usuario1Id: number, usuario2Id: number): Observable<ChatSala> {
    const params = new HttpParams()
      .set('usuario1Id', usuario1Id.toString())
      .set('usuario2Id', usuario2Id.toString());
    return this.http.post<ChatSala>(`${this.apiUrl}/iniciar-privado`, null, { params });
  }

  /**
   * Obtener la sala general (pública).
   */
  getSalaGeneral(): Observable<ChatSala> {
    return this.http.get<ChatSala>(`${this.apiUrl}/sala-general`);
  }

  /**
   * Obtener el historial de mensajes de una sala.
   */
  getMensajes(salaId: number): Observable<ChatMessage[]> {
    const params = new HttpParams().set('salaId', salaId.toString());
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/mensajes`, { params });
  }

  /**
   * Marcar un mensaje como leído.
   */
  marcarLeido(mensajeId: number, usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/lecturas`, { mensajeId, usuarioId });
  }

  /**
   * Subir un archivo adjunto.
   */
  subirAdjunto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/adjuntos`, formData);
  }
}

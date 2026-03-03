import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage, ChatRoom, ChatUser, PrivateChatRequest } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de salas disponibles desde el backend (Spring Boot)
   */
  getRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>('/api/chat/rooms');
  }

  getMessagesByRoom(roomId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`/api/chat/rooms/${roomId}/messages`);
  }

  /**
   * Envía un mensaje a través del backend de Spring Boot
   */
  sendMessage(roomId: string, content: string, senderId: string): Observable<ChatMessage> {
    const message = {
      room_id: roomId,
      content: content,
      sender_id: senderId || null
    };

    return this.http.post<ChatMessage>('/api/chat/messages', message);
  }

  /**
   * Crea una nueva sala a través del backend (Spring Boot)
   */
  createRoom(name: string, isGroup: boolean): Observable<ChatRoom> {
    return this.http.post<ChatRoom>('/api/chat/rooms', { name, is_group: isGroup });
  }

  deleteRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`/api/chat/rooms/${roomId}`);
  }

  /**
   * Obtiene la identidad del chat del usuario actual desde el backend
   */
  getMyIdentity(): Observable<{ username: string, chatId: string }> {
    return this.http.get<{ username: string, chatId: string }>('/api/chat/me');
  }

  getUsers(): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>('/api/chat/users');
  }

  createPrivateRequest(toUserId: number): Observable<PrivateChatRequest> {
    return this.http.post<PrivateChatRequest>('/api/chat/private-requests', { to_user_id: toUserId });
  }

  getIncomingPrivateRequests(): Observable<PrivateChatRequest[]> {
    return this.http.get<PrivateChatRequest[]>('/api/chat/private-requests/incoming');
  }

  acceptPrivateRequest(id: number): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(`/api/chat/private-requests/${id}/accept`, {});
  }

  rejectPrivateRequest(id: number): Observable<string> {
    return this.http.post(`/api/chat/private-requests/${id}/reject`, { }, { responseType: 'text' });
  }
}

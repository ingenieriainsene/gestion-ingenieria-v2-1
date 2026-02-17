import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environments';
import { ChatMessage, ChatRoom } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private supabase: SupabaseClient;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);

  constructor(private http: HttpClient) {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
  }

  /**
   * Obtiene la lista de salas disponibles desde el backend (Spring Boot)
   */
  getRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>('/api/chat/rooms');
  }

  /**
   * Se suscribe a los cambios en tiempo real de una sala específica
   */
  subscribeToRoom(roomId: string): Observable<ChatMessage[]> {
    this.messagesSubject.next([]);
    this.loadInitialMessages(roomId);

    // Saneamiento de canales: Cerramos todo lo anterior para evitar listeners duplicados
    this.supabase.removeAllChannels();

    const channel = this.supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        const currentMessages = this.messagesSubject.value;

        // Prevención de duplicación por eco de Realtime
        if (!currentMessages.some(m => m.id === newMessage.id)) {
          const updatedMessages = [...currentMessages, newMessage].sort((a, b) =>
            new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
          );
          this.messagesSubject.next(updatedMessages);
        }
      })
      .subscribe((status) => {
        console.log(`[ChatService] Subscription status for room ${roomId}:`, status);
      });

    return this.messagesSubject.asObservable();
  }

  private async loadInitialMessages(roomId: string) {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      this.messagesSubject.next(data as ChatMessage[]);
    }
  }

  /**
   * Envía un mensaje a través del backend de Spring Boot
   */
  async sendMessage(roomId: string, content: string, senderId: string): Promise<ChatMessage> {
    const message = {
      room_id: roomId,
      content: content,
      sender_id: senderId || null
    };

    return this.http.post<ChatMessage>('/api/chat/messages', message).toPromise() as Promise<ChatMessage>;
  }

  /**
   * Crea una nueva sala a través del backend (Spring Boot)
   */
  createRoom(name: string, isGroup: boolean): Observable<ChatRoom> {
    return this.http.post<ChatRoom>('/api/chat/rooms', { name, is_group: isGroup });
  }

  /**
   * Obtiene la identidad del chat del usuario actual desde el backend
   */
  getMyIdentity(): Observable<{ username: string, chatId: string }> {
    return this.http.get<{ username: string, chatId: string }>('/api/chat/me');
  }
}

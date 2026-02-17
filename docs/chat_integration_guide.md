# 🏗️ Arquitectura de Chat Realtime: Guía Técnica

Esta guía describe cómo implementar un sistema de chat profesional utilizando **Supabase Realtime** como infraestructura de mensajería, liberando al Backend de la gestión de WebSockets.

## 1. Diseño de Base de Datos (SQL)
Se ha generado el archivo `sql/chat_realtime.sql` que contiene:
- Tablas con UUIDs: `chat_rooms`, `chat_messages`, `chat_user_rooms`.
- **RLS (Row Level Security)**: Los usuarios solo pueden ver/enviar mensajes de las salas donde están registrados.
- **Configuración Realtime**: Activación de réplica lógica para `chat_messages`.

## 2. Responsabilidades de Spring Boot
Para mantener una arquitectura escalable, Spring Boot actúa como el **Cerebro de Gestión**:
- **Creación de Salas**: El cliente pide al backend crear una sala (validando que los participantes existan).
- **Gestión de Miembros**: Solo el backend puede añadir o eliminar usuarios de `chat_user_rooms` para evitar que usuarios se "auto-inviten".
- **Moderación**: APIs para reportar mensajes o bloquear usuarios.

## 3. Implementación en Angular (`ChatService`)

Necesitarás instalar el cliente: `npm install @supabase/supabase-js`

```typescript
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private supabase: SupabaseClient;
  private messagesSubject = new BehaviorSubject<any[]>([]);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Se suscribe a los mensajes de una sala en tiempo real
   */
  subscribeToRoom(roomId: string): Observable<any[]> {
    // 1. Cargar mensajes iniciales
    this.loadInitialMessages(roomId);

    // 2. Suscribirse a cambios (INSERTs)
    this.supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}` 
      }, (payload) => {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, payload.new]);
      })
      .subscribe();

    return this.messagesSubject.asObservable();
  }

  private async loadInitialMessages(roomId: string) {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (!error) this.messagesSubject.next(data);
  }

  /**
   * Envía un mensaje a través de Supabase (RLS validará el remitente)
   */
  async sendMessage(roomId: string, content: string, senderId: string) {
    const { error } = await this.supabase
      .from('chat_messages')
      .insert([
        { room_id: roomId, content, sender_id: senderId }
      ]);
    
    if (error) throw error;
  }
}
```

## 4. Ventajas de este Diseño
1. **Latencia mínima**: Los mensajes no pasan por el servidor Java, van directo de Supabase al cliente.
2. **Seguridad Total**: Aunque el cliente tenga la URL de Supabase, las **políticas RLS** impiden que lea mensajes ajenos.
3. **Escalabilidad**: Supabase maneja miles de conexiones concurrentes sin consumir recursos de tu servidor Spring Boot.

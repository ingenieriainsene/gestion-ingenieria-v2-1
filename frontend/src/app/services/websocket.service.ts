import { Injectable } from '@angular/core';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatMessage, ChatTypingNotification } from '../models/chat.model';

/**
 * Servicio para gestionar la conexión WebSocket con STOMP.
 * 
 * Características:
 * - Autenticación JWT en el handshake
 * - Reconexión automática
 * - Suscripción a mensajes públicos (/topic) y privados (/queue)
 * - Envío de mensajes y notificaciones de "escribiendo"
 */
@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private client: Client | null = null;
    private connected$ = new BehaviorSubject<boolean>(false);
    private publicMessages$ = new BehaviorSubject<ChatMessage | null>(null);
    private privateMessages$ = new BehaviorSubject<ChatMessage | null>(null);
    private typingNotifications$ = new BehaviorSubject<ChatTypingNotification | null>(null);

    private currentUserId: number | null = null;

    constructor() { }

    /**
     * Conectar al WebSocket con autenticación JWT.
     * @param token Token JWT del usuario autenticado
     * @param userId ID del usuario actual
     */
    connect(token: string, userId: number): void {
        if (this.client && this.client.connected) {
            console.log('[WebSocket] Ya conectado');
            return;
        }

        this.currentUserId = userId;

        const stompConfig: StompConfig = {
            // Usar SockJS como transporte
            webSocketFactory: () => new SockJS('http://localhost:8082/ws'),

            // Headers de conexión (incluir JWT)
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },

            // Heartbeat (ping/pong para mantener conexión)
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,

            // Reconexión automática
            reconnectDelay: 5000,

            // Debug
            debug: (str) => {
                console.log('[WebSocket Debug]', str);
            },

            // Callbacks
            onConnect: (frame) => {
                console.log('[WebSocket] Conectado:', frame);
                this.connected$.next(true);
                this.subscribeToChannels();
            },

            onStompError: (frame) => {
                console.error('[WebSocket] Error STOMP:', frame);
                this.connected$.next(false);
            },

            onWebSocketClose: (event) => {
                console.warn('[WebSocket] Conexión cerrada:', event);
                this.connected$.next(false);
            },

            onWebSocketError: (event) => {
                console.error('[WebSocket] Error WebSocket:', event);
            }
        };

        this.client = new Client(stompConfig);
        this.client.activate();
    }

    /**
     * Suscribirse a los canales de mensajes públicos y privados.
     */
    private subscribeToChannels(): void {
        if (!this.client || !this.client.connected) {
            console.error('[WebSocket] No conectado, no se puede suscribir');
            return;
        }

        // Suscripción a mensajes públicos (sala general)
        this.client.subscribe('/topic/chat.general', (message: IMessage) => {
            const chatMessage: ChatMessage = JSON.parse(message.body);
            console.log('[WebSocket] Mensaje público recibido:', chatMessage);
            this.publicMessages$.next(chatMessage);
        });

        // Suscripción a mensajes privados (usuario específico)
        this.client.subscribe(`/user/queue/chat.private`, (message: IMessage) => {
            const chatMessage: ChatMessage = JSON.parse(message.body);
            console.log('[WebSocket] Mensaje privado recibido:', chatMessage);
            this.privateMessages$.next(chatMessage);
        });

        // Suscripción a notificaciones de "escribiendo" (público)
        this.client.subscribe('/topic/chat.typing', (message: IMessage) => {
            const notification: ChatTypingNotification = JSON.parse(message.body);
            console.log('[WebSocket] Typing notification (público):', notification);
            this.typingNotifications$.next(notification);
        });

        // Suscripción a notificaciones de "escribiendo" (privado)
        this.client.subscribe(`/user/queue/chat.typing`, (message: IMessage) => {
            const notification: ChatTypingNotification = JSON.parse(message.body);
            console.log('[WebSocket] Typing notification (privado):', notification);
            this.typingNotifications$.next(notification);
        });

        console.log('[WebSocket] Suscrito a todos los canales');
    }

    /**
     * Enviar un mensaje de chat.
     * @param message Mensaje a enviar
     */
    sendMessage(message: any): void {
        if (!this.client || !this.client.connected) {
            console.error('[WebSocket] No conectado, no se puede enviar mensaje');
            return;
        }

        this.client.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(message)
        });

        console.log('[WebSocket] Mensaje enviado:', message);
    }

    /**
     * Notificar que el usuario está escribiendo.
     * @param salaId ID de la sala
     * @param usuarioId ID del usuario
     * @param usuarioNombre Nombre del usuario
     */
    sendTypingNotification(salaId: number, usuarioId: number, usuarioNombre: string): void {
        if (!this.client || !this.client.connected) {
            return;
        }

        this.client.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({ salaId, usuarioId, usuarioNombre })
        });
    }

    /**
     * Desconectar del WebSocket.
     */
    disconnect(): void {
        if (this.client) {
            this.client.deactivate();
            this.connected$.next(false);
            console.log('[WebSocket] Desconectado');
        }
    }

    /**
     * Observables para escuchar eventos.
     */
    get isConnected$(): Observable<boolean> {
        return this.connected$.asObservable();
    }

    get publicMessages(): Observable<ChatMessage | null> {
        return this.publicMessages$.asObservable();
    }

    get privateMessages(): Observable<ChatMessage | null> {
        return this.privateMessages$.asObservable();
    }

    get typingNotifications(): Observable<ChatTypingNotification | null> {
        return this.typingNotifications$.asObservable();
    }
}
